using System.ComponentModel.DataAnnotations;

namespace demo_dotnet.backend.DTOs.Request;

public class StudentRequest
{
    [Required(ErrorMessage = "Mã học sinh không được để trống")]
    public string Mhs { get; set; } = string.Empty;

    [Required(ErrorMessage = "Họ tên không được để trống")]
    public string FullName { get; set; } = string.Empty;

    public string? DateOfBirth { get; set; }

    [RegularExpression("^(Male|Female)$", ErrorMessage = "Giới tính phải là 'Male' hoặc 'Female'")]
    public string? Gender { get; set; }

    public string? ClassName { get; set; }
    public string? Address { get; set; }

    public List<AddParentToStudentRequest>? Parents { get; set; }
}