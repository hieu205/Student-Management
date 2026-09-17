namespace demo_dotnet.backend.Models;

public class Student
{
    public int Id { get; set; }
    public string Mhs { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public DateOnly? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? ClassName { get; set; }
    public string? Address { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<StudentParent> StudentParents { get; set; } = new List<StudentParent>();
}