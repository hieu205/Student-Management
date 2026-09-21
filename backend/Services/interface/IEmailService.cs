namespace demo_dotnet.backend.Services.Interface;

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body);
}