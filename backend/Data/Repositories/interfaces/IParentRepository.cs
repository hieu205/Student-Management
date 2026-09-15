using demo_dotnet.backend.Models;

namespace demo_dotnet.backend.Data.Interfaces;

public interface IParentRepository
{
    Task<(List<Parent> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, string? search);
    Task<Parent?> GetByIdWithStudentsAsync(int id);
    Task<Parent?> GetByIdAsync(int id);
    Task<Parent?> GetByPhoneNumberAsync(string phoneNumber);
    Task AddAsync(Parent parent);

    Task<List<Parent>> GetAllAsync(string? search);
    void Update(Parent parent);
    void Delete(Parent parent);
    Task<bool> HasStudentRelationsAsync(int parentId);
    Task SaveChangesAsync();
}