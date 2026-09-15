using demo_dotnet.backend.Models;

namespace demo_dotnet.backend.Repositories.Interface;

public interface IStudentParentRepository
{
    Task AddAsync(StudentParent studentParent);
    Task RemoveAsync(StudentParent studentParent);
    Task<StudentParent?> GetAsync(int studentId, int parentId);
    Task<bool> ExistsAsync(int studentId, int parentId);
    Task SaveChangesAsync();
}