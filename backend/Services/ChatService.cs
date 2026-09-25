using System.Net;
using backend.Models;
using demo_dotnet.backend.Data.Repositories;
using demo_dotnet.backend.DTOs.request;
using demo_dotnet.backend.DTOs.response;
using demo_dotnet.backend.exception;
using demo_dotnet.backend.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace demo_dotnet.backend.Services;

public class ChatService(IChatRepository repository, IFileStorageService storage,
    IOptions<ChatAttachmentOptions> options, ILogger<ChatService> logger) : IChatService
{
    private readonly ChatAttachmentOptions _options = options.Value;

    private async Task ValidateParticipantsAsync(int senderId, int receiverId)
    {
        if (senderId <= 0 || !await repository.AdminExistsAsync(senderId)) throw new UnauthorizedException();
        if (senderId == receiverId) throw new BadRequestException("Không thể gửi tin nhắn cho chính mình.");
        if (receiverId <= 0 || !await repository.AdminExistsAsync(receiverId)) throw new BadRequestException("Người nhận không tồn tại.");
    }

    public async Task<long> GetOrCreateRoomIdAsync(int admin1Id, int admin2Id)
    {
        await ValidateParticipantsAsync(admin1Id, admin2Id);
        return (await repository.GetRoomBetweenAdminsAsync(admin1Id, admin2Id) ??
            await repository.CreateRoomAsync(admin1Id, admin2Id)).Id;
    }

    public async Task<ChatMessageResponse> SaveMessageAsync(int senderId, SendMessageRequest request)
    {
        if (request == null) throw new BadRequestException("Thiếu nội dung yêu cầu.");
        var ids = request.AttachmentIds ?? [];
        var content = request.Content ?? string.Empty;
        if (string.IsNullOrWhiteSpace(content) && ids.Count == 0) throw new BadRequestException("Tin nhắn phải có nội dung hoặc tệp.");
        if (ids.Count > _options.MaxFiles || ids.Contains(Guid.Empty) || ids.Distinct().Count() != ids.Count)
            throw new BadRequestException("Danh sách tệp không hợp lệ hoặc vượt giới hạn.");
        if (request.ClientMessageId == Guid.Empty) throw new BadRequestException("ClientMessageId không hợp lệ.");
        await ValidateParticipantsAsync(senderId, request.ReceiverId);
        var saved = await repository.SaveMessageAsync(new ChatMessage
        {
            SenderId = senderId, ReceiverId = request.ReceiverId, Content = content,
            ClientMessageId = request.ClientMessageId, CreatedAt = DateTime.UtcNow
        }, ids, _options.MaxFiles, _options.MaxTotalBytes);
        return MapMessage(saved);
    }

    public async Task<List<ChatRoomResponse>> GetUserRoomsAsync(int currentAdminId)
    {
        var rooms = await repository.GetRoomsByAdminIdAsync(currentAdminId);
        return rooms.Select(r =>
        {
            var partner = r.Admin1Id == currentAdminId ? r.Admin2 : r.Admin1;
            var last = r.Messages.OrderByDescending(m => m.CreatedAt).ThenByDescending(m => m.Id).FirstOrDefault();
            var preview = last?.IsDeleted == true ? "[Tin nhắn đã bị thu hồi]" : last?.Content;
            if (last != null && !last.IsDeleted && string.IsNullOrWhiteSpace(preview) && last.Attachments.Count > 0)
                preview = last.Attachments.Count > 1 ? $"[{last.Attachments.Count} tệp đính kèm]" :
                    last.Attachments.First().Kind == "Image" ? "[Ảnh]" : $"[Tệp: {last.Attachments.First().OriginalFileName}]";
            return new ChatRoomResponse
            {
                RoomId = r.Id, PartnerId = partner.Id,
                PartnerName = string.IsNullOrEmpty(partner.FullName) ? partner.Username : partner.FullName,
                LastMessage = preview, LastMessageTime = last?.CreatedAt,
                UnreadCount = r.Messages.Count(m => m.ReceiverId == currentAdminId && !m.IsRead && !m.IsDeleted)
            };
        }).ToList();
    }

    private async Task RequireMembershipAsync(long roomId, int adminId)
    {
        if (!await repository.IsRoomMemberAsync(roomId, adminId)) throw new NotFoundException("Không tìm thấy phòng chat.");
    }

    public async Task<List<ChatMessageResponse>> GetRoomMessagesAsync(long roomId, int currentAdminId, int page, int pageSize)
    {
        await RequireMembershipAsync(roomId, currentAdminId);
        if (page < 1 || pageSize < 1 || pageSize > 100 || (long)(page - 1) * pageSize > int.MaxValue)
            throw new BadRequestException("Phân trang không hợp lệ; pageSize phải từ 1 đến 100.");
        return (await repository.GetMessagesByRoomIdAsync(roomId, page, pageSize)).Select(MapMessage).ToList();
    }

    public async Task<List<ChatMessageResponse>> SearchMessagesAsync(long roomId, int currentAdminId, string query, int page, int pageSize)
    {
        await RequireMembershipAsync(roomId, currentAdminId);
        if (page < 1 || pageSize < 1 || pageSize > 100)
            throw new BadRequestException("Phân trang không hợp lệ.");
        if (string.IsNullOrWhiteSpace(query))
            return [];
        return (await repository.SearchMessagesAsync(roomId, currentAdminId, query, page, pageSize)).Select(MapMessage).ToList();
    }

    public async Task<ChatMessageResponse> SoftDeleteMessageAsync(long messageId, int currentAdminId)
    {
        var message = await repository.GetMessageByIdAsync(messageId);
        if (message == null) throw new NotFoundException("Không tìm thấy tin nhắn.");
        await RequireMembershipAsync(message.RoomId, currentAdminId);
        if (message.SenderId != currentAdminId)
            throw new ForbiddenException("Bạn chỉ có thể thu hồi/xóa tin nhắn của chính mình.");
        if (message.IsDeleted)
            throw new BadRequestException("Tin nhắn đã được thu hồi trước đó.");

        var success = await repository.SoftDeleteMessageAsync(messageId, currentAdminId);
        if (!success) throw new AppException("Không thể thu hồi tin nhắn.");

        message.IsDeleted = true;
        message.DeletedAt = DateTime.UtcNow;
        return MapMessage(message);
    }

    public async Task MarkAsReadAsync(long roomId, int currentAdminId)
    {
        await RequireMembershipAsync(roomId, currentAdminId);
        await repository.MarkMessagesAsReadAsync(roomId, currentAdminId);
    }

    public async Task<List<ChatAttachmentResponse>> UploadAttachmentsAsync(int uploaderId,
        UploadChatAttachmentsRequest request, CancellationToken cancellationToken)
    {
        await ValidateParticipantsAsync(uploaderId, request.ReceiverId);
        var files = request.Files;
        if (files == null || files.Count == 0 || files.Count > _options.MaxFiles)
            throw new BadRequestException($"Chọn từ 1 đến {_options.MaxFiles} tệp.");
        if (files.Any(f => f.Length <= 0)) throw new BadRequestException("Không chấp nhận tệp rỗng.");
        if (files.Any(f => f.Length > _options.MaxFileBytes) || files.Sum(f => f.Length) > _options.MaxTotalBytes)
            throw new AppException("Dung lượng tệp vượt giới hạn.", HttpStatusCode.RequestEntityTooLarge);
        var attachments = new List<ChatAttachment>();
        var writtenKeys = new List<string>();
        long total = 0;
        try
        {
            foreach (var file in files)
            {
                var name = ChatFileValidator.CleanFileName(file.FileName);
                var key = Guid.NewGuid().ToString("N");
                writtenKeys.Add(key);
                await using var source = file.OpenReadStream();
                var size = await storage.WriteAsync(key, source,
                    Math.Min(_options.MaxFileBytes, _options.MaxTotalBytes - total), cancellationToken);
                total += size;
                await using var stored = storage.OpenRead(key);
                var format = await ChatFileValidator.ValidateAsync(stored, name, _options, cancellationToken);
                var now = DateTime.UtcNow;
                attachments.Add(new ChatAttachment
                {
                    Id = Guid.NewGuid(), UploaderId = uploaderId, ReceiverId = request.ReceiverId,
                    OriginalFileName = name, StorageKey = key, ContentType = format.ContentType,
                    Kind = format.Kind, SizeBytes = size, Status = AttachmentStatus.Pending,
                    CreatedAt = now, ExpiresAt = now.AddHours(_options.PendingHours)
                });
            }
            await repository.AddAttachmentsAsync(attachments, cancellationToken);
            return attachments.Select(MapAttachment).ToList();
        }
        catch
        {
            // Use an independent token so client cancellation cannot skip compensation.
            foreach (var key in writtenKeys)
            {
                try { await storage.DeleteAsync(key, CancellationToken.None); }
                catch (Exception ex) { logger.LogWarning(ex, "Upload compensation failed; orphan cleanup will retry."); }
            }
            throw;
        }
    }

    public async Task<ChatAttachmentDownload> OpenAttachmentAsync(Guid id, int currentAdminId, bool preview,
        CancellationToken cancellationToken)
    {
        var attachment = await repository.GetAttachmentAsync(id, cancellationToken);
        if (attachment == null || attachment.Status == AttachmentStatus.Deleting)
            throw new NotFoundException("Không tìm thấy tệp.");
        if (attachment.Status == AttachmentStatus.Pending)
        {
            if (attachment.UploaderId != currentAdminId || attachment.ExpiresAt <= DateTime.UtcNow)
                throw new NotFoundException("Không tìm thấy tệp.");
        }
        else
        {
            if (attachment.Message == null) throw new NotFoundException("Không tìm thấy tệp.");
            if (attachment.Message.IsDeleted) throw new NotFoundException("Tệp đã bị xóa cùng tin nhắn.");
            await RequireMembershipAsync(attachment.Message.RoomId, currentAdminId);
        }
        if (preview && attachment.Kind != "Image")
            throw new AppException("Chỉ hỗ trợ xem trước ảnh.", HttpStatusCode.UnsupportedMediaType);
        try { return new(storage.OpenRead(attachment.StorageKey), attachment.ContentType, attachment.OriginalFileName); }
        catch (FileNotFoundException) { throw new NotFoundException("Không tìm thấy tệp."); }
        catch (DirectoryNotFoundException) { throw new NotFoundException("Không tìm thấy tệp."); }
    }

    public async Task DeleteAttachmentAsync(Guid id, int currentAdminId, CancellationToken cancellationToken)
    {
        var attachment = await repository.GetAttachmentAsync(id, cancellationToken);
        if (attachment == null || attachment.UploaderId != currentAdminId) throw new NotFoundException("Không tìm thấy tệp.");
        if (!await repository.ClaimForDeletionAsync(id, currentAdminId, null, cancellationToken))
            throw new ConflictException("Không thể xóa tệp đã gửi.");
        await storage.DeleteAsync(attachment.StorageKey, cancellationToken);
        await repository.CompleteDeletionAsync(id, cancellationToken);
    }

    public async Task CleanupAttachmentsAsync(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        // Bounded batches prevent one cleanup iteration from monopolizing the server.
        var candidates = await repository.GetCleanupCandidatesAsync(now, cancellationToken);
        foreach (var attachment in candidates)
        {
            try
            {
                if (!await repository.ClaimForDeletionAsync(attachment.Id, null, now, cancellationToken)) continue;
                await storage.DeleteAsync(attachment.StorageKey, cancellationToken);
                await repository.CompleteDeletionAsync(attachment.Id, cancellationToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "Attachment cleanup failed for {AttachmentId}; will retry.", attachment.Id);
            }
        }
        // A grace period also covers files left behind before metadata was committed.
        foreach (var key in storage.GetKeysOlderThan(now.AddHours(-Math.Max(48, _options.PendingHours * 2))).Take(1000))
        {
            if (await repository.StorageKeyExistsAsync(key, cancellationToken)) continue;
            try { await storage.DeleteAsync(key, cancellationToken); }
            catch (Exception ex) when (ex is not OperationCanceledException)
            { logger.LogWarning(ex, "Orphan cleanup failed; will retry."); }
        }
    }

    private static ChatAttachmentResponse MapAttachment(ChatAttachment attachment) => new()
    {
        Id = attachment.Id, FileName = attachment.OriginalFileName, ContentType = attachment.ContentType,
        SizeBytes = attachment.SizeBytes, Kind = attachment.Kind, ExpiresAt = attachment.ExpiresAt,
        DownloadUrl = $"/api/v1/chat/attachments/{attachment.Id}/download",
        PreviewUrl = attachment.Kind == "Image" ? $"/api/v1/chat/attachments/{attachment.Id}/preview" : null
    };

    private static ChatMessageResponse MapMessage(ChatMessage message) => new()
    {
        Id = message.Id, RoomId = message.RoomId, SenderId = message.SenderId, ReceiverId = message.ReceiverId,
        Content = message.IsDeleted ? "Tin nhắn đã bị thu hồi" : message.Content,
        ClientMessageId = message.ClientMessageId, IsRead = message.IsRead,
        IsDeleted = message.IsDeleted, DeletedAt = message.DeletedAt,
        CreatedAt = message.CreatedAt,
        Attachments = message.IsDeleted ? [] : message.Attachments.OrderBy(a => a.CreatedAt).ThenBy(a => a.Id).Select(MapAttachment).ToList()
    };
}
