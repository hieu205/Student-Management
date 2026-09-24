using backend.Models;
using demo_dotnet.backend.exception;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace demo_dotnet.backend.Data.Repositories;

public class ChatRepository(AppDbContext context) : IChatRepository
{
    public Task<bool> AdminExistsAsync(int id) => context.Admins.AnyAsync(a => a.Id == id);
    public Task<bool> IsRoomMemberAsync(long roomId, int adminId) => context.ChatRooms
        .AnyAsync(r => r.Id == roomId && (r.Admin1Id == adminId || r.Admin2Id == adminId));

    public Task<ChatRoom?> GetRoomBetweenAdminsAsync(int admin1Id, int admin2Id) => context.ChatRooms
        .FirstOrDefaultAsync(r => r.Admin1Id == Math.Min(admin1Id, admin2Id) && r.Admin2Id == Math.Max(admin1Id, admin2Id));

    public async Task<ChatRoom> CreateRoomAsync(int admin1Id, int admin2Id)
    {
        var low = Math.Min(admin1Id, admin2Id);
        var high = Math.Max(admin1Id, admin2Id);
        var now = DateTime.UtcNow;
        await context.Database.ExecuteSqlInterpolatedAsync($"INSERT INTO chat_room (admin1_id, admin2_id, created_at, updated_at) VALUES ({low}, {high}, {now}, {now}) ON CONFLICT (admin1_id, admin2_id) DO NOTHING");
        return (await GetRoomBetweenAdminsAsync(low, high))!;
    }

    public Task<List<ChatRoom>> GetRoomsByAdminIdAsync(int adminId) => context.ChatRooms.AsNoTracking()
        .Include(r => r.Admin1).Include(r => r.Admin2).Include(r => r.Messages).ThenInclude(m => m.Attachments)
        .AsSplitQuery().Where(r => r.Admin1Id == adminId || r.Admin2Id == adminId)
        .OrderByDescending(r => r.UpdatedAt).ToListAsync();

    public async Task<ChatMessage> SaveMessageAsync(ChatMessage message, IReadOnlyCollection<Guid> attachmentIds, int maxFiles, long maxTotalBytes)
    {
        await using var transaction = await context.Database.BeginTransactionAsync();
        try
        {
            // Serialize retries even before the original message exists.
            if (message.ClientMessageId.HasValue)
            {
                var key = $"chat:{message.SenderId}:{message.ClientMessageId}";
                await context.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtextextended({key}, 0))");
                var previous = await context.ChatMessages.AsNoTracking().Include(m => m.Attachments).FirstOrDefaultAsync(m =>
                    m.SenderId == message.SenderId && m.ClientMessageId == message.ClientMessageId);
                if (previous != null)
                {
                    if (previous.ReceiverId != message.ReceiverId || previous.Content != message.Content ||
                        !previous.Attachments.Select(a => a.Id).ToHashSet().SetEquals(attachmentIds))
                        throw new ConflictException("ClientMessageId đã được dùng với nội dung khác.");
                    await transaction.CommitAsync();
                    return previous;
                }
            }

            var now = DateTime.UtcNow;
            var attachments = await context.ChatAttachments.AsNoTracking().Where(a => attachmentIds.Contains(a.Id)).ToListAsync();
            if (attachmentIds.Count > maxFiles || attachments.Count != attachmentIds.Count ||
                attachments.Any(a => a.UploaderId != message.SenderId || a.ReceiverId != message.ReceiverId ||
                    a.Status != AttachmentStatus.Pending || a.ExpiresAt <= now || a.ExpiresAt == null))
                throw new ConflictException("Tệp không hợp lệ, đã sử dụng hoặc hết hạn.");
            if (attachments.Sum(a => a.SizeBytes) > maxTotalBytes)
                throw new AppException("Tổng dung lượng tệp vượt giới hạn.", System.Net.HttpStatusCode.RequestEntityTooLarge);

            var room = await CreateRoomAsync(message.SenderId, message.ReceiverId);
            message.RoomId = room.Id;
            context.ChatMessages.Add(message);
            await context.SaveChangesAsync();

            // PostgreSQL rechecks this predicate after waiting for a concurrent update.
            var claimed = await context.ChatAttachments.Where(a => attachmentIds.Contains(a.Id) &&
                    a.Status == AttachmentStatus.Pending && a.ExpiresAt > now &&
                    a.UploaderId == message.SenderId && a.ReceiverId == message.ReceiverId)
                .ExecuteUpdateAsync(s => s.SetProperty(a => a.Status, AttachmentStatus.Attached)
                    .SetProperty(a => a.MessageId, (long?)message.Id).SetProperty(a => a.ExpiresAt, (DateTime?)null));
            if (claimed != attachmentIds.Count) throw new ConflictException("Tệp đang được gửi hoặc đã bị hủy.");
            await context.ChatRooms.Where(r => r.Id == room.Id)
                .ExecuteUpdateAsync(s => s.SetProperty(r => r.UpdatedAt, now));
            var savedMessage = await context.ChatMessages.AsNoTracking().Include(m => m.Attachments)
                .SingleAsync(m => m.Id == message.Id);
            await transaction.CommitAsync();
            return savedMessage;
        }
        catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.DeadlockDetected)
        {
            await transaction.RollbackAsync();
            context.ChangeTracker.Clear();
            throw new ConflictException("Có thao tác gửi đồng thời. Vui lòng thử lại với cùng ClientMessageId.");
        }
        catch
        {
            await transaction.RollbackAsync();
            context.ChangeTracker.Clear();
            throw;
        }
    }

    public async Task<List<ChatMessage>> GetMessagesByRoomIdAsync(long roomId, int page, int pageSize)
    {
        var messages = await context.ChatMessages.AsNoTracking().Include(m => m.Attachments)
            .Where(m => m.RoomId == roomId).OrderByDescending(m => m.CreatedAt).ThenByDescending(m => m.Id)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return messages.OrderBy(m => m.CreatedAt).ThenBy(m => m.Id).ToList();
    }

    public Task<ChatMessage?> GetMessageByIdAsync(long messageId) =>
        context.ChatMessages.AsNoTracking().Include(m => m.Attachments)
            .FirstOrDefaultAsync(m => m.Id == messageId);

    public async Task<bool> SoftDeleteMessageAsync(long messageId, int requesterAdminId)
    {
        var msg = await context.ChatMessages.FirstOrDefaultAsync(m => m.Id == messageId);
        if (msg == null) return false;
        if (msg.SenderId != requesterAdminId) return false;

        msg.IsDeleted = true;
        msg.DeletedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<List<ChatMessage>> SearchMessagesAsync(long roomId, int currentAdminId, string query, int page, int pageSize)
    {
        if (string.IsNullOrWhiteSpace(query)) return [];
        query = query.Trim();

        var messages = await context.ChatMessages.AsNoTracking()
            .Include(m => m.Attachments)
            .Where(m => m.RoomId == roomId && !m.IsDeleted && EF.Functions.ILike(m.Content, $"%{query}%"))
            .OrderByDescending(m => m.CreatedAt).ThenByDescending(m => m.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return messages.OrderBy(m => m.CreatedAt).ThenBy(m => m.Id).ToList();
    }

    public async Task MarkMessagesAsReadAsync(long roomId, int currentAdminId) =>
        await context.ChatMessages.Where(m => m.RoomId == roomId && m.ReceiverId == currentAdminId && !m.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(m => m.IsRead, true));

    public async Task AddAttachmentsAsync(List<ChatAttachment> attachments, CancellationToken cancellationToken)
    {
        context.ChatAttachments.AddRange(attachments);
        await context.SaveChangesAsync(cancellationToken);
    }

    public Task<ChatAttachment?> GetAttachmentAsync(Guid id, CancellationToken cancellationToken) => context.ChatAttachments
        .AsNoTracking().Include(a => a.Message).FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

    public async Task<bool> ClaimForDeletionAsync(Guid id, int? uploaderId, DateTime? expiredBefore, CancellationToken cancellationToken)
    {
        var query = context.ChatAttachments.Where(a => a.Id == id && a.MessageId == null);
        if (uploaderId.HasValue) query = query.Where(a => a.UploaderId == uploaderId);
        query = query.Where(a => a.Status == AttachmentStatus.Deleting ||
            (a.Status == AttachmentStatus.Pending && (!expiredBefore.HasValue || a.ExpiresAt <= expiredBefore)));
        return await query.ExecuteUpdateAsync(s => s.SetProperty(a => a.Status, AttachmentStatus.Deleting), cancellationToken) == 1;
    }

    public async Task CompleteDeletionAsync(Guid id, CancellationToken cancellationToken) =>
        await context.ChatAttachments.Where(a => a.Id == id && a.Status == AttachmentStatus.Deleting)
            .ExecuteDeleteAsync(cancellationToken);

    public Task<List<ChatAttachment>> GetCleanupCandidatesAsync(DateTime now, CancellationToken cancellationToken) =>
        context.ChatAttachments.AsNoTracking().Where(a => a.Status == AttachmentStatus.Deleting ||
            (a.Status == AttachmentStatus.Pending && a.ExpiresAt <= now)).OrderBy(a => a.CreatedAt)
            .Take(100).ToListAsync(cancellationToken);

    public Task<bool> StorageKeyExistsAsync(string key, CancellationToken cancellationToken) =>
        context.ChatAttachments.AnyAsync(a => a.StorageKey == key, cancellationToken);
}
