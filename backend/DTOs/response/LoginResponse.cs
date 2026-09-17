namespace demo_dotnet.backend.DTOs.Response;

public class LoginResponseDto
{
    public string AccessToken { get; set; } = string.Empty;
    public int ExpiresIn { get; set; }
    public AdminDto Admin { get; set; } = null!;
}

public class AdminDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    // public int RoleId { get; set; } = 1;
}