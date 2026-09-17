namespace demo_dotnet.backend.Models;

public class Permission
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }

    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
    public ICollection<AdminPermission> AdminPermissions { get; set; } = new List<AdminPermission>();
}