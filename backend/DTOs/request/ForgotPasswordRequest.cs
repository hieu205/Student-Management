using System.ComponentModel.DataAnnotations;

namespace demo_dotnet.backend.DTOs.Request;

public class ForgotPasswordRequest
{
    [Required(ErrorMessage = "Email không được để trống")]
    [RegularExpression(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|vn|net|org|edu|gov|io|biz|info)$", ErrorMessage = "Email không đúng định dạng (VD: @gmail.com)")]
    public string Email { get; set; } = string.Empty;
}