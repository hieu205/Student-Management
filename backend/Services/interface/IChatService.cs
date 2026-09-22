using demo_dotnet.backend.DTOs.request;
using demo_dotnet.backend.DTOs.response;

namespace demo_dotnet.backend.Services.Interfaces;

public interface IChatService
{
    Task<ChatMessageResponse> SaveMessageAsync(int senderId, SendMessageRequest request);
    Task<List<ChatRoomResponse>> GetUserRoomsAsync(int currentAdminId);
    Task<List<ChatMessageResponse>> GetRoomMessagesAsync(long roomId, int page, int pageSize);
    Task MarkAsReadAsync(long roomId, int currentAdminId);
    Task<long> GetOrCreateRoomIdAsync(int admin1Id, int admin2Id);
}