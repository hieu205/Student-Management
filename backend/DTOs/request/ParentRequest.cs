using System.ComponentModel.DataAnnotations;

namespace demo_dotnet.backend.DTOs.Request;

public class ParentRequest
{
    [Required(ErrorMessage = "Họ tên không được để trống")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Số điện thoại không được để trống")]
    [Phone(ErrorMessage = "Số điện thoại không đúng định dạng")]
    public string PhoneNumber { get; set; } = string.Empty;

    [EmailAddress(ErrorMessage = "Email không đúng định dạng")]
    public string? Email { get; set; }

    public string? Occupation { get; set; }
    public string? Address { get; set; }
}