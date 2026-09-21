using demo_dotnet.backend.DTOs;

namespace demo_dotnet.backend.Services;

public interface IRoleService
{
    Task<RoleResponse> CreateRoleAsync(RoleRequest request);
    Task<List<RoleResponse>> GetAllRolesAsync();
    Task<RoleResponse> GetRoleByIdAsync(int id);
    Task<RoleResponse> UpdateRoleAsync(int id, RoleRequest request);
    Task DeleteRoleAsync(int id);
}