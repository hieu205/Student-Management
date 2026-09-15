using System.ComponentModel.DataAnnotations;

namespace demo_dotnet.backend.DTOs.Request;

public class AddParentToStudentRequest
{
    [Required]
    public int ParentId { get; set; }

    [Required(ErrorMessage = "Loại quan hệ không được để trống")]
    [RegularExpression("^(Father|Mother|Guardian)$", ErrorMessage = "Quan hệ phải là 'Father', 'Mother' hoặc 'Guardian'")]
    public string RelationshipType { get; set; } = string.Empty;
}