using backend.Models;
using demo_dotnet.backend.Models;

namespace demo_dotnet.backend.Data.Repositories;

public interface IChatRepository
{
    Task<ChatRoom?> GetRoomBetweenAdminsAsync(int admin1Id, int admin2Id);
    Task<ChatRoom> CreateRoomAsync(int admin1Id, int admin2Id);
    Task<List<ChatRoom>> GetRoomsByAdminIdAsync(int adminId);
    Task<ChatMessage> SaveMessageAsync(ChatMessage message);
    Task<List<ChatMessage>> GetMessagesByRoomIdAsync(long roomId, int page, int pageSize);
    Task MarkMessagesAsReadAsync(long roomId, int currentAdminId);
}