using FluentValidation;
using HireWise.Api.DTOs.Jobs;

namespace HireWise.Api.Validators.Jobs;

// Validates data when creating a new job
public class CreateJobRequestValidator : AbstractValidator<CreateJobRequest>
{
    public CreateJobRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Job title is required.")
            .MaximumLength(200).WithMessage("Job title must not exceed 200 characters.");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Job description is required.")
            .MinimumLength(20).WithMessage("Job description must be at least 20 characters.");

        RuleFor(x => x.Requirements)
            .NotEmpty().WithMessage("Job requirements are required.");

        RuleFor(x => x.Location)
            .NotEmpty().WithMessage("Job location is required.")
            .MaximumLength(150).WithMessage("Location must not exceed 150 characters.");

        RuleFor(x => x.SalaryMin)
            .GreaterThanOrEqualTo(0).When(x => x.SalaryMin.HasValue)
            .WithMessage("Minimum salary must be non-negative.");

        RuleFor(x => x.SalaryMax)
            .GreaterThanOrEqualTo(x => x.SalaryMin ?? 0).When(x => x.SalaryMax.HasValue && x.SalaryMin.HasValue)
            .WithMessage("Maximum salary must be greater than or equal to minimum salary.");

        RuleFor(x => x.SalaryCurrency)
            .NotEmpty().WithMessage("Salary currency is required.")
            .Length(3).WithMessage("Salary currency must be a 3-letter ISO code (e.g. USD).");

        RuleFor(x => x.ApplicationDeadline)
            .GreaterThan(DateTime.UtcNow).When(x => x.ApplicationDeadline.HasValue)
            .WithMessage("Application deadline must be in the future.");
    }
}

// Validates data when updating an existing job
public class UpdateJobRequestValidator : AbstractValidator<UpdateJobRequest>
{
    public UpdateJobRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Job title is required.")
            .MaximumLength(200).WithMessage("Job title must not exceed 200 characters.");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Job description is required.")
            .MinimumLength(20).WithMessage("Job description must be at least 20 characters.");

        RuleFor(x => x.Requirements)
            .NotEmpty().WithMessage("Job requirements are required.");

        RuleFor(x => x.Location)
            .NotEmpty().WithMessage("Job location is required.")
            .MaximumLength(150).WithMessage("Location must not exceed 150 characters.");

        RuleFor(x => x.SalaryMin)
            .GreaterThanOrEqualTo(0).When(x => x.SalaryMin.HasValue)
            .WithMessage("Minimum salary must be non-negative.");

        RuleFor(x => x.SalaryMax)
            .GreaterThanOrEqualTo(x => x.SalaryMin ?? 0).When(x => x.SalaryMax.HasValue && x.SalaryMin.HasValue)
            .WithMessage("Maximum salary must be greater than or equal to minimum salary.");

        RuleFor(x => x.SalaryCurrency)
            .NotEmpty().WithMessage("Salary currency is required.")
            .Length(3).WithMessage("Salary currency must be a 3-letter ISO code (e.g. USD).");
    }
}

// Validates the status value when updating a job
public class UpdateJobStatusRequestValidator : AbstractValidator<UpdateJobStatusRequest>
{
    public UpdateJobStatusRequestValidator()
    {
        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Invalid job status value.");
    }
}
