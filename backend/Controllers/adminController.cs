using Microsoft.AspNetCore.Mvc;
using demo_dotnet.backend.Services.Interface;
using demo_dotnet.backend.DTOs.Request;
using demo_dotnet.backend.DTOs.Response;
using Microsoft.AspNetCore.Authorization;

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
    public async Task<ActionResult<List<AdminResponse>>> GetAll()
    {
        var res = await _adminService.GetAllAdmins();
        return Ok(res);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AdminResponse>> GetProfileAdmin([FromRoute] int id)
    {
        var res = await _adminService.GetProfileAdmin(id);
        return Ok(res);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<AdminResponse>> Update([FromRoute] int id, [FromBody] AdminRequest request)
    {
        var res = await _adminService.UpdateAdmin(id, request);
        return Ok(res);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete([FromRoute] int id)
    {
        await _adminService.DeleteAdmin(id);
        return Ok(new { message = $"Xóa tài khoản Admin ID {id} thành công" });
    }
}