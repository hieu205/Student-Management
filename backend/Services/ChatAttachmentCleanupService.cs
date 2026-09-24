using demo_dotnet.backend.Services.Interfaces;

namespace demo_dotnet.backend.Services;

public class ChatAttachmentCleanupService(IServiceScopeFactory scopes, ILogger<ChatAttachmentCleanupService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromHours(1));
        do
        {
            try
            {
                using var scope = scopes.CreateScope();
                await scope.ServiceProvider.GetRequiredService<IChatService>().CleanupAttachmentsAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception ex) { logger.LogError(ex, "Chat attachment cleanup failed; will retry next hour."); }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
