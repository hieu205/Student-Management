using System.IO.Compression;
using System.Net;
using System.Text;
using System.Xml;
using System.Xml.Linq;
using demo_dotnet.backend.exception;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats;

namespace demo_dotnet.backend.Services;

public static class ChatFileValidator
{
    public static string CleanFileName(string name)
    {
        name = name.Replace('\\', '/').Split('/').Last();
        name = new string(name.Where(c => !char.IsControl(c) && !"<>:\"|?*".Contains(c)).ToArray()).Trim().Trim('.');
        if (string.IsNullOrWhiteSpace(name) || name.Length > 255)
            throw new BadRequestException("Tên tệp không hợp lệ hoặc dài quá 255 ký tự.");
        return name;
    }

    public static async Task<(string ContentType, string Kind)> ValidateAsync(Stream stream, string name,
        ChatAttachmentOptions options, CancellationToken cancellationToken)
    {
        var extension = Path.GetExtension(name).ToLowerInvariant();
        try
        {
            if (extension is ".jpg" or ".jpeg" or ".png" or ".webp")
            {
                var decoder = new DecoderOptions { MaxFrames = 1, SkipMetadata = true };
                var info = await Image.IdentifyAsync(decoder, stream, cancellationToken);
                var expected = extension is ".jpg" or ".jpeg" ? "JPEG" : extension[1..].ToUpperInvariant();
                if (info.Metadata.DecodedImageFormat?.Name.ToUpperInvariant() != expected ||
                    (long)info.Width * info.Height > options.MaxImagePixels) throw InvalidFile();
                stream.Position = 0;
                using var decoded = await Image.LoadAsync(decoder, stream, cancellationToken);
                return (expected == "JPEG" ? "image/jpeg" : "image/" + expected.ToLowerInvariant(), "Image");
            }
            if (extension == ".txt")
            {
                using var reader = new StreamReader(stream, new UTF8Encoding(false, true), false, 4096, true);
                var buffer = new char[4096];
                int count;
                while ((count = await reader.ReadAsync(buffer.AsMemory(), cancellationToken)) > 0)
                    for (var i = 0; i < count; i++)
                        if (char.IsControl(buffer[i]) && buffer[i] is not ('\r' or '\n' or '\t')) throw InvalidFile();
                return ("text/plain; charset=utf-8", "File");
            }
            if (extension == ".pdf")
            {
                var header = new byte[5];
                await stream.ReadExactlyAsync(header, cancellationToken);
                if (!header.AsSpan().SequenceEqual("%PDF-"u8)) throw InvalidFile();
                stream.Position = Math.Max(0, stream.Length - 1024);
                using var reader = new StreamReader(stream, Encoding.ASCII, false, 1024, true);
                if (!(await reader.ReadToEndAsync(cancellationToken)).Contains("%%EOF")) throw InvalidFile();
                return ("application/pdf", "File");
            }
            if (extension is ".docx" or ".xlsx")
            {
                using var archive = new ZipArchive(stream, ZipArchiveMode.Read, true);
                if (archive.Entries.Count > 2000 || archive.Entries.Sum(e => e.Length) > 100 * 1024 * 1024 ||
                    archive.Entries.Any(e => e.FullName.Contains("vbaProject", StringComparison.OrdinalIgnoreCase)) ||
                    archive.Entries.Select(e => e.FullName).Distinct().Count() != archive.Entries.Count) throw InvalidFile();
                var mainPath = extension == ".docx" ? "word/document.xml" : "xl/workbook.xml";
                var main = ReadXml(archive.GetEntry(mainPath));
                var types = ReadXml(archive.GetEntry("[Content_Types].xml"));
                XNamespace ns = "http://schemas.openxmlformats.org/package/2006/content-types";
                var mainType = extension == ".docx"
                    ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"
                    : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml";
                if (!types.Descendants(ns + "Override").Any(e => (string?)e.Attribute("PartName") == "/" + mainPath &&
                    (string?)e.Attribute("ContentType") == mainType) ||
                    main.Root?.Name.LocalName != (extension == ".docx" ? "document" : "workbook")) throw InvalidFile();
                return (extension == ".docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "File");
            }
            throw InvalidFile();
        }
        catch (Exception ex) when (ex is InvalidDataException or UnknownImageFormatException or InvalidImageContentException
            or DecoderFallbackException or XmlException or EndOfStreamException or NotSupportedException)
        {
            throw InvalidFile();
        }
    }

    private static XDocument ReadXml(ZipArchiveEntry? entry)
    {
        if (entry == null || entry.Length > 10 * 1024 * 1024) throw InvalidFile();
        using var stream = entry.Open();
        using var reader = XmlReader.Create(stream, new XmlReaderSettings
        {
            DtdProcessing = DtdProcessing.Prohibit, XmlResolver = null, MaxCharactersInDocument = 10 * 1024 * 1024
        });
        return XDocument.Load(reader);
    }

    private static AppException InvalidFile() => new("Định dạng hoặc nội dung tệp không hợp lệ/không được hỗ trợ.", HttpStatusCode.UnsupportedMediaType);
}
