using demo_dotnet.backend.Data;
using demo_dotnet.backend.Models;
using demo_dotnet.backend.Data.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace demo_dotnet.backend.Data.Repositories;

public class StudentParentRepository : IStudentParentRepository
{
    private readonly AppDbContext _context;

    public StudentParentRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(StudentParent studentParent)
    {
        await _context.Set<StudentParent>().AddAsync(studentParent);
    }

    public Task RemoveAsync(StudentParent studentParent)
    {
        _context.Set<StudentParent>().Remove(studentParent);
        return Task.CompletedTask;
    }

    public async Task<StudentParent?> GetAsync(int studentId, int parentId)
    {
        return await _context.Set<StudentParent>()
            .FirstOrDefaultAsync(sp => sp.StudentId == studentId && sp.ParentId == parentId);
    }

    public async Task<bool> ExistsAsync(int studentId, int parentId)
    {
        return await _context.Set<StudentParent>()
            .AnyAsync(sp => sp.StudentId == studentId && sp.ParentId == parentId);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}