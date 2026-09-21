using demo_dotnet.backend.Models;

namespace demo_dotnet.backend.Services.Interface;

public interface IEmailQueueService
{
    ValueTask EnqueueAsync(EmailMessage message);
    ValueTask<EmailMessage> DequeueAsync(CancellationToken cancellationToken);
}

