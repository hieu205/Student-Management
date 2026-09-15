namespace demo_dotnet.backend.DTOs.Response;

public class StudentResponseDto
{
    public int Id { get; set; }
    public string Mhs { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? ClassName { get; set; }
    public string? Address { get; set; }
}

public class StudentDetailResponseDto : StudentResponseDto
{
    public List<ParentRelatedDto> Parents { get; set; } = new();
}

public class ParentRelatedDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string RelationshipType { get; set; } = string.Empty;
}