namespace demo_dotnet.backend.DTOs;

public class RoleResponse
{
    public int RoleId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int PermissionCount { get; set; }
    public List<PermissionResponse> Permissions { get; set; } = new();
}