using demo_dotnet.backend.Data.Interfaces;
using demo_dotnet.backend.Models;
using Microsoft.EntityFrameworkCore;

namespace demo_dotnet.backend.Data.Repositories;

public class StudentRepository : IStudentRepository
{
    private readonly AppDbContext _context;

    public StudentRepository(AppDbContext context)
    {
        _context = context;
    }
    public async Task<List<Student>> GetAllStudent()
    {
        return await _context.Students
            .AsNoTracking() // Tối ưu bộ nhớ, bỏ qua việc tracking state cho truy vấn đọc
            .Include(s => s.StudentParents) // Load bảng trung gian StudentParent
                .ThenInclude(sp => sp.Parent) // Load tiếp bảng Parent từ bảng trung gian
            .ToListAsync();
    }
    public async Task<(List<Student> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, string? search, string? className)
    {
        var query = _context.Students.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(s => s.FullName.Contains(search) || s.Mhs.Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(className))
        {
            query = query.Where(s => s.ClassName == className);
        }

        int totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(s => s.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<Student?> GetByIdWithParentsAsync(int id)
    {
        return await _context.Students
            .Include(s => s.StudentParents)
                .ThenInclude(sp => sp.Parent)
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<Student?> GetByIdAsync(int id)
    {
        return await _context.Students.FindAsync(id);
    }

    public async Task<Student?> GetByMhsAsync(string mhs)
    {
        var mhsUpper = mhs.ToUpper();
        return await _context.Students.FirstOrDefaultAsync(s => s.Mhs.ToUpper() == mhsUpper);
    }

    public async Task AddAsync(Student student)
    {
        await _context.Students.AddAsync(student);
    }

    public void Update(Student student)
    {
        _context.Students.Update(student);
    }

    public void Delete(Student student)
    {
        _context.Students.Remove(student);
    }

    public async Task<bool> HasParentRelationAsync(int studentId, int parentId)
    {
        return await _context.StudentParents.AnyAsync(sp => sp.StudentId == studentId && sp.ParentId == parentId);
    }

    public async Task AddParentRelationAsync(StudentParent studentParent)
    {
        await _context.StudentParents.AddAsync(studentParent);
    }

    public async Task RemoveParentRelationAsync(int studentId, int parentId)
    {
        var relation = await _context.StudentParents
            .FirstOrDefaultAsync(sp => sp.StudentId == studentId && sp.ParentId == parentId);

        if (relation != null)
        {
            _context.StudentParents.Remove(relation);
        }
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}