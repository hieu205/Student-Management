namespace demo_dotnet.backend.DTOs.response;

public class ChatRoomResponse
{
    public long RoomId { get; set; }
    public int PartnerId { get; set; }
    public string PartnerName { get; set; } = string.Empty;
    public string? LastMessage { get; set; }
    public DateTime? LastMessageTime { get; set; }
    public int UnreadCount { get; set; }
}