namespace HireWise.Api.Services.Storage;

// Result model returned after a file upload operation
public class UploadResult
{
    public bool Success { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string? Error { get; set; }
}

// Interface defining file storage operations for uploads and downloads
public interface IStorageService
{
    Task<UploadResult> UploadFileAsync(Stream stream, string fileName, string contentType, string folder = "resumes", CancellationToken ct = default);
    Task<(Stream Stream, string ContentType, string FileName)?> DownloadFileAsync(string fileUrl, CancellationToken ct = default);
    Task<bool> DeleteFileAsync(string fileUrl, CancellationToken ct = default);
}

// Local filesystem implementation of storage service for development
public class LocalStorageService : IStorageService
{
    private readonly IWebHostEnvironment _env;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<LocalStorageService> _logger;

    public LocalStorageService(IWebHostEnvironment env, IHttpContextAccessor httpContextAccessor, ILogger<LocalStorageService> logger)
    {
        _env = env;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    // Save file stream to local uploads folder on the server
    public async Task<UploadResult> UploadFileAsync(Stream stream, string fileName, string contentType, string folder = "resumes", CancellationToken ct = default)
    {
        try
        {
            var uploadsRoot = Path.Combine(_env.ContentRootPath, "uploads", folder);
            if (!Directory.Exists(uploadsRoot))
            {
                Directory.CreateDirectory(uploadsRoot);
            }

            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            var uniqueFileName = $"{Guid.NewGuid():N}_{Path.GetFileNameWithoutExtension(fileName)}{extension}";
            var filePath = Path.Combine(uploadsRoot, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None, 4096, true))
            {
                await stream.CopyToAsync(fileStream, ct);
            }

            var request = _httpContextAccessor.HttpContext?.Request;
            var baseUrl = request != null ? $"{request.Scheme}://{request.Host}" : "http://localhost:5101";
            var relativeUrl = $"/uploads/{folder}/{uniqueFileName}";
            var fullUrl = $"{baseUrl}{relativeUrl}";

            _logger.LogInformation("File uploaded successfully to {FilePath}, Public URL: {Url}", filePath, fullUrl);

            return new UploadResult
            {
                Success = true,
                FileUrl = relativeUrl,
                FileName = fileName,
                ContentType = contentType,
                FileSize = stream.Length
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload file {FileName}", fileName);
            return new UploadResult
            {
                Success = false,
                Error = ex.Message
            };
        }
    }

    // Read and return a stored file stream from local disk
    public Task<(Stream Stream, string ContentType, string FileName)?> DownloadFileAsync(string fileUrl, CancellationToken ct = default)
    {
        try
        {
            var cleanUrl = fileUrl.TrimStart('/');
            var filePath = Path.Combine(_env.ContentRootPath, cleanUrl.Replace('/', Path.DirectorySeparatorChar));

            if (!File.Exists(filePath))
            {
                _logger.LogWarning("File not found at {FilePath}", filePath);
                return Task.FromResult<(Stream Stream, string ContentType, string FileName)?>(null);
            }

            var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
            var extension = Path.GetExtension(filePath).ToLowerInvariant();
            var contentType = extension switch
            {
                ".pdf" => "application/pdf",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".doc" => "application/msword",
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                _ => "application/octet-stream"
            };

            return Task.FromResult<(Stream Stream, string ContentType, string FileName)?>((stream, contentType, Path.GetFileName(filePath)));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to download file from {FileUrl}", fileUrl);
            return Task.FromResult<(Stream Stream, string ContentType, string FileName)?>(null);
        }
    }

    // Delete a stored file from local disk
    public Task<bool> DeleteFileAsync(string fileUrl, CancellationToken ct = default)
    {
        try
        {
            var cleanUrl = fileUrl.TrimStart('/');
            var filePath = Path.Combine(_env.ContentRootPath, cleanUrl.Replace('/', Path.DirectorySeparatorChar));

            if (File.Exists(filePath))
            {
                File.Delete(filePath);
                _logger.LogInformation("Deleted file at {FilePath}", filePath);
            }

            return Task.FromResult(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete file {FileUrl}", fileUrl);
            return Task.FromResult(false);
        }
    }
}
