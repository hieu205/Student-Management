using demo_dotnet.backend.Models;

namespace demo_dotnet.backend.Data.Interfaces;

public interface IAdminRepository
{
    Task<List<Admin>> GetAllAsync();
    Task<Admin?> GetByIdAsync(int id);
    Task<Admin?> GetByUsernameAsync(string username);
    Task<Admin?> GetByEmailAsync(string email);
    Task AddAsync(Admin admin);
    void Update(Admin admin);
    void Delete(Admin admin);
    Task SaveChangesAsync();
}