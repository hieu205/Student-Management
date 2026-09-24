using System.Net;
using demo_dotnet.backend.exception;
using demo_dotnet.backend.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace demo_dotnet.backend.Services;

public sealed class LocalFileStorageService : IFileStorageService
{
    private readonly string _root;

    public LocalFileStorageService(IWebHostEnvironment environment, IOptions<ChatAttachmentOptions> options)
    {
        _root = Path.GetFullPath(options.Value.StoragePath, environment.ContentRootPath);
        var webRoot = Path.GetFullPath(environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot"));
        if (_root.Equals(webRoot, StringComparison.OrdinalIgnoreCase) ||
            _root.StartsWith(webRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Chat storage must be outside wwwroot.");
        Directory.CreateDirectory(_root);
    }

    private string GetPath(string key)
    {
        if (!Guid.TryParseExact(key, "N", out _)) throw new ArgumentException("Invalid storage key.");
        return Path.Combine(_root, key);
    }

    public async Task<long> WriteAsync(string key, Stream source, long maxBytes, CancellationToken cancellationToken)
    {
        // CreateNew never replaces an existing attachment. The caller owns compensation on failure.
        await using var destination = new FileStream(GetPath(key), FileMode.CreateNew, FileAccess.Write,
            FileShare.None, 81920, FileOptions.Asynchronous);
        var buffer = new byte[81920];
        long total = 0;
        int read;
        while ((read = await source.ReadAsync(buffer, cancellationToken)) > 0)
        {
            total += read;
            if (total > maxBytes) throw new AppException("Tệp vượt quá dung lượng cho phép.", HttpStatusCode.RequestEntityTooLarge);
            await destination.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
        }
        if (total == 0) throw new BadRequestException("Không chấp nhận tệp rỗng.");
        return total;
    }

    public Stream OpenRead(string key) => new FileStream(GetPath(key), FileMode.Open, FileAccess.Read,
        FileShare.Read | FileShare.Delete, 81920, FileOptions.Asynchronous | FileOptions.SequentialScan);

    public Task DeleteAsync(string key, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        File.Delete(GetPath(key));
        return Task.CompletedTask;
    }

    public IEnumerable<string> GetKeysOlderThan(DateTime cutoff) => Directory.EnumerateFiles(_root)
        .Where(path => File.GetLastWriteTimeUtc(path) < cutoff)
        .Select(Path.GetFileName).OfType<string>().Where(key => Guid.TryParseExact(key, "N", out _));
}
