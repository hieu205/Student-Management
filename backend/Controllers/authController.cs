using demo_dotnet.backend.DTOs.Request;
using demo_dotnet.backend.DTOs.Response;
using demo_dotnet.backend.Services;
using demo_dotnet.backend.Services.Interface;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace demo_dotnet.backend.Controllers;

[ApiController]

[Route("/api/v1/auth/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        this._authService = authService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequest loginRequest)
    {
        var res = await _authService.LoginAsync(loginRequest);
        return Ok(res);
    }

    [HttpPost("register")]
    public async Task<ActionResult<AdminResponse>> Register([FromBody] RegisterAdminRequest request)
    {
        var res = await _authService.RegisterAsync(request);
        return StatusCode(201, res);
    }
}