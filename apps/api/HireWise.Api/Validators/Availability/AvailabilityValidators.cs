using FluentValidation;
using HireWise.Api.DTOs.Availability;

namespace HireWise.Api.Validators.Availability;

public class CreateAvailabilitySlotRequestValidator : AbstractValidator<CreateAvailabilitySlotRequest>
{
    public CreateAvailabilitySlotRequestValidator()
    {
        RuleFor(x => x.DayOfWeek)
            .IsInEnum().WithMessage("A valid day of week must be provided.");

        RuleFor(x => x.EndTime)
            .GreaterThan(x => x.StartTime)
            .WithMessage("End time must be after start time.");

        RuleFor(x => x.Timezone)
            .NotEmpty().WithMessage("Timezone is required.")
            .MaximumLength(100).WithMessage("Timezone identifier cannot exceed 100 characters.");
    }
}

public class UpdateAvailabilitySlotRequestValidator : AbstractValidator<UpdateAvailabilitySlotRequest>
{
    public UpdateAvailabilitySlotRequestValidator()
    {
        RuleFor(x => x.DayOfWeek)
            .IsInEnum().WithMessage("A valid day of week must be provided.")
            .When(x => x.DayOfWeek.HasValue);

        RuleFor(x => x.EndTime)
            .GreaterThan(x => x.StartTime!.Value)
            .WithMessage("End time must be after start time.")
            .When(x => x.StartTime.HasValue && x.EndTime.HasValue);

        RuleFor(x => x.Timezone)
            .NotEmpty().WithMessage("Timezone cannot be empty.")
            .MaximumLength(100).WithMessage("Timezone identifier cannot exceed 100 characters.")
            .When(x => !string.IsNullOrEmpty(x.Timezone));
    }
}

public class BulkCreateAvailabilityRequestValidator : AbstractValidator<BulkCreateAvailabilityRequest>
{
    public BulkCreateAvailabilityRequestValidator()
    {
        RuleFor(x => x.Slots)
            .NotEmpty().WithMessage("At least one availability slot must be provided.");

        RuleForEach(x => x.Slots).SetValidator(new CreateAvailabilitySlotRequestValidator());
    }
}
