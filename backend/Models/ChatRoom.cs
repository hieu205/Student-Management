using demo_dotnet.backend.Models;

namespace backend.Models;

public class ChatRoom
{
    public long Id { get; set; }
    public int Admin1Id { get; set; }
    public int Admin2Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Admin Admin1 { get; set; } = null!;
    public Admin Admin2 { get; set; } = null!;

    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}