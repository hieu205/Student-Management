using demo_dotnet.backend.Models;

namespace demo_dotnet.backend.Data.Interfaces;

public interface IRoleRepository
{
    /// <summary>Kiểm tra tên role đã tồn tại chưa, có thể loại trừ một role (dùng khi update).</summary>
    Task<bool> ExistsByNameAsync(string name, int? excludeRoleId = null);

    /// <summary>Trả về danh sách các ID permission thực sự tồn tại trong DB từ danh sách đầu vào.</summary>
    Task<List<int>> GetExistingPermissionIdsAsync(List<int> permissionIds);

    /// <summary>Lấy toàn bộ danh sách các quyền (permissions) có trong hệ thống.</summary>
    Task<List<Permission>> GetAllPermissionsAsync();

    /// <summary>Tạo role mới kèm danh sách permission trong một transaction.</summary>
    Task<Role> CreateRoleAsync(Role role, List<int> permissionIds);

    /// <summary>Lấy toàn bộ danh sách role kèm permissions, sắp xếp theo tên.</summary>
    Task<List<Role>> GetAllRolesAsync();

    /// <summary>Lấy chi tiết một role theo ID, trả về null nếu không tồn tại.</summary>
    Task<Role?> GetRoleByIdAsync(int id);

    /// <summary>Cập nhật thông tin role và thay thế toàn bộ danh sách permission trong một transaction.</summary>
    Task<Role> UpdateRoleAsync(Role role, List<int> permissionIds);

    /// <summary>Xóa role theo ID. Service chịu trách nhiệm kiểm tra tồn tại trước khi gọi.</summary>
    Task DeleteRoleAsync(int id);
}