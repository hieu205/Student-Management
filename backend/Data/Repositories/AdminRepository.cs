using demo_dotnet.backend.Data.Interfaces;
using demo_dotnet.backend.Models;
using Microsoft.EntityFrameworkCore;

namespace demo_dotnet.backend.Data.Repositories;

public class AdminRepository : IAdminRepository
{
    private readonly AppDbContext _context;

    public AdminRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Admin?> GetByUsernameAsync(string username)
    {
        return await _context.Admins.FirstOrDefaultAsync(a => a.Username == username);
    }

    public async Task<Admin?> GetByIdAsync(int id)
    {
        return await _context.Admins.FindAsync(id);
    }
}