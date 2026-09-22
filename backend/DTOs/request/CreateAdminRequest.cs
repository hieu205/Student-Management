using System.ComponentModel.DataAnnotations;

namespace demo_dotnet.backend.DTOs.Request;

public class CreateAdminRequest
{
    [Required(ErrorMessage = "Họ tên không được để trống")]
    [RegularExpression(@"^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$", ErrorMessage = "Họ tên không được chứa số và ký tự đặc biệt")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Username không được để trống")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu không được để trống")]
    [RegularExpression(@"^[A-Z](?=.*[0-9])(?=.*[!@#$%^&*()_+{}\[\]:;""'<>,.?/~`|\\-]).{5,}$", ErrorMessage = "Mật khẩu phải bắt đầu bằng chữ hoa, có chứa số, ký tự đặc biệt và tối thiểu 6 ký tự")]
    public string Password { get; set; } = string.Empty;

    [RegularExpression(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|vn|net|org|edu|gov|io|biz|info)$", ErrorMessage = "Email không đúng định dạng")]
    public string? Email { get; set; }
}
