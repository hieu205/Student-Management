namespace demo_dotnet.backend.DTOs.request;

public class UploadChatAttachmentsRequest
{
    public int ReceiverId { get; set; }
    public List<IFormFile> Files { get; set; } = [];
}
