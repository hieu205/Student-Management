namespace demo_dotnet.backend.DTOs.Request;

public class AssignPermissionsRequest
{
    public List<int> PermissionIds { get; set; } = new List<int>();
}