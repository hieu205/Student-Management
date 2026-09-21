using System.Security.Claims;
using demo_dotnet.backend.DTOs.Request;
using demo_dotnet.backend.DTOs.Response;
using demo_dotnet.backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace demo_dotnet.backend.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequest loginRequest)
    {
        var res = await _authService.LoginAsync(loginRequest);
        return Ok(res);
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        await _authService.ForgotPasswordAsync(request);
        return Ok(new { message = "Nếu Email tồn tại trên hệ thống, liên kết đặt lại mật khẩu đã được gửi." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        await _authService.ResetPasswordAsync(request);
        return Ok(new { message = "Đặt lại mật khẩu thành công." });
    }

    // [Authorize]
    // [HttpPost("change-password")]
    // public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    // {
    //     var adminIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    //     if (string.IsNullOrEmpty(adminIdClaim) || !int.TryParse(adminIdClaim, out var adminId))
    //     {
    //         return Unauthorized();
    //     }

    //     await _authService.ChangePasswordAsync(adminId, request);
    //     return Ok(new { message = "Đổi mật khẩu thành công." });
    // }
}