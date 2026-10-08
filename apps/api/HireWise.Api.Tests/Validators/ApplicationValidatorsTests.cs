using FluentAssertions;
using HireWise.Api.DTOs.Applications;
using HireWise.Api.Models.Enums;
using HireWise.Api.Validators.Applications;

namespace HireWise.Api.Tests.Validators;

public class ApplicationValidatorsTests
{
    private readonly ApplyJobRequestValidator _applyValidator = new();
    private readonly ChangeApplicationStatusRequestValidator _changeStatusValidator = new();

    [Fact]
    public void ApplyJobRequest_WithNullOrEmptyCoverLetter_ShouldPassValidation()
    {
        // Arrange
        var request = new ApplyJobRequest { CoverLetter = null };

        // Act
        var result = _applyValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void ApplyJobRequest_WithValidCoverLetter_ShouldPassValidation()
    {
        // Arrange
        var request = new ApplyJobRequest
        {
            CoverLetter = "I am excited to apply for this role. I have extensive experience building scalable cloud microservices."
        };

        // Act
        var result = _applyValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void ApplyJobRequest_WithExcessiveLength_ShouldFailValidation()
    {
        // Arrange
        var request = new ApplyJobRequest
        {
            CoverLetter = new string('A', 3001)
        };

        // Act
        var result = _applyValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(ApplyJobRequest.CoverLetter));
    }

    [Fact]
    public void ChangeApplicationStatusRequest_WithValidStatusAndNotes_ShouldPassValidation()
    {
        // Arrange
        var request = new ChangeApplicationStatusRequest
        {
            Status = ApplicationStatus.INTERVIEW_APPROVED,
            Notes = "Candidate showed strong foundational knowledge."
        };

        // Act
        var result = _changeStatusValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void ChangeApplicationStatusRequest_WithInvalidStatusEnum_ShouldFailValidation()
    {
        // Arrange
        var request = new ChangeApplicationStatusRequest
        {
            Status = (ApplicationStatus)999
        };

        // Act
        var result = _changeStatusValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(ChangeApplicationStatusRequest.Status));
    }

    [Fact]
    public void ChangeApplicationStatusRequest_WithExcessiveNotes_ShouldFailValidation()
    {
        // Arrange
        var request = new ChangeApplicationStatusRequest
        {
            Status = ApplicationStatus.REJECTED,
            Notes = new string('B', 1001)
        };

        // Act
        var result = _changeStatusValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(ChangeApplicationStatusRequest.Notes));
    }
}
