using demo_dotnet.backend.Data;
using demo_dotnet.backend.Data.Interfaces;
using demo_dotnet.backend.DTOs.Request;
using demo_dotnet.backend.DTOs.Response;
using demo_dotnet.backend.exception;
using demo_dotnet.backend.Models;
using demo_dotnet.backend.Services.Interface;
using Microsoft.EntityFrameworkCore;

namespace demo_dotnet.backend.Services;

public class AdminService : IAdminService
{
    private readonly IAdminRepository _adminRepository;
    private readonly AppDbContext _context;

    public AdminService(IAdminRepository adminRepository, AppDbContext context)
    {
        _adminRepository = adminRepository;
        _context = context;
    }

    public async Task<List<AdminResponse>> GetAllAdmins()
    {
        var admins = await _adminRepository.GetAllAsync();
        return admins.Select(MapToResponse).ToList();
    }

    public async Task<AdminResponse> GetProfileAdmin(int id)
    {
        var admin = await _adminRepository.GetByIdAsync(id);
        if (admin == null)
        {
            throw new NotFoundException($"Không tìm thấy admin có id {id}");
        }

        return MapToResponse(admin);
    }

    public async Task<AdminResponse> UpdateAdmin(int id, AdminRequest request)
    {
        var admin = await _adminRepository.GetByIdAsync(id);
        if (admin == null)
        {
            throw new NotFoundException($"Không tìm thấy admin có id {id}");
        }

        // Validate trùng Email với Admin khác (nếu Email có giá trị)
        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var existingEmail = await _adminRepository.GetByEmailAsync(request.Email);
            if (existingEmail != null && existingEmail.Id != id)
            {
                throw new ConflictException("Email này đã được sử dụng bởi tài khoản khác");
            }
        }

        admin.FullName = request.FullName;
        admin.Email = request.Email;
        admin.CreatedAt = DateTime.SpecifyKind(admin.CreatedAt, DateTimeKind.Utc);

        _adminRepository.Update(admin);
        await _adminRepository.SaveChangesAsync();

        return MapToResponse(admin);
    }

    public async Task DeleteAdmin(int id)
    {
        var admin = await _adminRepository.GetByIdAsync(id);
        if (admin == null)
        {
            throw new NotFoundException($"Không tìm thấy admin có id {id}");
        }

        _adminRepository.Delete(admin);
        await _adminRepository.SaveChangesAsync();
    }

    public async Task SyncPermissionsAsync(int adminId, List<string> targetPermissionCodes)
    {
        // 1. Kiểm tra Admin có tồn tại không
        var admin = await _adminRepository.GetByIdAsync(adminId);
        if (admin == null)
        {
            throw new NotFoundException($"Không tìm thấy admin có id {adminId}");
        }

        targetPermissionCodes = targetPermissionCodes?.Distinct().ToList() ?? new List<string>();

        // 2. Lấy các quyền thực sự hợp lệ tồn tại trong bảng Permissions
        var validPermissions = await _context.Permissions
            .Where(p => targetPermissionCodes.Contains(p.Code))
            .ToListAsync();

        var validPermissionIds = validPermissions.Select(p => p.Id).ToList();
        var validPermissionCodes = validPermissions.Select(p => p.Code).ToList();

        // ⚠️ ĐOẠN CHECK MỚI: Kiểm tra xem có code nào Frontend gửi lên bị thiếu trong DB không
        var invalidCodes = targetPermissionCodes.Except(validPermissionCodes).ToList();
        if (invalidCodes.Any())
        {
            throw new NotFoundException($"Các quyền sau không tồn tại trong hệ thống: {string.Join(", ", invalidCodes)}");
        }

        // 3. Lấy danh sách các quyền HIỆN TẠI của Admin trong DB
        var currentAdminPermissions = await _context.AdminPermissions
            .Where(ap => ap.AdminId == adminId)
            .ToListAsync();

        var currentPermissionIds = currentAdminPermissions.Select(ap => ap.PermissionId).ToList();

        // 4. Lọc quyền CẦN XÓA
        var permissionsToRemove = currentAdminPermissions
            .Where(ap => !validPermissionIds.Contains(ap.PermissionId))
            .ToList();

        // 5. Lọc quyền CẦN THÊM
        var permissionIdsToAdd = validPermissionIds
            .Except(currentPermissionIds)
            .Select(permId => new AdminPermission
            {
                AdminId = adminId,
                PermissionId = permId
            })
            .ToList();

        // 6. Thực hiện cập nhật Database
        if (permissionsToRemove.Any())
        {
            _context.AdminPermissions.RemoveRange(permissionsToRemove);
        }

        if (permissionIdsToAdd.Any())
        {
            await _context.AdminPermissions.AddRangeAsync(permissionIdsToAdd);
        }

        // 7. Lưu thay đổi xuống Database
        if (permissionsToRemove.Any() || permissionIdsToAdd.Any())
        {
            await _context.SaveChangesAsync();
        }
    }

    private static AdminResponse MapToResponse(Admin admin)
    {
        var permissions = admin.AdminPermissions?
            .Where(ap => ap.Permission != null)
            .Select(ap => ap.Permission.Code)
            .ToList() ?? new List<string>();

        return new AdminResponse
        {
            Id = admin.Id,
            Username = admin.Username,
            FullName = admin.FullName,
            Email = admin.Email ?? string.Empty,
            Permissions = permissions
        };
    }
}