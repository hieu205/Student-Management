using demo_dotnet.backend.Attributes;
using demo_dotnet.backend.DTOs;
using demo_dotnet.backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace demo_dotnet.backend.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize] // Bắt buộc đăng nhập cho tất cả endpoints
public class RoleController : ControllerBase
{
    private readonly IRoleService _roleService;

    public RoleController(IRoleService roleService)
    {
        _roleService = roleService;
    }

    /// <summary>
    /// Lấy toàn bộ danh sách Role kèm danh sách Permission.
    /// Yêu cầu quyền: role:read
    /// </summary>
    [HttpGet]
    [HasPermission("role:read")]
    public async Task<ActionResult<ApiResponse<List<RoleResponse>>>> GetAllRoles()
    {
        var result = await _roleService.GetAllRolesAsync();
        return Ok(ApiResponse<List<RoleResponse>>.Success(result, $"Lấy danh sách thành công. Tổng số: {result.Count} role."));
    }

    /// <summary>
    /// Lấy danh sách toàn bộ các quyền có trong hệ thống để Frontend hiển thị form tick chọn.
    /// Yêu cầu quyền: role:read hoặc role:manage
    /// </summary>
    [HttpGet("permissions")]
    [HasPermission("role:read")]
    public async Task<ActionResult<ApiResponse<List<PermissionResponse>>>> GetAllPermissions()
    {
        var result = await _roleService.GetAllPermissionsAsync();
        return Ok(ApiResponse<List<PermissionResponse>>.Success(result, "Lấy danh sách quyền thành công."));
    }

    /// <summary>
    /// Lấy chi tiết một Role theo ID.
    /// Yêu cầu quyền: role:read
    /// </summary>
    [HttpGet("{id:int}")]
    [HasPermission("role:read")]
    public async Task<ActionResult<ApiResponse<RoleResponse>>> GetRoleById(int id)
    {
        var result = await _roleService.GetRoleByIdAsync(id);
        return Ok(ApiResponse<RoleResponse>.Success(result, "Lấy thông tin role thành công."));
    }

    /// <summary>
    /// Tạo mới một Role với danh sách Permission.
    /// Yêu cầu quyền: role:manage (chỉ Admin tổng)
    /// </summary>
    [HttpPost]
    [HasPermission("role:manage")]
    public async Task<ActionResult<ApiResponse<RoleResponse>>> CreateRole([FromBody] RoleRequest request)
    {
        var result = await _roleService.CreateRoleAsync(request);
        return CreatedAtAction(
            nameof(GetRoleById),
            new { id = result.RoleId },
            ApiResponse<RoleResponse>.Success(result, $"Tạo role '{result.Name}' thành công.")
        );
    }

    /// <summary>
    /// Cập nhật thông tin và danh sách Permission của một Role.
    /// Yêu cầu quyền: role:manage (chỉ Admin tổng)
    /// </summary>
    [HttpPut("{id:int}")]
    [HasPermission("role:manage")]
    public async Task<ActionResult<ApiResponse<RoleResponse>>> UpdateRole(int id, [FromBody] RoleRequest request)
    {
        var result = await _roleService.UpdateRoleAsync(id, request);
        return Ok(ApiResponse<RoleResponse>.Success(result, $"Cập nhật role '{result.Name}' thành công."));
    }

    /// <summary>
    /// Xóa một Role khỏi hệ thống.
    /// Yêu cầu quyền: role:manage (chỉ Admin tổng)
    /// </summary>
    [HttpDelete("{id:int}")]
    [HasPermission("role:manage")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteRole(int id)
    {
        await _roleService.DeleteRoleAsync(id);
        return Ok(ApiResponse<object>.Success(null, $"Xóa role (ID = {id}) thành công."));
    }
}