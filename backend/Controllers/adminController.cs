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
    private readonly IAuthService _authService;

    public AdminController(IAdminService adminService, IAuthService authService)
    {
        _adminService = adminService;
        _authService = authService;
    }

    [HttpPost]
    [HasPermission("admin:create")]
    public async Task<ActionResult<AdminResponse>> Create([FromBody] RegisterAdminRequest request)
    {
        var res = await _authService.RegisterAsync(request);
        return StatusCode(StatusCodes.Status201Created, res);
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
        var requesterIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(requesterIdClaim, out int requesterId))
            return Unauthorized();

        await _adminService.DeleteAdmin(id, requesterId);
        return NoContent();
    }

    [HttpPut("{id}/permissions")]
    [HasPermission("admin_permission:assign")]
    public async Task<IActionResult> SyncPermissions([FromRoute] int id, [FromBody] AssignPermissionsRequest request)
    {
        await _adminService.SyncPermissionsAsync(id, request.PermissionCodes);
        return Ok(new { message = $"Đồng bộ danh sách quyền cho Admin ID {id} thành công." });
    }
}