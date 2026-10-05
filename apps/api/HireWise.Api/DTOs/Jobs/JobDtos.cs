using HireWise.Api.DTOs.Common;
using HireWise.Api.Models.Enums;

namespace HireWise.Api.DTOs.Jobs;

// Data Transfer Object used to return complete job information.
public class JobDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Requirements { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public EmploymentType EmploymentType { get; set; }
    public ExperienceLevel ExperienceLevel { get; set; }
    public decimal? SalaryMin { get; set; }
    public decimal? SalaryMax { get; set; }
    public string SalaryCurrency { get; set; } = "USD";
    public JobStatus Status { get; set; }
    public Guid CompanyId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string? CompanyLogoUrl { get; set; }
    public string? CompanyLocation { get; set; }
    public Guid? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string? CreatedByName { get; set; }
    public DateTime? ApplicationDeadline { get; set; }
    public int ApplicationCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// Lightweight DTO containing the main information needed to display a job in lists or search results.
public class JobSummaryDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public EmploymentType EmploymentType { get; set; }
    public ExperienceLevel ExperienceLevel { get; set; }
    public decimal? SalaryMin { get; set; }
    public decimal? SalaryMax { get; set; }
    public string SalaryCurrency { get; set; } = "USD";
    public JobStatus Status { get; set; }
    public Guid CompanyId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string? CompanyLogoUrl { get; set; }
    public string? DepartmentName { get; set; }
    public DateTime? ApplicationDeadline { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Request DTO used when creating a new job.
// Contains the information required from the client.
public class CreateJobRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Requirements { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public EmploymentType EmploymentType { get; set; } = EmploymentType.FULL_TIME;
    public ExperienceLevel ExperienceLevel { get; set; } = ExperienceLevel.MID;
    public decimal? SalaryMin { get; set; }
    public decimal? SalaryMax { get; set; }
    public string SalaryCurrency { get; set; } = "USD";
    public JobStatus Status { get; set; } = JobStatus.DRAFT;
    public Guid? CompanyId { get; set; }
    public Guid? DepartmentId { get; set; }
    public DateTime? ApplicationDeadline { get; set; }
}

// Request DTO used to update an existing job.
public class UpdateJobRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Requirements { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public EmploymentType EmploymentType { get; set; }
    public ExperienceLevel ExperienceLevel { get; set; }
    public decimal? SalaryMin { get; set; }
    public decimal? SalaryMax { get; set; }
    public string SalaryCurrency { get; set; } = "USD";
    public Guid? DepartmentId { get; set; }
    public DateTime? ApplicationDeadline { get; set; }
}

// Request DTO used to update only the status of a job.
public class UpdateJobStatusRequest
{
    public JobStatus Status { get; set; }
}

// Request DTO used to filter and paginate job listings.
// Inherits pagination properties from PagedRequest.
public class JobFilterRequest : PagedRequest
{
    public JobStatus? Status { get; set; }
    public EmploymentType? EmploymentType { get; set; }
    public ExperienceLevel? ExperienceLevel { get; set; }
    public Guid? CompanyId { get; set; }
    public Guid? DepartmentId { get; set; }
    public decimal? MinSalary { get; set; }
    public decimal? MaxSalary { get; set; }
}
