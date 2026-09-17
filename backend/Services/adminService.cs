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

    public async Task AssignPermissionsAsync(int adminId, List<int> permissionIds)
    {
        // 1. Kiểm tra Admin có tồn tại không
        var admin = await _adminRepository.GetByIdAsync(adminId);
        if (admin == null)
        {
            throw new NotFoundException($"Không tìm thấy admin có id {adminId}");
        }

        // 2. Lấy danh sách ID các permission hợp lệ trong hệ thống từ danh sách truyền vào
        var validPermissionIds = await _context.Permissions
            .Where(p => permissionIds.Contains(p.Id))
            .Select(p => p.Id)
            .ToListAsync();

        // 3. Lấy danh sách ID các permission mà Admin NÀY ĐÃ CÓ sẵn trong Database
        var existingPermissionIds = await _context.AdminPermissions
            .Where(ap => ap.AdminId == adminId)
            .Select(ap => ap.PermissionId)
            .ToListAsync();

        // 4. Lọc ra những ID quyền MỚI CHƯA CÓ (tránh chèn trùng lặp)
        var newPermissionIds = validPermissionIds
            .Except(existingPermissionIds)
            .ToList();

        // 5. Chỉ chèn thêm các quyền mới
        foreach (var permId in newPermissionIds)
        {
            _context.AdminPermissions.Add(new AdminPermission
            {
                AdminId = adminId,
                PermissionId = permId
            });
        }

        // 6. Lưu xuống Database
        await _context.SaveChangesAsync();
    }

    private static AdminResponse MapToResponse(Admin admin)
    {
        return new AdminResponse
        {
            Id = admin.Id,
            Username = admin.Username,
            FullName = admin.FullName,
            Email = admin.Email ?? string.Empty
        };
    }
    public async Task RevokePermissionsAsync(int adminId, List<int> permissionIds)
    {
        // 1. Kiểm tra Admin có tồn tại không
        var admin = await _adminRepository.GetByIdAsync(adminId);
        if (admin == null)
        {
            throw new NotFoundException($"Không tìm thấy admin có id {adminId}");
        }

        // 2. Tìm danh sách quyền cần thu hồi thuộc về Admin này
        var permissionsToRevoke = await _context.AdminPermissions
            .Where(ap => ap.AdminId == adminId && permissionIds.Contains(ap.PermissionId))
            .ToListAsync();

        if (permissionsToRevoke.Any())
        {
            // 3. Xóa các quyền được chỉ định khỏi bảng admin_permission
            _context.AdminPermissions.RemoveRange(permissionsToRevoke);
            await _context.SaveChangesAsync();
        }
    }
}