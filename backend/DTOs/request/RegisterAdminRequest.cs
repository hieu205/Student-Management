using System.ComponentModel.DataAnnotations;

namespace demo_dotnet.backend.DTOs.Request;

public class RegisterAdminRequest
{
    [Required(ErrorMessage = "Tài khoản không được để trống")]
    [MaxLength(50, ErrorMessage = "Tài khoản tối đa 50 ký tự")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu không được để trống")]
    [RegularExpression(@"^[A-Z](?=.*\d)(?=.*[\W_]).{5,}$", ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự, bắt đầu bằng chữ in hoa, có chứa số và ký tự đặc biệt")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Họ tên không được để trống")]
    [MaxLength(100, ErrorMessage = "Họ tên tối đa 100 ký tự")]
    public string FullName { get; set; } = string.Empty;

    [RegularExpression(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|vn|net|org|edu|gov|io|biz|info)$", ErrorMessage = "Email không đúng định dạng (VD: @gmail.com)")]
    [MaxLength(100, ErrorMessage = "Email tối đa 100 ký tự")]
    public string? Email { get; set; }
}
