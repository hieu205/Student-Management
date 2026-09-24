namespace demo_dotnet.backend.Services.Interfaces;

public interface IFileStorageService
{
    Task<long> WriteAsync(string key, Stream source, long maxBytes, CancellationToken cancellationToken);
    Stream OpenRead(string key);
    Task DeleteAsync(string key, CancellationToken cancellationToken);
    IEnumerable<string> GetKeysOlderThan(DateTime cutoff);
}
