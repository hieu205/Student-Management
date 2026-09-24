using backend.Models;

namespace demo_dotnet.backend.Data.Repositories;

public interface IChatRepository
{
    Task<bool> AdminExistsAsync(int id);
    Task<bool> IsRoomMemberAsync(long roomId, int adminId);
    Task<ChatRoom?> GetRoomBetweenAdminsAsync(int admin1Id, int admin2Id);
    Task<ChatRoom> CreateRoomAsync(int admin1Id, int admin2Id);
    Task<List<ChatRoom>> GetRoomsByAdminIdAsync(int adminId);
    Task<ChatMessage> SaveMessageAsync(ChatMessage message, IReadOnlyCollection<Guid> attachmentIds, int maxFiles, long maxTotalBytes);
    Task<List<ChatMessage>> GetMessagesByRoomIdAsync(long roomId, int page, int pageSize);
    Task<ChatMessage?> GetMessageByIdAsync(long messageId);
    Task<bool> SoftDeleteMessageAsync(long messageId, int requesterAdminId);
    Task<List<ChatMessage>> SearchMessagesAsync(long roomId, int currentAdminId, string query, int page, int pageSize);
    Task MarkMessagesAsReadAsync(long roomId, int currentAdminId);
    Task AddAttachmentsAsync(List<ChatAttachment> attachments, CancellationToken cancellationToken);
    Task<ChatAttachment?> GetAttachmentAsync(Guid id, CancellationToken cancellationToken);
    Task<bool> ClaimForDeletionAsync(Guid id, int? uploaderId, DateTime? expiredBefore, CancellationToken cancellationToken);
    Task CompleteDeletionAsync(Guid id, CancellationToken cancellationToken);
    Task<List<ChatAttachment>> GetCleanupCandidatesAsync(DateTime now, CancellationToken cancellationToken);
    Task<bool> StorageKeyExistsAsync(string key, CancellationToken cancellationToken);
}
