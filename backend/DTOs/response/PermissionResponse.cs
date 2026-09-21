namespace demo_dotnet.backend.DTOs;

public class PermissionResponse
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
}