using Microsoft.AspNetCore.Mvc;

using demo_dotnet.backend.Services.Interface;
using demo_dotnet.backend.DTOs.Response;
using Microsoft.AspNetCore.Authorization;
namespace demo_dotnet.backend.Controllers;

[ApiController]
[Route("api/v1/admin/[controller]")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AdminResponse>> GetProfileAdmin([FromRoute] int id)
    {
        var res = await _adminService.getProfileAdmin(id);
        return Ok(res);
    }


}