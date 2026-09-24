namespace demo_dotnet.backend.DTOs.response;

public class ChatAttachmentResponse
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string Kind { get; set; } = string.Empty;
    public DateTime? ExpiresAt { get; set; }
    public string DownloadUrl { get; set; } = string.Empty;
    public string? PreviewUrl { get; set; }
}

public sealed record ChatAttachmentDownload(Stream Content, string ContentType, string FileName);
