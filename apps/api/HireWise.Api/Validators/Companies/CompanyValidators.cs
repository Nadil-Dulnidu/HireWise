using FluentValidation;
using HireWise.Api.DTOs.Companies;

namespace HireWise.Api.Validators.Companies;

// Validates data when creating a new company
public class CreateCompanyRequestValidator : AbstractValidator<CreateCompanyRequest>
{
    public CreateCompanyRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Company name is required.")
            .MaximumLength(200).WithMessage("Company name must not exceed 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description must not exceed 2000 characters.");

        RuleFor(x => x.Website)
            .Must(uri => string.IsNullOrEmpty(uri) || Uri.TryCreate(uri, UriKind.Absolute, out _))
            .WithMessage("Website must be a valid URL.");

        RuleFor(x => x.LogoUrl)
            .Must(uri => string.IsNullOrEmpty(uri) || Uri.TryCreate(uri, UriKind.Absolute, out _))
            .WithMessage("Logo URL must be a valid URL.");
    }
}

// Validates data when updating an existing company
public class UpdateCompanyRequestValidator : AbstractValidator<UpdateCompanyRequest>
{
    public UpdateCompanyRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Company name is required.")
            .MaximumLength(200).WithMessage("Company name must not exceed 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description must not exceed 2000 characters.");

        RuleFor(x => x.Website)
            .Must(uri => string.IsNullOrEmpty(uri) || Uri.TryCreate(uri, UriKind.Absolute, out _))
            .WithMessage("Website must be a valid URL.");

        RuleFor(x => x.LogoUrl)
            .Must(uri => string.IsNullOrEmpty(uri) || Uri.TryCreate(uri, UriKind.Absolute, out _))
            .WithMessage("Logo URL must be a valid URL.");
    }
}
