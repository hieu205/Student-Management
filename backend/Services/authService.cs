using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using demo_dotnet.backend.Data.Interfaces;
using demo_dotnet.backend.DTOs.Request;
using demo_dotnet.backend.DTOs.Response;
using demo_dotnet.backend.exception;
using demo_dotnet.backend.Models;
using demo_dotnet.backend.Services.Interface;
using Microsoft.IdentityModel.Tokens;
using BC = BCrypt.Net.BCrypt;

namespace demo_dotnet.backend.Services;

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

        if (admin == null || !BC.Verify(request.Password, admin.PasswordHash))
        {
            throw new UnauthorizedException("Sai tài khoản hoặc mật khẩu");
        }

        var tokenHandler = new JwtSecurityTokenHandler();
        var jwtSecret = _configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt:Secret chưa được cấu hình trong appsettings.json");
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
                Email = admin.Email ?? string.Empty,
                RoleId = admin.RoleId
            }
        };
    }

    public async Task<AdminResponse> RegisterAsync(RegisterAdminRequest request)
    {
        var existingAdmin = await _adminRepository.GetByUsernameAsync(request.Username);
        if (existingAdmin != null)
        {
            throw new ConflictException("Tài khoản đã tồn tại");
        }

        var admin = new Admin
        {
            Username = request.Username.Trim(),
            PasswordHash = BC.HashPassword(request.Password),
            FullName = request.FullName.Trim(),
            Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim(),
            RoleId = 1,
            CreatedAt = DateTime.UtcNow
        };

        await _adminRepository.AddAsync(admin);
        await _adminRepository.SaveChangesAsync();

        return new AdminResponse
        {
            Id = admin.Id,
            Username = admin.Username,
            FullName = admin.FullName,
            Email = admin.Email ?? string.Empty,
            RoleId = admin.RoleId
        };
    }
}