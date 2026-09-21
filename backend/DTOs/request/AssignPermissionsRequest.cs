namespace demo_dotnet.backend.DTOs.Request;

public class AssignPermissionsRequest
{
    public List<string> PermissionCodes { get; set; } = new();
}