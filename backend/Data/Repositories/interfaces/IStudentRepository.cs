using demo_dotnet.backend.Models;

namespace demo_dotnet.backend.Data.Interfaces;

public interface IStudentRepository
{
    Task<(List<Student> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, string? search, string? className);
    Task<Student?> GetByIdWithParentsAsync(int id);
    Task<Student?> GetByIdAsync(int id);
    Task<Student?> GetByMhsAsync(string mhs);
    Task<List<Student>> GetAllStudent();
    Task AddAsync(Student student);
    void Update(Student student);
    void Delete(Student student);
    Task<bool> HasParentRelationAsync(int studentId, int parentId);
    Task AddParentRelationAsync(StudentParent studentParent);
    Task RemoveParentRelationAsync(int studentId, int parentId);
    Task SaveChangesAsync();
}