using demo_dotnet.backend.DTOs.Request;
using demo_dotnet.backend.DTOs.Response;

namespace demo_dotnet.backend.Services.Interface;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginRequest request);
}