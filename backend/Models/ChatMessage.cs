using demo_dotnet.backend.Models;

namespace backend.Models;

public class ChatMessage
{
    public long Id { get; set; }
    public long RoomId { get; set; }
    public int SenderId { get; set; }
    public int ReceiverId { get; set; }
    public string Content { get; set; } = string.Empty;
    public Guid? ClientMessageId { get; set; }
    public ICollection<ChatAttachment> Attachments { get; set; } = new List<ChatAttachment>();
    public bool IsRead { get; set; } = false;
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ChatRoom Room { get; set; } = null!;
    public Admin Sender { get; set; } = null!;
    public Admin Receiver { get; set; } = null!;
}
