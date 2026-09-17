using demo_dotnet.backend.Models;

namespace demo_dotnet.backend.Data.Interfaces;

public interface IAdminRepository
{
    Task<Admin?> GetByUsernameAsync(string username);
    Task<Admin?> GetByIdAsync(int id);
    Task AddAsync(Admin admin);
    Task SaveChangesAsync();
}