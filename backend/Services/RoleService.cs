using demo_dotnet.backend.Data.Interfaces;
using demo_dotnet.backend.DTOs;
using demo_dotnet.backend.exception;
using demo_dotnet.backend.Models;

namespace demo_dotnet.backend.Services;

public class RoleService : IRoleService
{
    private readonly IRoleRepository _roleRepository;

    public RoleService(IRoleRepository roleRepository)
    {
        _roleRepository = roleRepository;
    }

    public async Task<RoleResponse> CreateRoleAsync(RoleRequest request)
    {
        // Validate: tên role không được trùng
        if (await _roleRepository.ExistsByNameAsync(request.Name))
        {
            throw new ConflictException($"Role với tên '{request.Name}' đã tồn tại trong hệ thống.");
        }

        // Validate: tất cả permissionIds phải tồn tại trong DB
        await ValidatePermissionIdsExistAsync(request.PermissionIds);

        var role = new Role
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim()
        };

        var newRole = await _roleRepository.CreateRoleAsync(role, request.PermissionIds);
        return MapToRoleResponse(newRole);
    }

    public async Task<List<RoleResponse>> GetAllRolesAsync()
    {
        var roles = await _roleRepository.GetAllRolesAsync();
        return roles.Select(MapToRoleResponse).ToList();
    }

    public async Task<RoleResponse> GetRoleByIdAsync(int id)
    {
        var role = await _roleRepository.GetRoleByIdAsync(id);
        if (role == null)
        {
            throw new NotFoundException($"Không tìm thấy role với ID = {id}.");
        }

        return MapToRoleResponse(role);
    }

    public async Task<RoleResponse> UpdateRoleAsync(int id, RoleRequest request)
    {
        var existingRole = await _roleRepository.GetRoleByIdAsync(id);
        if (existingRole == null)
        {
            throw new NotFoundException($"Không tìm thấy role với ID = {id}.");
        }

        // Validate: tên mới không được trùng với role khác (loại trừ chính nó)
        if (await _roleRepository.ExistsByNameAsync(request.Name, excludeRoleId: id))
        {
            throw new ConflictException($"Role với tên '{request.Name}' đã tồn tại trong hệ thống.");
        }

        // Validate: tất cả permissionIds phải tồn tại trong DB
        await ValidatePermissionIdsExistAsync(request.PermissionIds);

        existingRole.Name = request.Name.Trim();
        existingRole.Description = request.Description?.Trim();

        var updatedRole = await _roleRepository.UpdateRoleAsync(existingRole, request.PermissionIds);
        return MapToRoleResponse(updatedRole);
    }

    public async Task DeleteRoleAsync(int id)
    {
        var role = await _roleRepository.GetRoleByIdAsync(id);
        if (role == null)
        {
            throw new NotFoundException($"Không tìm thấy role với ID = {id}.");
        }

        await _roleRepository.DeleteRoleAsync(id);
    }

    public async Task<List<PermissionResponse>> GetAllPermissionsAsync()
    {
        var permissions = await _roleRepository.GetAllPermissionsAsync();
        return permissions.Select(p => new PermissionResponse
        {
            Id = p.Id,
            Code = p.Code,
            Description = p.Description
        }).ToList();
    }

    // ────────────────────────────────────────────────────────────────
    // Private helpers
    // ────────────────────────────────────────────────────────────────

    /// <summary>
    /// Kiểm tra tất cả permissionIds có tồn tại trong DB không.
    /// Ném BadRequestException với danh sách ID không hợp lệ nếu có.
    /// </summary>
    private async Task ValidatePermissionIdsExistAsync(List<int> permissionIds)
    {
        var existingIds = await _roleRepository.GetExistingPermissionIdsAsync(permissionIds);
        var invalidIds = permissionIds.Except(existingIds).ToList();

        if (invalidIds.Any())
        {
            throw new BadRequestException(
                $"Có {invalidIds.Count} permission không tồn tại trong hệ thống.",
                new { invalidPermissionIds = invalidIds }
            );
        }
    }

    /// <summary>
    /// Chuyển đổi entity Role thành RoleResponse DTO.
    /// </summary>
    private static RoleResponse MapToRoleResponse(Role role)
    {
        var permissions = role.RolePermissions
            .Where(rp => rp.Permission != null)
            .Select(rp => new PermissionResponse
            {
                Id = rp.Permission.Id,
                Code = rp.Permission.Code,
                Description = rp.Permission.Description
            })
            .OrderBy(p => p.Code)
            .ToList();

        return new RoleResponse
        {
            RoleId = role.Id,
            Name = role.Name,
            Description = role.Description,
            PermissionCount = permissions.Count,
            Permissions = permissions
        };
    }
}