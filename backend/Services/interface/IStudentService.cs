using demo_dotnet.backend.DTOs.Request;
using demo_dotnet.backend.DTOs.Response;

namespace demo_dotnet.backend.Services.Interface;

public interface IStudentService
{
    Task<List<StudentDetailResponseDto>> GetStudentsAsync(int page, int pageSize, string? search, string? className, string? mhs);
    Task<StudentDetailResponseDto> GetStudentByIdAsync(int id);
    Task<StudentDetailResponseDto> CreateStudentAsync(StudentRequest request);
    Task<StudentResponseDto> UpdateStudentAsync(int id, StudentRequest request);
    Task DeleteStudentAsync(int id);
    Task AddParentToStudentAsync(int studentId, AddParentToStudentRequest request);
    Task RemoveParentFromStudentAsync(int studentId, int parentId);
}