using System.Net;

namespace demo_dotnet.backend.exception;

public class AppException : Exception
{
    public HttpStatusCode StatusCode { get; }
    public object? Errors { get; }

    public AppException(string message, HttpStatusCode statusCode = HttpStatusCode.BadRequest, object? errors = null)
        : base(message)
    {
        StatusCode = statusCode;
        Errors = errors;
    }
}

public class BadRequestException : AppException
{
    public BadRequestException(string message, object? errors = null)
        : base(message, HttpStatusCode.BadRequest, errors) { }
}

public class NotFoundException : AppException
{
    public NotFoundException(string message) : base(message, HttpStatusCode.NotFound) { }
}

public class ConflictException : AppException
{
    public ConflictException(string message) : base(message, HttpStatusCode.Conflict) { }
}

public class UnauthorizedException : AppException
{
    public UnauthorizedException(string message = "Chưa đăng nhập hoặc token hết hạn")
        : base(message, HttpStatusCode.Unauthorized) { }
}

public class ForbiddenException : AppException
{
    public ForbiddenException(string message = "Bạn không có quyền thực hiện hành động này")
        : base(message, HttpStatusCode.Forbidden) { }
}