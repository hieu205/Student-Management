using demo_dotnet.backend.DTOs.Request;
using demo_dotnet.backend.DTOs.Response;

namespace demo_dotnet.backend.Services.Interface;

public interface IParentService
{
    Task<List<ParentResponseDto>> getAllParentOrSearchByPhone(string? search);
    Task<ParentResponseDto> GetParentByIdAsync(int id);
    Task<ParentResponseDto> CreateParentAsync(ParentRequest request);
    Task<ParentResponseDto> UpdateParentByIdAsync(int id, ParentRequest request);
    Task<string> DeleteParentByIdAsync(int id);
}