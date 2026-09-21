namespace demo_dotnet.backend.Models;

public class AdminPermission
{
    public int AdminId { get; set; }
    public Admin Admin { get; set; } = null!;

    public int PermissionId { get; set; }
    public Permission Permission { get; set; } = null!;
}