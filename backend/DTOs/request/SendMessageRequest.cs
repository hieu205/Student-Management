namespace demo_dotnet.backend.DTOs.request;

public class SendMessageRequest
{
    public int ReceiverId { get; set; }
    public string Content { get; set; } = string.Empty;
    public List<Guid> AttachmentIds { get; set; } = [];
    public Guid? ClientMessageId { get; set; }
}
