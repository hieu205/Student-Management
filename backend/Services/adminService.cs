using demo_dotnet.backend.Data.Interfaces;
using demo_dotnet.backend.DTOs.Response;
using demo_dotnet.backend.exception;
using demo_dotnet.backend.Services.Interface;

namespace demo_dotnet.backend.Services;

public class AdminService : IAdminService
{
    private readonly IAdminRepository _adminRepository;

    public AdminService(IAdminRepository adminRepository)
    {
        _adminRepository = adminRepository;
    }

    public async Task<AdminResponse> getProfileAdmin(int id)
    {
        var admin = await _adminRepository.GetByIdAsync(id);
        if (admin == null)
        {
            throw new NotFoundException($"Khong tim thay admin co id {id}");
        }

        return new AdminResponse
        {
            Id = admin.Id,
            Username = admin.Username,
            FullName = admin.FullName,
            Gmail = admin.Email
        };
    }
}