using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
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
    private readonly IEmailService _emailService;

    public AuthService(
        IAdminRepository adminRepository,
        AppDbContext context,
        IConfiguration configuration,
        IEmailService emailService)
    {
        _adminRepository = adminRepository;
        _context = context;
        _configuration = configuration;
        _emailService = emailService;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequest request)
    {
        var admin = await _adminRepository.GetByUsernameAsync(request.Username);

        if (admin == null || !BCrypt.Net.BCrypt.Verify(request.Password, admin.PasswordHash))
        {
            throw new UnauthorizedException("Sai tài khoản hoặc mật khẩu");
        }

        var permissions = await _context.AdminPermissions
            .Where(ap => ap.AdminId == admin.Id)
            .Select(ap => ap.Permission.Code)
            .Distinct()
            .ToListAsync();

        var adminPermissionIds = await _context.AdminPermissions
            .Where(ap => ap.AdminId == admin.Id)
            .Select(ap => ap.PermissionId)
            .ToListAsync();

        var roles = await _context.RolePermissions
            .Where(rp => adminPermissionIds.Contains(rp.PermissionId))
            .Select(rp => rp.Role.Name)
            .Distinct()
            .ToListAsync();

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

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var existingEmail = await _adminRepository.GetByEmailAsync(request.Email);
            if (existingEmail != null)
            {
                throw new ConflictException("Email này đã được sử dụng bởi tài khoản khác");
            }
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

    public async Task ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var admin = await _adminRepository.GetByEmailAsync(request.Email.Trim());

        if (admin == null) return;

        var resetToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));

        admin.PasswordResetToken = resetToken;
        admin.ResetTokenExpires = DateTime.UtcNow.AddMinutes(15);

        _adminRepository.Update(admin);
        await _adminRepository.SaveChangesAsync();

        var clientUrl = _configuration["AppSettings:ClientUrl"] ?? "http://localhost:3000";
        var resetLink = $"{clientUrl}/reset-password?token={resetToken}";

        var emailBody = $@"
            <h3>Yêu cầu đặt lại mật khẩu</h3>
            <p>Vui lòng nhấp vào liên kết bên dưới để đặt lại mật khẩu (Liên kết có hiệu lực 15 phút):</p>
            <p><a href='{resetLink}'>Đặt lại mật khẩu</a></p>
            <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>";

        await _emailService.SendEmailAsync(admin.Email!, "Yêu cầu đặt lại mật khẩu", emailBody);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request)
    {
        var admin = await _context.Admins.FirstOrDefaultAsync(a => a.PasswordResetToken == request.Token);

        if (admin == null || !admin.ResetTokenExpires.HasValue)
        {
            throw new BadRequestException("Token không hợp lệ hoặc đã hết hạn.");
        }

        var expireTime = admin.ResetTokenExpires.Value;

        // So sánh thời gian an toàn chặn cả UTC lẫn Local do Legacy Timestamp
        if (expireTime < DateTime.UtcNow && expireTime < DateTime.Now)
        {
            throw new BadRequestException("Token không hợp lệ hoặc đã hết hạn.");
        }

        admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        admin.PasswordResetToken = null;
        admin.ResetTokenExpires = null;

        _adminRepository.Update(admin);
        await _adminRepository.SaveChangesAsync();
    }

    // public async Task ChangePasswordAsync(int adminId, ChangePasswordRequest request)
    // {
    //     var admin = await _adminRepository.GetByIdAsync(adminId);
    //     if (admin == null)
    //     {
    //         throw new NotFoundException("Không tìm thấy người dùng.");
    //     }

    //     if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, admin.PasswordHash))
    //     {
    //         throw new BadRequestException("Mật khẩu cũ không chính xác.");
    //     }

    //     admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

    //     _adminRepository.Update(admin);
    //     await _adminRepository.SaveChangesAsync();
    // }
}