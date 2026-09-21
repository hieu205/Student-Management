using demo_dotnet.backend.Services.Interface;

namespace demo_dotnet.backend.Services;

public class EmailWorkerService : BackgroundService
{
    private readonly ILogger<EmailWorkerService> _logger;
    private readonly IEmailQueueService _emailQueue;
    private readonly IServiceProvider _serviceProvider;

    public EmailWorkerService(
        ILogger<EmailWorkerService> logger,
        IEmailQueueService emailQueue,
        IServiceProvider serviceProvider)
    {
        _logger = logger;
        _emailQueue = emailQueue;
        _serviceProvider = serviceProvider;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Email Worker Service is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var emailMessage = await _emailQueue.DequeueAsync(stoppingToken);

                // Create a scope to resolve scoped services like IEmailService
                using var scope = _serviceProvider.CreateScope();
                var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

                _logger.LogInformation("Sending email to {To} with subject {Subject}", emailMessage.To, emailMessage.Subject);
                
                await emailService.SendEmailAsync(emailMessage.To, emailMessage.Subject, emailMessage.Body);
                
                _logger.LogInformation("Successfully sent email to {To}", emailMessage.To);
            }
            catch (OperationCanceledException)
            {
                // Prevent throwing if stoppingToken is canceled
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred executing email worker.");
            }
        }
        
        _logger.LogInformation("Email Worker Service is stopping.");
    }
}

