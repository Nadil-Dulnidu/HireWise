using AutoMapper;
using HireWise.Api.Data;
using HireWise.Api.DTOs.Common;
using HireWise.Api.DTOs.Resumes;
using HireWise.Api.Models;
using HireWise.Api.Services.Storage;
using Microsoft.EntityFrameworkCore;

namespace HireWise.Api.Services;

public interface IResumeService
{
    Task<Result<UploadResumeResponse>> UploadResumeAsync(Guid candidateId, IFormFile file, CancellationToken ct = default);
    Task<Result<ResumeDto>> GetActiveResumeAsync(Guid candidateId, CancellationToken ct = default);
    Task<Result<ResumeDto>> GetResumeByIdAsync(Guid id, Guid currentUserId, string role, CancellationToken ct = default);
    Task<(Stream Stream, string ContentType, string FileName)?> DownloadResumeAsync(Guid id, Guid currentUserId, string role, CancellationToken ct = default);
    Task<Result<bool>> DeleteResumeAsync(Guid id, Guid candidateId, CancellationToken ct = default);
}

public class ResumeService : IResumeService
{
    private readonly ApplicationDbContext _db;
    private readonly IStorageService _storageService;
    private readonly IMapper _mapper;
    private readonly ILogger<ResumeService> _logger;

    private static readonly string[] AllowedExtensions = { ".pdf", ".docx", ".doc" };
    private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

    public ResumeService(
        ApplicationDbContext db,
        IStorageService storageService,
        IMapper mapper,
        ILogger<ResumeService> logger)
    {
        _db = db;
        _storageService = storageService;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<Result<UploadResumeResponse>> UploadResumeAsync(Guid candidateId, IFormFile file, CancellationToken ct = default)
    {
        if (file == null || file.Length == 0)
        {
            return Result<UploadResumeResponse>.Failure("Please select a valid resume file.");
        }

        if (file.Length > MaxFileSizeBytes)
        {
            return Result<UploadResumeResponse>.Failure("Resume file size exceeds the 5MB limit.");
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
        {
            return Result<UploadResumeResponse>.Failure("Invalid file type. Only PDF and Word documents (.pdf, .docx, .doc) are permitted.");
        }

        // Verify Candidate exists
        var candidate = await _db.Users.FirstOrDefaultAsync(u => u.Id == candidateId, ct);
        if (candidate == null)
        {
            return Result<UploadResumeResponse>.NotFound("Candidate profile not found.");
        }

        // Upload to storage
        using var stream = file.OpenReadStream();
        var uploadResult = await _storageService.UploadFileAsync(stream, file.FileName, file.ContentType, "resumes", ct);

        if (!uploadResult.Success)
        {
            return Result<UploadResumeResponse>.Failure(uploadResult.Error ?? "Failed to save uploaded resume.");
        }

        // Deactivate previous resumes
        var existingResumes = await _db.Resumes.Where(r => r.CandidateId == candidateId && r.IsActive).ToListAsync(ct);
        foreach (var r in existingResumes)
        {
            r.IsActive = false;
        }

        // Create new active resume record
        var resume = new Resume
        {
            CandidateId = candidateId,
            FileUrl = uploadResult.FileUrl,
            FileName = file.FileName,
            FileType = file.ContentType,
            FileSize = file.Length,
            UploadedAt = DateTime.UtcNow,
            IsActive = true
        };

        _db.Resumes.Add(resume);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("New active resume {ResumeId} uploaded for Candidate {CandidateId}", resume.Id, candidateId);

        return Result<UploadResumeResponse>.Success(new UploadResumeResponse
        {
            Id = resume.Id,
            FileUrl = resume.FileUrl,
            FileName = resume.FileName,
            FileSize = resume.FileSize,
            Message = "Resume uploaded and set as active successfully."
        });
    }

    public async Task<Result<ResumeDto>> GetActiveResumeAsync(Guid candidateId, CancellationToken ct = default)
    {
        var resume = await _db.Resumes
            .Where(r => r.CandidateId == candidateId && r.IsActive)
            .OrderByDescending(r => r.UploadedAt)
            .FirstOrDefaultAsync(ct);

        if (resume == null)
        {
            return Result<ResumeDto>.NotFound("No active resume found for this candidate.");
        }

        return Result<ResumeDto>.Success(_mapper.Map<ResumeDto>(resume));
    }

    public async Task<Result<ResumeDto>> GetResumeByIdAsync(Guid id, Guid currentUserId, string role, CancellationToken ct = default)
    {
        var resume = await _db.Resumes.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (resume == null)
        {
            return Result<ResumeDto>.NotFound("Resume not found.");
        }

        // Candidates can only view their own resume
        if (role == "CANDIDATE" && resume.CandidateId != currentUserId)
        {
            return Result<ResumeDto>.Forbidden("You do not have permission to view this resume.");
        }

        return Result<ResumeDto>.Success(_mapper.Map<ResumeDto>(resume));
    }

    public async Task<(Stream Stream, string ContentType, string FileName)?> DownloadResumeAsync(Guid id, Guid currentUserId, string role, CancellationToken ct = default)
    {
        var resume = await _db.Resumes.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (resume == null) return null;

        if (role == "CANDIDATE" && resume.CandidateId != currentUserId) return null;

        return await _storageService.DownloadFileAsync(resume.FileUrl, ct);
    }

    public async Task<Result<bool>> DeleteResumeAsync(Guid id, Guid candidateId, CancellationToken ct = default)
    {
        var resume = await _db.Resumes.FirstOrDefaultAsync(r => r.Id == id && r.CandidateId == candidateId, ct);
        if (resume == null)
        {
            return Result<bool>.NotFound("Resume not found.");
        }

        resume.IsActive = false;
        resume.IsDeleted = true;
        resume.DeletedAt = DateTime.UtcNow;

        await _storageService.DeleteFileAsync(resume.FileUrl, ct);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Deleted resume {ResumeId} for candidate {CandidateId}", id, candidateId);
        return Result<bool>.Success(true);
    }
}
