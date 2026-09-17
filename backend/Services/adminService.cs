using demo_dotnet.backend.Data.Interfaces;
using demo_dotnet.backend.DTOs.Request;
using demo_dotnet.backend.DTOs.Response;
using demo_dotnet.backend.exception;
using demo_dotnet.backend.Models;
using demo_dotnet.backend.Services.Interface;

namespace demo_dotnet.backend.Services;

public class AdminService : IAdminService
{
    private readonly IAdminRepository _adminRepository;

    public AdminService(IAdminRepository adminRepository)
    {
        _adminRepository = adminRepository;
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

    private static AdminResponse MapToResponse(Admin admin)
    {
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