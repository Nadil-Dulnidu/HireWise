using FluentAssertions;
using HireWise.Api.DTOs.Companies;
using HireWise.Api.DTOs.Departments;
using HireWise.Api.Validators.Companies;
using HireWise.Api.Validators.Departments;

namespace HireWise.Api.Tests.Validators;

public class DepartmentAndCompanyValidatorsTests
{
    private readonly CreateDepartmentRequestValidator _createDeptValidator = new();
    private readonly UpdateDepartmentRequestValidator _updateDeptValidator = new();
    private readonly CreateCompanyRequestValidator _createCompanyValidator = new();
    private readonly UpdateCompanyRequestValidator _updateCompanyValidator = new();

    [Fact]
    public void CreateDepartmentRequest_ValidData_ShouldPassValidation()
    {
        // Arrange
        var request = new CreateDepartmentRequest
        {
            Name = "Engineering",
            Description = "Software development and infrastructure"
        };

        // Act
        var result = _createDeptValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void CreateDepartmentRequest_EmptyName_ShouldFailValidation(string? name)
    {
        // Arrange
        var request = new CreateDepartmentRequest
        {
            Name = name!,
            Description = "Engineering dept"
        };

        // Act
        var result = _createDeptValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateDepartmentRequest.Name));
    }

    [Fact]
    public void CreateCompanyRequest_ValidData_ShouldPassValidation()
    {
        // Arrange
        var request = new CreateCompanyRequest
        {
            Name = "HireWise Corp",
            Description = "AI-Driven Recruitment Platform",
            Website = "https://hirewise.dev",
            LogoUrl = "https://hirewise.dev/logo.png"
        };

        // Act
        var result = _createCompanyValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CreateCompanyRequest_InvalidWebsiteUrl_ShouldFailValidation()
    {
        // Arrange
        var request = new CreateCompanyRequest
        {
            Name = "HireWise Corp",
            Website = "not-a-valid-url"
        };

        // Act
        var result = _createCompanyValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateCompanyRequest.Website));
    }

    [Fact]
    public void UpdateCompanyRequest_EmptyName_ShouldFailValidation()
    {
        // Arrange
        var request = new UpdateCompanyRequest
        {
            Name = ""
        };

        // Act
        var result = _updateCompanyValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(UpdateCompanyRequest.Name));
    }
}
