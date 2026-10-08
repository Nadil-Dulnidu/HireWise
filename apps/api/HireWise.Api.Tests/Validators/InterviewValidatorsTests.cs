using FluentAssertions;
using HireWise.Api.DTOs.Interviews;
using HireWise.Api.Models.Enums;
using HireWise.Api.Validators.Interviews;

namespace HireWise.Api.Tests.Validators;

public class InterviewValidatorsTests
{
    private readonly CreateInterviewRequestValidator _createValidator = new();
    private readonly UpdateInterviewRequestValidator _updateValidator = new();
    private readonly SubmitFeedbackRequestValidator _feedbackValidator = new();

    [Fact]
    public void CreateInterviewRequest_WithValidData_ShouldPassValidation()
    {
        // Arrange
        var startTime = DateTime.UtcNow.AddDays(2);
        var request = new CreateInterviewRequest
        {
            ApplicationId = Guid.NewGuid(),
            InterviewerId = Guid.NewGuid(),
            ScheduledStartTime = startTime,
            ScheduledEndTime = startTime.AddHours(1),
            MeetingLink = "https://meet.google.com/abc-defg-hij",
            Notes = "First round technical interview"
        };

        // Act
        var result = _createValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CreateInterviewRequest_EndTimeBeforeStartTime_ShouldFailValidation()
    {
        // Arrange
        var startTime = DateTime.UtcNow.AddDays(2);
        var request = new CreateInterviewRequest
        {
            ApplicationId = Guid.NewGuid(),
            InterviewerId = Guid.NewGuid(),
            ScheduledStartTime = startTime,
            ScheduledEndTime = startTime.AddHours(-1)
        };

        // Act
        var result = _createValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateInterviewRequest.ScheduledEndTime));
    }

    [Fact]
    public void CreateInterviewRequest_InvalidMeetingUrl_ShouldFailValidation()
    {
        // Arrange
        var startTime = DateTime.UtcNow.AddDays(2);
        var request = new CreateInterviewRequest
        {
            ApplicationId = Guid.NewGuid(),
            InterviewerId = Guid.NewGuid(),
            ScheduledStartTime = startTime,
            ScheduledEndTime = startTime.AddHours(1),
            MeetingLink = "invalid-url-not-http"
        };

        // Act
        var result = _createValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateInterviewRequest.MeetingLink));
    }

    [Fact]
    public void SubmitFeedbackRequest_WithValidRatings_ShouldPassValidation()
    {
        // Arrange
        var request = new SubmitFeedbackRequest
        {
            TechnicalSkillsRating = 4,
            ProblemSolvingRating = 5,
            CommunicationRating = 4,
            CulturalFitRating = 5,
            Recommendation = RecommendationType.STRONG_HIRE,
            Notes = "Excellent candidate with deep system design understanding.",
            Strengths = "Clear communication, clean code structure.",
            Weaknesses = "Minor gaps in cloud deployment configurations."
        };

        // Act
        var result = _feedbackValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    public void SubmitFeedbackRequest_InvalidRatingOutOfRange_ShouldFailValidation(int rating)
    {
        // Arrange
        var request = new SubmitFeedbackRequest
        {
            TechnicalSkillsRating = rating,
            ProblemSolvingRating = 3,
            CommunicationRating = 3,
            CulturalFitRating = 3,
            Recommendation = RecommendationType.HIRE
        };

        // Act
        var result = _feedbackValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(SubmitFeedbackRequest.TechnicalSkillsRating));
    }

    [Fact]
    public void SubmitFeedbackRequest_InvalidRecommendationEnum_ShouldFailValidation()
    {
        // Arrange
        var request = new SubmitFeedbackRequest
        {
            TechnicalSkillsRating = 3,
            ProblemSolvingRating = 3,
            CommunicationRating = 3,
            CulturalFitRating = 3,
            Recommendation = (RecommendationType)999
        };

        // Act
        var result = _feedbackValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(SubmitFeedbackRequest.Recommendation));
    }
}
