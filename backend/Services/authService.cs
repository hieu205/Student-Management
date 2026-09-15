using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using demo_dotnet.backend.Data.Interfaces;
using demo_dotnet.backend.DTOs.Request;
using demo_dotnet.backend.DTOs.Response;
using demo_dotnet.backend.exception;
using demo_dotnet.backend.Services.Interface;
using Microsoft.IdentityModel.Tokens;

namespace demo_dotnet.backend.Services; // Chú ý: namespace ở đây không có ".Interface"

public class AuthService : IAuthService
{
    private readonly IAdminRepository _adminRepository;
    private readonly IConfiguration _configuration;

    public AuthService(IAdminRepository adminRepository, IConfiguration configuration)
    {
        _adminRepository = adminRepository;
        _configuration = configuration;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequest request)
    {
        var admin = await _adminRepository.GetByUsernameAsync(request.Username);

        if (admin == null || admin.PasswordHash != request.Password)
        {
            throw new UnauthorizedException("Sai tài khoản hoặc mật khẩu");
        }

        var tokenHandler = new JwtSecurityTokenHandler();
        var jwtSecret = _configuration["Jwt:Secret"] ?? "SuperSecretKeyForJWTAuthentication1234567890!";
        var key = Encoding.UTF8.GetBytes(jwtSecret);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, admin.Id.ToString()),
                new Claim(ClaimTypes.Name, admin.Username)
            }),
            Expires = DateTime.UtcNow.AddHours(1),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        var tokenString = tokenHandler.WriteToken(token);

        return new LoginResponseDto
        {
            AccessToken = tokenString,
            ExpiresIn = 3600,
            Admin = new AdminDto
            {
                Id = admin.Id,
                Username = admin.Username,
                FullName = admin.FullName,
                Gmail = admin.Email
            }
        };
    }
}