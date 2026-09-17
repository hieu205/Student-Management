using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using demo_dotnet.backend.Data;
using demo_dotnet.backend.Data.Interfaces;
using demo_dotnet.backend.DTOs.Request;
using demo_dotnet.backend.DTOs.Response;
using demo_dotnet.backend.exception;
using demo_dotnet.backend.Models;
using demo_dotnet.backend.Services.Interface;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using BC = BCrypt.Net.BCrypt;

namespace demo_dotnet.backend.Services;

public class AuthService : IAuthService
{
    private readonly IAdminRepository _adminRepository;
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(IAdminRepository adminRepository, AppDbContext context, IConfiguration configuration)
    {
        _adminRepository = adminRepository;
        _context = context;
        _configuration = configuration;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequest request)
    {
        var admin = await _adminRepository.GetByUsernameAsync(request.Username);

        if (admin == null || !BC.Verify(request.Password, admin.PasswordHash))
        {
            throw new UnauthorizedException("Sai tài khoản hoặc mật khẩu");
        }

        // Query danh sách permission.code từ bảng admin_permission
        var permissions = await _context.AdminPermissions
            .Where(ap => ap.AdminId == admin.Id)
            .Select(ap => ap.Permission.Code)
            .ToListAsync();

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, admin.Id.ToString()),
            new Claim(ClaimTypes.Name, admin.Username)
        };

        foreach (var code in permissions)
        {
            claims.Add(new Claim("permission", code));
        }

        var tokenHandler = new JwtSecurityTokenHandler();
        var jwtSecret = _configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt:Secret chưa được cấu hình trong appsettings.json");
        var key = Encoding.UTF8.GetBytes(jwtSecret);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
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
                Email = admin.Email ?? string.Empty
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

        // 1. Khởi tạo Admin
        var admin = new Admin
        {
            Username = request.Username.Trim(),
            PasswordHash = BC.HashPassword(request.Password),
            FullName = request.FullName.Trim(),
            Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        await _adminRepository.AddAsync(admin);
        await _adminRepository.SaveChangesAsync(); // Lưu để sinh admin.Id

        // 2. Query lấy ID của 2 quyền student:read và parent:read (Không phân biệt hoa/thường)
        var defaultPermissionCodes = new[] { "student:read", "parent:read" };

        var defaultPermissions = await _context.Permissions
            .Where(p => defaultPermissionCodes.Contains(p.Code.ToLower()))
            .ToListAsync();

        if (!defaultPermissions.Any())
        {
            throw new InvalidOperationException("Chưa seed dữ liệu 'student:read' và 'parent:read' trong bảng permission.");
        }

        // 3. Gán quyền mặc định vào admin_permission
        foreach (var perm in defaultPermissions)
        {
            _context.AdminPermissions.Add(new AdminPermission
            {
                AdminId = admin.Id,
                PermissionId = perm.Id
            });
        }

        // 4. Lưu thay đổi bảng admin_permission
        await _context.SaveChangesAsync();

        return new AdminResponse
        {
            Id = admin.Id,
            Username = admin.Username,
            FullName = admin.FullName,
            Email = admin.Email ?? string.Empty
        };
    }
}