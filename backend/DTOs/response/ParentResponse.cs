namespace demo_dotnet.backend.DTOs.Response;

public class ParentResponseDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Occupation { get; set; }
    public string? Address { get; set; }
}

public class ParentDetailResponseDto : ParentResponseDto
{
    public List<StudentRelatedDto> Students { get; set; } = new();
}

public class StudentRelatedDto
{
    public int Id { get; set; }
    public string Mhs { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? ClassName { get; set; }
    public string RelationshipType { get; set; } = string.Empty;
}