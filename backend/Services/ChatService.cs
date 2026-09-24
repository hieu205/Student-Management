using backend.Models;
using demo_dotnet.backend.Data.Repositories;
using demo_dotnet.backend.DTOs.request;
using demo_dotnet.backend.DTOs.response;
using demo_dotnet.backend.Models;
using demo_dotnet.backend.Services.Interfaces;

namespace demo_dotnet.backend.Services;

public class ChatService : IChatService
{
    private readonly IChatRepository _chatRepository;

    public ChatService(IChatRepository chatRepository)
    {
        _chatRepository = chatRepository;
    }

    public async Task<long> GetOrCreateRoomIdAsync(int admin1Id, int admin2Id)
    {
        var room = await _chatRepository.GetRoomBetweenAdminsAsync(admin1Id, admin2Id);
        if (room == null)
        {
            room = await _chatRepository.CreateRoomAsync(admin1Id, admin2Id);
        }
        return room.Id;
    }

    public async Task<ChatMessageResponse> SaveMessageAsync(int senderId, SendMessageRequest request)
    {
        var roomId = await GetOrCreateRoomIdAsync(senderId, request.ReceiverId);

        var message = new ChatMessage
        {
            RoomId = roomId,
            SenderId = senderId,
            ReceiverId = request.ReceiverId,
            Content = request.Content,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        var savedMsg = await _chatRepository.SaveMessageAsync(message);

        return new ChatMessageResponse
        {
            Id = savedMsg.Id,
            RoomId = savedMsg.RoomId,
            SenderId = savedMsg.SenderId,
            ReceiverId = savedMsg.ReceiverId,
            Content = savedMsg.Content,
            IsRead = savedMsg.IsRead,
            CreatedAt = savedMsg.CreatedAt
        };
    }

    public async Task<List<ChatRoomResponse>> GetUserRoomsAsync(int currentAdminId)
    {
        var rooms = await _chatRepository.GetRoomsByAdminIdAsync(currentAdminId);

        return rooms.Select(r =>
        {
            var isAdmin1 = r.Admin1Id == currentAdminId;
            var partner = isAdmin1 ? r.Admin2 : r.Admin1;
            var lastMsg = r.Messages.OrderByDescending(m => m.CreatedAt).FirstOrDefault();

            return new ChatRoomResponse
            {
                RoomId = r.Id,
                PartnerId = partner.Id,
                PartnerName = !string.IsNullOrEmpty(partner.FullName) ? partner.FullName : partner.Username,
                LastMessage = lastMsg?.Content,
                LastMessageTime = lastMsg?.CreatedAt,
                UnreadCount = r.Messages.Count(m => m.SenderId != currentAdminId && !m.IsRead)
            };
        }).ToList();
    }

    public async Task<List<ChatMessageResponse>> GetRoomMessagesAsync(long roomId, int page, int pageSize)
    {
        var messages = await _chatRepository.GetMessagesByRoomIdAsync(roomId, page, pageSize);

        return messages.Select(m => new ChatMessageResponse
        {
            Id = m.Id,
            RoomId = m.RoomId,
            SenderId = m.SenderId,
            ReceiverId = m.ReceiverId,
            Content = m.Content,
            IsRead = m.IsRead,
            CreatedAt = m.CreatedAt
        }).ToList();
    }

    public async Task MarkAsReadAsync(long roomId, int currentAdminId)
    {
        await _chatRepository.MarkMessagesAsReadAsync(roomId, currentAdminId);
    }
}