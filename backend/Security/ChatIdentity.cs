using System.Security.Claims;
using demo_dotnet.backend.exception;
using Microsoft.AspNetCore.SignalR;

namespace demo_dotnet.backend.Security;

public static class ChatIdentity
{
    public static int GetAdminId(ClaimsPrincipal? user)
    {
        var claim = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? user?.FindFirst("id")?.Value;
        if (!int.TryParse(claim, out var id) || id <= 0) throw new UnauthorizedException();
        return id;
    }
}

public class ChatUserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection)
    {
        try { return ChatIdentity.GetAdminId(connection.User).ToString(); }
        catch (UnauthorizedException) { return null; }
    }
}
