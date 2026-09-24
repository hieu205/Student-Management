using System.Security.Claims;
using demo_dotnet.backend.DTOs.request;
using demo_dotnet.backend.Services;
using demo_dotnet.backend.Services.Interface;
using demo_dotnet.backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace demo_dotnet.backend.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IChatService _chatService;

    public ChatHub(IChatService chatService)
    {
        _chatService = chatService;
    }

    public async Task SendMessage(SendMessageRequest request)
    {
        var senderClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? Context.User?.FindFirst("id")?.Value;

        if (string.IsNullOrEmpty(senderClaim) || !long.TryParse(senderClaim, out long senderId))
            return;

        if (senderId == request.ReceiverId)
            return; // Khong cho phep tu chat voi chinh minh

        var messageDto = await _chatService.SaveMessageAsync((int)senderId, request);

        // Gửi realtime cho Admin nhận và Admin gửi
        await Clients.User(request.ReceiverId.ToString()).SendAsync("ReceiveMessage", messageDto);
        await Clients.User(senderId.ToString()).SendAsync("ReceiveMessage", messageDto);
    }
}