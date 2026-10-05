namespace HireWise.Api.DTOs.Resumes;

public class ResumeDto
{
    public Guid Id { get; set; }
    public Guid CandidateId { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public DateTime UploadedAt { get; set; }
    public bool IsActive { get; set; }
}

public class UploadResumeResponse
{
    public Guid Id { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string Message { get; set; } = "Resume uploaded successfully";
}
