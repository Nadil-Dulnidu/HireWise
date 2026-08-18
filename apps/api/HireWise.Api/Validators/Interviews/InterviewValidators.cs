using FluentValidation;
using HireWise.Api.DTOs.Interviews;

namespace HireWise.Api.Validators.Interviews;

public class CreateInterviewRequestValidator : AbstractValidator<CreateInterviewRequest>
{
    public CreateInterviewRequestValidator()
    {
        RuleFor(x => x.ApplicationId)
            .NotEmpty().WithMessage("Application ID is required.");

        RuleFor(x => x.InterviewerId)
            .NotEmpty().WithMessage("Interviewer ID is required.");

        RuleFor(x => x.ScheduledStartTime)
            .NotEmpty().WithMessage("Scheduled start time is required.");

        RuleFor(x => x.ScheduledEndTime)
            .NotEmpty().WithMessage("Scheduled end time is required.")
            .GreaterThan(x => x.ScheduledStartTime)
            .WithMessage("Scheduled end time must be after the start time.");

        RuleFor(x => x.MeetingLink)
            .Must(uri => string.IsNullOrEmpty(uri) || Uri.TryCreate(uri, UriKind.Absolute, out _))
            .WithMessage("Meeting link must be a valid URL.")
            .When(x => !string.IsNullOrEmpty(x.MeetingLink));

        RuleFor(x => x.Notes)
            .MaximumLength(2000).WithMessage("Notes cannot exceed 2000 characters.")
            .When(x => !string.IsNullOrEmpty(x.Notes));
    }
}

public class UpdateInterviewRequestValidator : AbstractValidator<UpdateInterviewRequest>
{
    public UpdateInterviewRequestValidator()
    {
        RuleFor(x => x.ScheduledEndTime)
            .GreaterThan(x => x.ScheduledStartTime!.Value)
            .WithMessage("Scheduled end time must be after the start time.")
            .When(x => x.ScheduledStartTime.HasValue && x.ScheduledEndTime.HasValue);

        RuleFor(x => x.MeetingLink)
            .Must(uri => string.IsNullOrEmpty(uri) || Uri.TryCreate(uri, UriKind.Absolute, out _))
            .WithMessage("Meeting link must be a valid URL.")
            .When(x => !string.IsNullOrEmpty(x.MeetingLink));

        RuleFor(x => x.Notes)
            .MaximumLength(2000).WithMessage("Notes cannot exceed 2000 characters.")
            .When(x => !string.IsNullOrEmpty(x.Notes));
    }
}

public class SubmitFeedbackRequestValidator : AbstractValidator<SubmitFeedbackRequest>
{
    public SubmitFeedbackRequestValidator()
    {
        RuleFor(x => x.TechnicalSkillsRating)
            .InclusiveBetween(1, 5).WithMessage("Technical skills rating must be between 1 and 5.");

        RuleFor(x => x.ProblemSolvingRating)
            .InclusiveBetween(1, 5).WithMessage("Problem solving rating must be between 1 and 5.");

        RuleFor(x => x.CommunicationRating)
            .InclusiveBetween(1, 5).WithMessage("Communication rating must be between 1 and 5.");

        RuleFor(x => x.CulturalFitRating)
            .InclusiveBetween(1, 5).WithMessage("Cultural fit rating must be between 1 and 5.");

        RuleFor(x => x.Recommendation)
            .IsInEnum().WithMessage("A valid recommendation type must be selected.");

        RuleFor(x => x.Notes)
            .MaximumLength(4000).WithMessage("Notes cannot exceed 4000 characters.")
            .When(x => !string.IsNullOrEmpty(x.Notes));

        RuleFor(x => x.Strengths)
            .MaximumLength(2000).WithMessage("Strengths cannot exceed 2000 characters.")
            .When(x => !string.IsNullOrEmpty(x.Strengths));

        RuleFor(x => x.Weaknesses)
            .MaximumLength(2000).WithMessage("Weaknesses cannot exceed 2000 characters.")
            .When(x => !string.IsNullOrEmpty(x.Weaknesses));
    }
}
