using System.ComponentModel.DataAnnotations;

namespace demo_dotnet.backend.DTOs.Request;

public class ResetPasswordRequest
{
    [Required(ErrorMessage = "Token không được để trống")]
    public string Token { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu mới không được để trống")]
    [MinLength(6, ErrorMessage = "Mật khẩu mới phải từ 6 ký tự trở lên")]
    public string NewPassword { get; set; } = string.Empty;
}