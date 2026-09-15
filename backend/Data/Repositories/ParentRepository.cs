using demo_dotnet.backend.Data.Interfaces;
using demo_dotnet.backend.Models;
using Microsoft.EntityFrameworkCore;

namespace demo_dotnet.backend.Data.Repositories;

public class ParentRepository : IParentRepository
{
    private readonly AppDbContext _context;

    public ParentRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Parent>> GetAllAsync(string? search)
    {
        var query = _context.Parents.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(p => p.FullName.Contains(search) || p.PhoneNumber.Contains(search));
        }

        return await query
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }
    public async Task<(List<Parent> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, string? search)
    {
        var query = _context.Parents.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(p => p.FullName.Contains(search) || p.PhoneNumber.Contains(search));
        }

        int totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<Parent?> GetByIdWithStudentsAsync(int id)
    {
        return await _context.Parents
            .Include(p => p.StudentParents)
                .ThenInclude(sp => sp.Student)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<Parent?> GetByIdAsync(int id)
    {
        return await _context.Parents.FindAsync(id);
    }

    public async Task<Parent?> GetByPhoneNumberAsync(string phoneNumber)
    {
        return await _context.Parents.FirstOrDefaultAsync(p => p.PhoneNumber == phoneNumber);
    }

    public async Task AddAsync(Parent parent)
    {
        await _context.Parents.AddAsync(parent);
    }

    public void Update(Parent parent)
    {
        _context.Parents.Update(parent);
    }

    public void Delete(Parent parent)
    {
        _context.Parents.Remove(parent);
    }

    public async Task<bool> HasStudentRelationsAsync(int parentId)
    {
        return await _context.StudentParents.AnyAsync(sp => sp.ParentId == parentId);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}