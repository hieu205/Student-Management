using System.Security.Claims;
using demo_dotnet.backend.DTOs.response;
using demo_dotnet.backend.Services;
using demo_dotnet.backend.Services.Interface;
using demo_dotnet.backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace demo_dotnet.backend.Controllers;

[ApiController]
[Route("api/v1/chat")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;

    public ChatController(IChatService chatService)
    {
        _chatService = chatService;
    }

    private long GetCurrentAdminId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
        return long.Parse(claim!);
    }

    [HttpGet("rooms")]
    public async Task<ActionResult<List<ChatRoomResponse>>> GetRooms()
    {
        var adminId = GetCurrentAdminId();
        var rooms = await _chatService.GetUserRoomsAsync((int)adminId);
        return Ok(rooms);
    }

    [HttpGet("rooms/{roomId}/messages")]
    public async Task<ActionResult<List<ChatMessageResponse>>> GetMessages(long roomId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var messages = await _chatService.GetRoomMessagesAsync(roomId, page, pageSize);
        return Ok(messages);
    }

    [HttpPut("rooms/{roomId}/read")]
    public async Task<IActionResult> MarkAsRead(long roomId)
    {
        var adminId = GetCurrentAdminId();
        await _chatService.MarkAsReadAsync(roomId, (int)adminId);
        return NoContent();
    }
}