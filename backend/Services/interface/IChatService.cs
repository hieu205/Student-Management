using demo_dotnet.backend.DTOs.request;
using demo_dotnet.backend.DTOs.response;

namespace demo_dotnet.backend.Services.Interfaces;

public interface IChatService
{
    Task<ChatMessageResponse> SaveMessageAsync(int senderId, SendMessageRequest request);
    Task<List<ChatRoomResponse>> GetUserRoomsAsync(int currentAdminId);
    Task<List<ChatMessageResponse>> GetRoomMessagesAsync(long roomId, int currentAdminId, int page, int pageSize);
    Task<List<ChatMessageResponse>> SearchMessagesAsync(long roomId, int currentAdminId, string query, int page, int pageSize);
    Task<ChatMessageResponse> SoftDeleteMessageAsync(long messageId, int currentAdminId);
    Task MarkAsReadAsync(long roomId, int currentAdminId);
    Task<long> GetOrCreateRoomIdAsync(int admin1Id, int admin2Id);
    Task<List<ChatAttachmentResponse>> UploadAttachmentsAsync(int uploaderId, UploadChatAttachmentsRequest request, CancellationToken cancellationToken);
    Task<ChatAttachmentDownload> OpenAttachmentAsync(Guid id, int currentAdminId, bool preview, CancellationToken cancellationToken);
    Task DeleteAttachmentAsync(Guid id, int currentAdminId, CancellationToken cancellationToken);
    Task CleanupAttachmentsAsync(CancellationToken cancellationToken);
}
