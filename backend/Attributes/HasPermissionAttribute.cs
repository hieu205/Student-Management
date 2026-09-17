using Microsoft.AspNetCore.Authorization;

namespace demo_dotnet.backend.Attributes;

public class HasPermissionAttribute : AuthorizeAttribute
{
    public HasPermissionAttribute(string permissionCode)
    {
        Policy = $"PERMISSION:{permissionCode}";
    }
}