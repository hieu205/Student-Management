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

        // Đảm bảo chỉ định rõ namespace BCrypt.Net.BCrypt để tránh lỗi BinaryReader
        if (admin == null || !BCrypt.Net.BCrypt.Verify(request.Password, admin.PasswordHash))
        {
            throw new UnauthorizedException("Sai tài khoản hoặc mật khẩu");
        }

        // 1. Query danh sách permission.code của Admin từ admin_permission
        var permissions = await _context.AdminPermissions
            .Where(ap => ap.AdminId == admin.Id)
            .Select(ap => ap.Permission.Code)
            .Distinct()
            .ToListAsync();

        // 2. Query lấy tên các Role khớp với danh sách Permission của Admin
        var adminPermissionIds = await _context.AdminPermissions
            .Where(ap => ap.AdminId == admin.Id)
            .Select(ap => ap.PermissionId)
            .ToListAsync();

        var roles = await _context.RolePermissions
            .Where(rp => adminPermissionIds.Contains(rp.PermissionId))
            .Select(rp => rp.Role.Name)
            .Distinct()
            .ToListAsync();

        // 3. Tạo Claims
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, admin.Id.ToString()),
            new Claim(ClaimTypes.Name, admin.Username)
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        foreach (var code in permissions)
        {
            claims.Add(new Claim("permission", code));
        }

        // 4. Tạo JWT Token
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

        // 5. Trả về thông tin
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
                Roles = roles,
                Permissions = permissions
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
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName.Trim(),
            Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        await _adminRepository.AddAsync(admin);
        await _adminRepository.SaveChangesAsync();

        var defaultPermissionCodes = new[] { "student:read", "parent:read" };

        var defaultPermissions = await _context.Permissions
            .Where(p => defaultPermissionCodes.Contains(p.Code.ToLower()))
            .ToListAsync();

        if (!defaultPermissions.Any())
        {
            throw new InvalidOperationException("Chưa seed dữ liệu 'student:read' và 'parent:read' trong bảng permission.");
        }

        foreach (var perm in defaultPermissions)
        {
            _context.AdminPermissions.Add(new AdminPermission
            {
                AdminId = admin.Id,
                PermissionId = perm.Id
            });
        }

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