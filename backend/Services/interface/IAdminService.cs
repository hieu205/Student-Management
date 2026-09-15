using demo_dotnet.backend.Data.Repositories;
using demo_dotnet.backend.DTOs.Response;
using demo_dotnet.backend.Models;

namespace demo_dotnet.backend.Services.Interface;

public interface IAdminService
{
    Task<AdminResponse> getProfileAdmin(int id);
}