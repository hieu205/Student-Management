using demo_dotnet.backend.DTOs.Request;
using demo_dotnet.backend.DTOs.Response;

namespace demo_dotnet.backend.Services.Interface;

public interface IAdminService
{
    Task<List<AdminResponse>> GetAllAdmins();
    Task<AdminResponse> GetProfileAdmin(int id);
    Task<AdminResponse> UpdateAdmin(int id, AdminRequest request);
    Task DeleteAdmin(int id);
    Task AssignPermissionsAsync(int adminId, List<int> permissionIds);
    Task RevokePermissionsAsync(int adminId, List<int> permissionIds);
}