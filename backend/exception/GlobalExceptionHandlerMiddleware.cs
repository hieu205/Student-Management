using System.Net;
using System.Text.Json;

namespace demo_dotnet.backend.exception;

public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;

    public GlobalExceptionHandlerMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlerMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Microsoft.AspNetCore.Http.BadHttpRequestException ex)
        {
            await HandleExceptionAsync(context, (HttpStatusCode)ex.StatusCode, "Yêu cầu không hợp lệ hoặc vượt giới hạn dung lượng");
        }
        catch (AppException ex)
        {
            await HandleExceptionAsync(context, ex.StatusCode, ex.Message, ex.Errors);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException ex)
        {
            _logger.LogError(ex, "Database update exception occurred");
            var message = "Lỗi cập nhật cơ sở dữ liệu: vi phạm ràng buộc dữ liệu";
            if (ex.InnerException is Npgsql.PostgresException pgEx)
            {
                if (pgEx.SqlState == "23505") message = "Dữ liệu đã tồn tại trong hệ thống";
                else if (pgEx.SqlState == "23503") message = "Dữ liệu liên kết không tồn tại trong hệ thống";
                else if (pgEx.SqlState == "23514") message = $"Giá trị không hợp lệ đối với ràng buộc hệ thống ({pgEx.ConstraintName})";
            }
            await HandleExceptionAsync(context, HttpStatusCode.BadRequest, message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred");
            await HandleExceptionAsync(context, HttpStatusCode.InternalServerError, "Lỗi hệ thống");
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, HttpStatusCode statusCode, string message, object? errors = null)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var response = new
        {
            message,
            errors
        };

        var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        return context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
    }
}
