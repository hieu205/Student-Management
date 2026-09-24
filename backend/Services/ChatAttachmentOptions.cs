namespace demo_dotnet.backend.Services;

public class ChatAttachmentOptions
{
    public const string SectionName = "ChatAttachments";
    public string StoragePath { get; set; } = "App_Data/ChatAttachments";
    public int MaxFiles { get; set; } = 5;
    public long MaxFileBytes { get; set; } = 10 * 1024 * 1024;
    public long MaxTotalBytes { get; set; } = 25 * 1024 * 1024;
    public int PendingHours { get; set; } = 24;
    public long MaxImagePixels { get; set; } = 20_000_000;
    public long MaxRequestBytes => MaxTotalBytes + 1024 * 1024;
}
