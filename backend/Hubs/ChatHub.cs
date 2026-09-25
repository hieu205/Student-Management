using demo_dotnet.backend.DTOs.request;
using demo_dotnet.backend.DTOs.response;
using demo_dotnet.backend.exception;
using demo_dotnet.backend.Security;
using demo_dotnet.backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace demo_dotnet.backend.Hubs;

[Authorize]
public class ChatHub(IChatService chatService, ILogger<ChatHub> logger) : Hub
{
    public async Task<ChatMessageResponse> SendMessage(SendMessageRequest request)
    {
        ChatMessageResponse message;
        try
        {
            var senderId = ChatIdentity.GetAdminId(Context.User);
            message = await chatService.SaveMessageAsync(senderId, request);
        }
        catch (AppException ex) { throw new HubException($"CHAT_{(int)ex.StatusCode}: {ex.Message}"); }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to save chat message.");
            throw new HubException("CHAT_500: Không thể lưu tin nhắn.");
        }

        try
        {
            await Clients.Users(message.SenderId.ToString(), message.ReceiverId.ToString())
                .SendAsync("ReceiveMessage", message);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Realtime delivery failed for message {MessageId}.", message.Id);
        }
        return message;
    }

    public async Task<ChatMessageResponse> DeleteMessage(long messageId)
    {
        ChatMessageResponse message;
        try
        {
            var currentAdminId = ChatIdentity.GetAdminId(Context.User);
            message = await chatService.SoftDeleteMessageAsync(messageId, currentAdminId);
        }
        catch (AppException ex) { throw new HubException($"CHAT_{(int)ex.StatusCode}: {ex.Message}"); }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to delete chat message {MessageId}.", messageId);
            throw new HubException("CHAT_500: Không thể xóa tin nhắn.");
        }

        try
        {
            await Clients.Users(message.SenderId.ToString(), message.ReceiverId.ToString())
                .SendAsync("MessageDeleted", new { messageId = message.Id, roomId = message.RoomId });
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Realtime delete broadcast failed for message {MessageId}.", message.Id);
        }
        return message;
    }
}
