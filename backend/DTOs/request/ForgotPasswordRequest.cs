using System.ComponentModel.DataAnnotations;

namespace demo_dotnet.backend.DTOs.Request;

public class ForgotPasswordRequest
{
    [Required(ErrorMessage = "Email không được để trống")]
    [EmailAddress(ErrorMessage = "Email không đúng định dạng")]
    public string Email { get; set; } = string.Empty;
}