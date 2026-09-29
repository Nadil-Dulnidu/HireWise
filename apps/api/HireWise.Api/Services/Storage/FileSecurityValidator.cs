using System.Text.RegularExpressions;

namespace HireWise.Api.Services.Storage;

public static class FileSecurityValidator
{
    // Allowed file magic byte signatures for PDF and Word documents
    private static readonly Dictionary<string, List<byte[]>> FileSignatures = new(StringComparer.OrdinalIgnoreCase)
    {
        { ".pdf", new List<byte[]> { new byte[] { 0x25, 0x50, 0x44, 0x46 } } }, // %PDF
        { ".docx", new List<byte[]> { new byte[] { 0x50, 0x4B, 0x03, 0x04 } } }, // PK.. (ZIP)
        { ".doc", new List<byte[]> { new byte[] { 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1 } } } // OLECF
    };

    // Allowed MIME types mapped by file extension
    private static readonly Dictionary<string, string[]> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        { ".pdf", new[] { "application/pdf" } },
        { ".docx", new[] { "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/zip", "application/x-zip-compressed" } },
        { ".doc", new[] { "application/msword", "application/vnd.ms-word", "application/x-msword" } }
    };

    /// <summary>
    /// Validates file header magic bytes, MIME type consistency, and file extension.
    /// </summary>
    public static (bool IsValid, string? ErrorMessage) ValidateResumeFile(Stream stream, string fileName, string contentType, long fileLength, long maxSizeBytes = 5 * 1024 * 1024)
    {
        if (stream == null || fileLength == 0)
        {
            return (false, "File is empty or corrupted.");
        }

        if (fileLength > maxSizeBytes)
        {
            return (false, $"File size exceeds the maximum permitted limit of {maxSizeBytes / (1024 * 1024)}MB.");
        }

        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(extension) || !FileSignatures.ContainsKey(extension))
        {
            return (false, "Invalid file format. Only PDF (.pdf) and Word documents (.docx, .doc) are permitted.");
        }

        // Validate MIME type
        if (!string.IsNullOrWhiteSpace(contentType))
        {
            if (AllowedMimeTypes.TryGetValue(extension, out var validMimes))
            {
                if (!validMimes.Any(m => string.Equals(m, contentType, StringComparison.OrdinalIgnoreCase)))
                {
                    return (false, $"Content-Type header '{contentType}' does not match the file extension '{extension}'.");
                }
            }
        }

        // Validate Magic Bytes (Header signatures)
        if (stream.CanSeek)
        {
            var originalPosition = stream.Position;
            stream.Position = 0;

            var signatures = FileSignatures[extension];
            var maxSigLength = signatures.Max(s => s.Length);
            var headerBytes = new byte[maxSigLength];
            var bytesRead = stream.Read(headerBytes, 0, maxSigLength);

            stream.Position = originalPosition;

            if (bytesRead < 4)
            {
                return (false, "Uploaded file header is too short or invalid.");
            }

            var hasValidSignature = signatures.Any(sig => headerBytes.Take(sig.Length).SequenceEqual(sig));
            if (!hasValidSignature)
            {
                return (false, $"File signature validation failed. The contents do not match a valid {extension.TrimStart('.').ToUpperInvariant()} document.");
            }
        }

        return (true, null);
    }

    /// <summary>
    /// Sanitizes uploaded filename to prevent directory traversal and injection attacks.
    /// </summary>
    public static string SanitizeFileName(string rawFileName)
    {
        if (string.IsNullOrWhiteSpace(rawFileName))
        {
            return $"document_{Guid.NewGuid():N}.pdf";
        }

        var nameOnly = Path.GetFileName(rawFileName);
        var extension = Path.GetExtension(nameOnly).ToLowerInvariant();
        var baseName = Path.GetFileNameWithoutExtension(nameOnly);

        // Remove any non-alphanumeric, space, dash, or underscore characters
        var cleanedBase = Regex.Replace(baseName, @"[^\w\s\-\.]", "_");
        cleanedBase = Regex.Replace(cleanedBase, @"\s+", "_").Trim('_');

        if (string.IsNullOrWhiteSpace(cleanedBase))
        {
            cleanedBase = "document_" + Guid.NewGuid().ToString("N")[..8];
        }

        return $"{cleanedBase}{extension}";
    }
}
