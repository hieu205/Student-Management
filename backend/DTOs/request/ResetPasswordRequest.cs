using System.ComponentModel.DataAnnotations;

namespace demo_dotnet.backend.DTOs.Request;

public class ResetPasswordRequest
{
    [Required(ErrorMessage = "Token không được để trống")]
    public string Token { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu mới không được để trống")]
    [RegularExpression(@"^[A-Z](?=.*\d)(?=.*[\W_]).{5,}$", ErrorMessage = "Mật khẩu mới phải có ít nhất 6 ký tự, bắt đầu bằng chữ in hoa, có chứa số và ký tự đặc biệt")]
    public string NewPassword { get; set; } = string.Empty;
}