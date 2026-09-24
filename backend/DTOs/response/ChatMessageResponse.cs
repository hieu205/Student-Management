namespace demo_dotnet.backend.DTOs.response;

public class ChatMessageResponse
{
    public long Id { get; set; }
    public long RoomId { get; set; }
    public int SenderId { get; set; }
    public int ReceiverId { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}