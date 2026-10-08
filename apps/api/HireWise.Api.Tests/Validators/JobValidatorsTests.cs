using FluentAssertions;
using HireWise.Api.DTOs.Jobs;
using HireWise.Api.Models.Enums;
using HireWise.Api.Validators.Jobs;

namespace HireWise.Api.Tests.Validators;

public class JobValidatorsTests
{
    private readonly CreateJobRequestValidator _createValidator = new();
    private readonly UpdateJobRequestValidator _updateValidator = new();
    private readonly UpdateJobStatusRequestValidator _statusValidator = new();

    [Fact]
    public void CreateJobRequest_WithValidData_ShouldPassValidation()
    {
        // Arrange
        var request = new CreateJobRequest
        {
            Title = "Senior Software Engineer",
            Description = "We are looking for an experienced engineer to join our cloud platform team.",
            Requirements = "5+ years of C#, .NET, and cloud architecture experience.",
            Location = "Colombo, Sri Lanka",
            SalaryMin = 2500,
            SalaryMax = 4000,
            SalaryCurrency = "USD",
            ApplicationDeadline = DateTime.UtcNow.AddDays(30)
        };

        // Act
        var result = _createValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeTrue();
        result.Errors.Should().BeEmpty();
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void CreateJobRequest_EmptyTitle_ShouldFailValidation(string? title)
    {
        // Arrange
        var request = new CreateJobRequest
        {
            Title = title!,
            Description = "Detailed description with more than 20 chars.",
            Requirements = "Experience needed",
            Location = "Remote",
            SalaryCurrency = "USD"
        };

        // Act
        var result = _createValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateJobRequest.Title));
    }

    [Fact]
    public void CreateJobRequest_ShortDescription_ShouldFailValidation()
    {
        // Arrange
        var request = new CreateJobRequest
        {
            Title = "Backend Engineer",
            Description = "Too short",
            Requirements = "Experience needed",
            Location = "Remote",
            SalaryCurrency = "USD"
        };

        // Act
        var result = _createValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateJobRequest.Description) && e.ErrorMessage.Contains("at least 20 characters"));
    }

    [Fact]
    public void CreateJobRequest_SalaryMaxLessThanSalaryMin_ShouldFailValidation()
    {
        // Arrange
        var request = new CreateJobRequest
        {
            Title = "Backend Engineer",
            Description = "A comprehensive job description for our cloud platform team.",
            Requirements = "C# and SQL",
            Location = "Remote",
            SalaryMin = 5000,
            SalaryMax = 4000,
            SalaryCurrency = "USD"
        };

        // Act
        var result = _createValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateJobRequest.SalaryMax));
    }

    [Theory]
    [InlineData("US")]
    [InlineData("USDT")]
    public void CreateJobRequest_InvalidCurrencyCodeLength_ShouldFailValidation(string currency)
    {
        // Arrange
        var request = new CreateJobRequest
        {
            Title = "Backend Engineer",
            Description = "A comprehensive job description for our cloud platform team.",
            Requirements = "C# and SQL",
            Location = "Remote",
            SalaryCurrency = currency
        };

        // Act
        var result = _createValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateJobRequest.SalaryCurrency));
    }

    [Fact]
    public void CreateJobRequest_PastDeadline_ShouldFailValidation()
    {
        // Arrange
        var request = new CreateJobRequest
        {
            Title = "Backend Engineer",
            Description = "A comprehensive job description for our cloud platform team.",
            Requirements = "C# and SQL",
            Location = "Remote",
            SalaryCurrency = "USD",
            ApplicationDeadline = DateTime.UtcNow.AddDays(-1)
        };

        // Act
        var result = _createValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateJobRequest.ApplicationDeadline));
    }

    [Fact]
    public void UpdateJobRequest_WithValidData_ShouldPassValidation()
    {
        // Arrange
        var request = new UpdateJobRequest
        {
            Title = "Lead Software Engineer",
            Description = "Updated job description with more than 20 characters.",
            Requirements = "7+ years experience in distributed systems.",
            Location = "Remote, Worldwide",
            SalaryMin = 5000,
            SalaryMax = 7000,
            SalaryCurrency = "EUR"
        };

        // Act
        var result = _updateValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void UpdateJobStatusRequest_ValidEnum_ShouldPassValidation()
    {
        // Arrange
        var request = new UpdateJobStatusRequest
        {
            Status = JobStatus.OPEN
        };

        // Act
        var result = _statusValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void UpdateJobStatusRequest_InvalidEnum_ShouldFailValidation()
    {
        // Arrange
        var request = new UpdateJobStatusRequest
        {
            Status = (JobStatus)999
        };

        // Act
        var result = _statusValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(UpdateJobStatusRequest.Status));
    }
}
