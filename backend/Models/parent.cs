namespace demo_dotnet.backend.Models;

public class Parent
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Occupation { get; set; }
    public string? Address { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<StudentParent> StudentParents { get; set; } = new List<StudentParent>();
}