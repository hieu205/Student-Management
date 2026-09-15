namespace demo_dotnet.backend.Models;

public class StudentParent
{
    public int StudentId { get; set; }
    public Student Student { get; set; } = null!;

    public int ParentId { get; set; }
    public Parent Parent { get; set; } = null!;

    public string RelationshipType { get; set; } = string.Empty;
}