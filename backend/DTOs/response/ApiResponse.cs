namespace demo_dotnet.backend.DTOs;

/// <summary>
/// Wrapper chuẩn hoá cho tất cả response của API.
/// </summary>
public class ApiResponse<T>
{
    public bool IsSuccess { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }

    public static ApiResponse<T> Success(T? data, string message = "Thành công.")
    {
        return new ApiResponse<T>
        {
            IsSuccess = true,
            Message = message,
            Data = data
        };
    }

    public static ApiResponse<T> Fail(string message)
    {
        return new ApiResponse<T>
        {
            IsSuccess = false,
            Message = message,
            Data = default
        };
    }
}
