using Microsoft.AspNetCore.Mvc;
using demo_dotnet.backend.Services.Interface;
using demo_dotnet.backend.DTOs.Request;
using demo_dotnet.backend.DTOs.Response;
using Microsoft.AspNetCore.Authorization;
using demo_dotnet.backend.Attributes;

namespace demo_dotnet.backend.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet]
    [HasPermission("admin:read")]
    public async Task<ActionResult<List<AdminResponse>>> GetAll()
    {
        var res = await _adminService.GetAllAdmins();
        return Ok(res);
    }

    [HttpGet("{id}")]
    [HasPermission("admin:read")]
    public async Task<ActionResult<AdminResponse>> GetProfileAdmin([FromRoute] int id)
    {
        var res = await _adminService.GetProfileAdmin(id);
        return Ok(res);
    }

    [HttpPut("{id}")]
    [HasPermission("admin:update")]
    public async Task<ActionResult<AdminResponse>> Update([FromRoute] int id, [FromBody] AdminRequest request)
    {
        var res = await _adminService.UpdateAdmin(id, request);
        return Ok(res);
    }

    [HttpDelete("{id}")]
    [HasPermission("admin:delete")]
    public async Task<IActionResult> Delete([FromRoute] int id)
    {
        await _adminService.DeleteAdmin(id);
        return NoContent();
    }

    [HttpPut("{id}/permissions")]
    [HasPermission("admin_permission:assign")]
    public async Task<IActionResult> AssignPermissions([FromRoute] int id, [FromBody] AssignPermissionsRequest request)
    {
        await _adminService.AssignPermissionsAsync(id, request.PermissionIds);
        return Ok(new { message = $"Cập nhật quyền cho Admin ID {id} thành công." });
    }

    [HttpDelete("{id}/permissions")]
    [HasPermission("admin_permission:assign")]
    public async Task<IActionResult> RevokePermissions([FromRoute] int id, [FromBody] AssignPermissionsRequest request)
    {
        await _adminService.RevokePermissionsAsync(id, request.PermissionIds);
        return Ok(new { message = $"Thu hồi quyền thành công cho Admin ID {id}." });
    }
}