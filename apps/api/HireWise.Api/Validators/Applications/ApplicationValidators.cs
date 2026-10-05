using FluentValidation;
using HireWise.Api.DTOs.Applications;

namespace HireWise.Api.Validators.Applications;

public class ApplyJobRequestValidator : AbstractValidator<ApplyJobRequest>
{
    public ApplyJobRequestValidator()
    {
        RuleFor(x => x.CoverLetter)
            .MaximumLength(3000).WithMessage("Cover letter cannot exceed 3000 characters.")
            .When(x => !string.IsNullOrEmpty(x.CoverLetter));
    }
}

public class ChangeApplicationStatusRequestValidator : AbstractValidator<ChangeApplicationStatusRequest>
{
    public ChangeApplicationStatusRequestValidator()
    {
        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("A valid application status must be provided.");

        RuleFor(x => x.Notes)
            .MaximumLength(1000).WithMessage("Status update notes cannot exceed 1000 characters.")
            .When(x => !string.IsNullOrEmpty(x.Notes));
    }
}
