using System.ComponentModel.DataAnnotations;

namespace demo_dotnet.backend.DTOs;

public class RoleRequest : IValidatableObject
{
    [Required(ErrorMessage = "Tên role không được để trống.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Tên role phải từ 2 đến 100 ký tự.")]
    public string Name { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "Mô tả không được vượt quá 500 ký tự.")]
    public string? Description { get; set; }

    public List<int> PermissionIds { get; set; } = new();

    // IValidatableObject để validate List<int> đúng cách
    // vì [MinLength] không hoạt động trên List<T>
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (PermissionIds == null || PermissionIds.Count == 0)
        {
            yield return new ValidationResult(
                "Role phải chứa ít nhất một quyền (permission).",
                new[] { nameof(PermissionIds) }
            );
        }
        else if (PermissionIds.Any(id => id <= 0))
        {
            yield return new ValidationResult(
                "Tất cả Permission ID phải là số nguyên dương.",
                new[] { nameof(PermissionIds) }
            );
        }
        else if (PermissionIds.Distinct().Count() != PermissionIds.Count)
        {
            yield return new ValidationResult(
                "Danh sách Permission ID không được chứa giá trị trùng lặp.",
                new[] { nameof(PermissionIds) }
            );
        }
    }
}