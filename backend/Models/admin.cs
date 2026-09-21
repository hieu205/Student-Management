namespace demo_dotnet.backend.Models;

public class Admin
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


    public string? PasswordResetToken { get; set; }
    public DateTime? ResetTokenExpires { get; set; }
    public ICollection<AdminPermission> AdminPermissions { get; set; } = new List<AdminPermission>();
}