using Google.Apis.Auth.OAuth2;
using Google.Cloud.Storage.V1;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace HireWise.Api.Services.Storage;

public class GoogleCloudStorageService : IStorageService
{
    private readonly IConfiguration _config;
    private readonly ILogger<GoogleCloudStorageService> _logger;
    private readonly string _bucketName;
    private readonly StorageClient _storageClient;

    public GoogleCloudStorageService(IConfiguration config, ILogger<GoogleCloudStorageService> logger)
    {
        _config = config;
        _logger = logger;

        _bucketName = _config["Storage:Gcp:BucketName"]
            ?? _config["GCP_STORAGE_BUCKET"]
            ?? _config["GOOGLE_CLOUD_STORAGE_BUCKET"]
            ?? "hirewise-resumes";

        _storageClient = InitializeStorageClient();
    }

    private StorageClient InitializeStorageClient()
    {
        try
        {
            var jsonKey = _config["Storage:Gcp:ServiceAccountJson"]
                ?? _config["GCP_STORAGE_SERVICE_ACCOUNT_JSON"]
                ?? _config["GOOGLE_STORAGE_SERVICE_ACCOUNT_JSON"];

#pragma warning disable CS0618
            if (!string.IsNullOrWhiteSpace(jsonKey) && jsonKey.Trim().StartsWith("{"))
            {
                _logger.LogInformation("Initializing Google Cloud Storage client with direct service account JSON.");
                var credential = GoogleCredential.FromJson(jsonKey);
                return StorageClient.Create(credential);
            }

            var keyPath = _config["Storage:Gcp:ServiceAccountKeyPath"]
                ?? _config["GCP_STORAGE_SERVICE_ACCOUNT_KEY_PATH"]
                ?? _config["GOOGLE_APPLICATION_CREDENTIALS"];

            if (!string.IsNullOrWhiteSpace(keyPath) && File.Exists(keyPath))
            {
                _logger.LogInformation("Initializing Google Cloud Storage client from key file: '{KeyPath}'.", keyPath);
                var credential = GoogleCredential.FromFile(keyPath);
                return StorageClient.Create(credential);
            }
#pragma warning restore CS0618

            _logger.LogInformation("Initializing Google Cloud Storage client using Google Application Default Credentials (ADC).");
            return StorageClient.Create();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize Google Cloud Storage client. Falling back to default client creation.");
            return StorageClient.Create();
        }
    }

    public async Task<UploadResult> UploadFileAsync(
        Stream stream,
        string fileName,
        string contentType,
        string folder = "resumes",
        CancellationToken ct = default)
    {
        try
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            var uniqueFileName = $"{Guid.NewGuid():N}_{Path.GetFileNameWithoutExtension(fileName)}{extension}";
            var objectName = string.IsNullOrWhiteSpace(folder)
                ? uniqueFileName
                : $"{folder.Trim('/')}/{uniqueFileName}";

            // Ensure stream is positioned at start
            if (stream.CanSeek && stream.Position != 0)
            {
                stream.Position = 0;
            }

            _logger.LogInformation("Uploading {FileName} ({ContentType}) to GCS bucket '{Bucket}' as '{ObjectName}'",
                fileName, contentType, _bucketName, objectName);

            var uploadedObject = await _storageClient.UploadObjectAsync(
                bucket: _bucketName,
                objectName: objectName,
                contentType: string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType,
                source: stream,
                options: null,
                cancellationToken: ct);

            // Publicly accessible URL or GCS URI
            var publicUrl = $"https://storage.googleapis.com/{_bucketName}/{objectName}";

            _logger.LogInformation("File uploaded to GCS successfully. URL: {Url}", publicUrl);

            return new UploadResult
            {
                Success = true,
                FileUrl = publicUrl,
                FileName = fileName,
                ContentType = contentType,
                FileSize = uploadedObject.Size.HasValue ? (long)uploadedObject.Size.Value : stream.Length
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload file {FileName} to GCS bucket '{Bucket}'", fileName, _bucketName);
            return new UploadResult
            {
                Success = false,
                Error = $"GCS upload error: {ex.Message}"
            };
        }
    }

    public async Task<(Stream Stream, string ContentType, string FileName)?> DownloadFileAsync(
        string fileUrl,
        CancellationToken ct = default)
    {
        try
        {
            var objectName = ExtractObjectName(fileUrl);
            if (string.IsNullOrWhiteSpace(objectName))
            {
                _logger.LogWarning("Invalid GCS file URL: {FileUrl}", fileUrl);
                return null;
            }

            _logger.LogInformation("Downloading object '{ObjectName}' from GCS bucket '{Bucket}'", objectName, _bucketName);

            var memoryStream = new MemoryStream();
            var gcsObject = await _storageClient.GetObjectAsync(_bucketName, objectName, null, ct);
            await _storageClient.DownloadObjectAsync(gcsObject, memoryStream, null, ct);

            memoryStream.Position = 0;
            var contentType = gcsObject.ContentType ?? "application/octet-stream";
            var fileName = Path.GetFileName(objectName);

            return (memoryStream, contentType, fileName);
        }
        catch (Google.GoogleApiException gEx) when (gEx.HttpStatusCode == System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("File not found in GCS: {FileUrl}", fileUrl);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to download file from GCS: {FileUrl}", fileUrl);
            return null;
        }
    }

    public async Task<bool> DeleteFileAsync(string fileUrl, CancellationToken ct = default)
    {
        try
        {
            var objectName = ExtractObjectName(fileUrl);
            if (string.IsNullOrWhiteSpace(objectName))
            {
                return false;
            }

            _logger.LogInformation("Deleting object '{ObjectName}' from GCS bucket '{Bucket}'", objectName, _bucketName);
            await _storageClient.DeleteObjectAsync(_bucketName, objectName, null, ct);
            return true;
        }
        catch (Google.GoogleApiException gEx) when (gEx.HttpStatusCode == System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("Object already deleted or not found in GCS: {FileUrl}", fileUrl);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete file from GCS: {FileUrl}", fileUrl);
            return false;
        }
    }

    private string ExtractObjectName(string fileUrl)
    {
        if (string.IsNullOrWhiteSpace(fileUrl)) return string.Empty;

        // Pattern 1: https://storage.googleapis.com/{bucket}/{objectName}
        var gcsPrefix = $"https://storage.googleapis.com/{_bucketName}/";
        if (fileUrl.StartsWith(gcsPrefix, StringComparison.OrdinalIgnoreCase))
        {
            return fileUrl.Substring(gcsPrefix.Length);
        }

        // Pattern 2: gs://{bucket}/{objectName}
        var gsUriPrefix = $"gs://{_bucketName}/";
        if (fileUrl.StartsWith(gsUriPrefix, StringComparison.OrdinalIgnoreCase))
        {
            return fileUrl.Substring(gsUriPrefix.Length);
        }

        // Pattern 3: relative path e.g. "resumes/xyz.pdf" or "/uploads/resumes/xyz.pdf"
        var cleanPath = fileUrl.TrimStart('/');
        if (cleanPath.StartsWith("uploads/", StringComparison.OrdinalIgnoreCase))
        {
            cleanPath = cleanPath.Substring("uploads/".Length);
        }

        return cleanPath;
    }
}
