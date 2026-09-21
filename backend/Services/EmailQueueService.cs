using System.Threading.Channels;
using demo_dotnet.backend.Models;
using demo_dotnet.backend.Services.Interface;

namespace demo_dotnet.backend.Services;

public class EmailQueueService : IEmailQueueService
{
    private readonly Channel<EmailMessage> _queue;

    public EmailQueueService()
    {
        var options = new BoundedChannelOptions(100)
        {
            FullMode = BoundedChannelFullMode.Wait
        };
        _queue = Channel.CreateBounded<EmailMessage>(options);
    }

    public async ValueTask EnqueueAsync(EmailMessage message)
    {
        ArgumentNullException.ThrowIfNull(message);
        await _queue.Writer.WriteAsync(message);
    }

    public async ValueTask<EmailMessage> DequeueAsync(CancellationToken cancellationToken)
    {
        return await _queue.Reader.ReadAsync(cancellationToken);
    }
}

