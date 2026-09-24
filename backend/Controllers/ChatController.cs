using demo_dotnet.backend.DTOs.request;
using demo_dotnet.backend.DTOs.response;
using demo_dotnet.backend.Hubs;
using demo_dotnet.backend.Security;
using demo_dotnet.backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace demo_dotnet.backend.Controllers;

[ApiController]
[Route("api/v1/chat")]
[Authorize]
public class ChatController(IChatService chatService, IHubContext<ChatHub> hubContext) : ControllerBase
{
    [HttpGet("rooms")]
    public async Task<ActionResult<List<ChatRoomResponse>>> GetRooms() =>
        Ok(await chatService.GetUserRoomsAsync(ChatIdentity.GetAdminId(User)));

    [HttpGet("rooms/{roomId:long}/messages")]
    public async Task<ActionResult<List<ChatMessageResponse>>> GetMessages(long roomId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(await chatService.GetRoomMessagesAsync(roomId, ChatIdentity.GetAdminId(User), page, pageSize));

    [HttpGet("rooms/{roomId:long}/search")]
    public async Task<ActionResult<List<ChatMessageResponse>>> SearchMessages(
        long roomId, [FromQuery] string query, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(await chatService.SearchMessagesAsync(roomId, ChatIdentity.GetAdminId(User), query, page, pageSize));

    [HttpDelete("messages/{messageId:long}")]
    public async Task<ActionResult<ChatMessageResponse>> DeleteMessage(long messageId)
    {
        var message = await chatService.SoftDeleteMessageAsync(messageId, ChatIdentity.GetAdminId(User));
        await hubContext.Clients.Users(message.SenderId.ToString(), message.ReceiverId.ToString())
            .SendAsync("MessageDeleted", new { messageId = message.Id, roomId = message.RoomId });
        return Ok(message);
    }

    [HttpPut("rooms/{roomId:long}/read")]
    public async Task<IActionResult> MarkAsRead(long roomId)
    {
        await chatService.MarkAsReadAsync(roomId, ChatIdentity.GetAdminId(User));
        return NoContent();
    }

    [HttpPost("attachments")]
    [Consumes("multipart/form-data")]
    [ServiceFilter(typeof(ChatUploadLimitsFilter))]
    public async Task<ActionResult<List<ChatAttachmentResponse>>> Upload([FromForm] UploadChatAttachmentsRequest request, CancellationToken cancellationToken)
    {
        var attachments = await chatService.UploadAttachmentsAsync(ChatIdentity.GetAdminId(User), request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, attachments);
    }

    [HttpGet("attachments/{id:guid}/download")]
    public async Task<IActionResult> Download(Guid id, CancellationToken cancellationToken)
    {
        var attachment = await chatService.OpenAttachmentAsync(id, ChatIdentity.GetAdminId(User), false, cancellationToken);
        SetPrivateHeaders();
        return File(attachment.Content, attachment.ContentType, attachment.FileName);
    }

    [HttpGet("attachments/{id:guid}/preview")]
    public async Task<IActionResult> Preview(Guid id, CancellationToken cancellationToken)
    {
        var attachment = await chatService.OpenAttachmentAsync(id, ChatIdentity.GetAdminId(User), true, cancellationToken);
        SetPrivateHeaders();
        return File(attachment.Content, attachment.ContentType);
    }

    [HttpDelete("attachments/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await chatService.DeleteAttachmentAsync(id, ChatIdentity.GetAdminId(User), cancellationToken);
        return NoContent();
    }

    private void SetPrivateHeaders()
    {
        Response.Headers.CacheControl = "private, no-store";
        Response.Headers["X-Content-Type-Options"] = "nosniff";
    }
}
