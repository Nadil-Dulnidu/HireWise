using AutoMapper;
using FluentAssertions;
using HireWise.Api.DTOs.Companies;
using HireWise.Api.DTOs.Departments;
using HireWise.Api.DTOs.Jobs;
using HireWise.Api.DTOs.Users;
using HireWise.Api.Mappings;
using HireWise.Api.Models;
using HireWise.Api.Models.Enums;
using Microsoft.Extensions.DependencyInjection;

namespace HireWise.Api.Tests.Mappings;

public class MappingProfileTests
{
    private readonly IMapper _mapper;

    public MappingProfileTests()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddAutoMapper(cfg => cfg.AddProfile<MappingProfile>());
        var provider = services.BuildServiceProvider();
        _mapper = provider.GetRequiredService<IMapper>();
    }

    [Fact]
    public void Map_UserToUserDto_ShouldMapPropertiesCorrectly()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            ClerkUserId = "user_clerk123",
            Email = "john.doe@example.com",
            FirstName = "John",
            LastName = "Doe",
            Role = UserRole.RECRUITER,
            Status = UserStatus.ACTIVE,
            Company = new Company { Id = Guid.NewGuid(), Name = "HireWise Tech" }
        };

        // Act
        var dto = _mapper.Map<UserDto>(user);

        // Assert
        dto.Should().NotBeNull();
        dto.Id.Should().Be(user.Id);
        dto.Email.Should().Be("john.doe@example.com");
        dto.FirstName.Should().Be("John");
        dto.LastName.Should().Be("Doe");
        dto.CompanyName.Should().Be("HireWise Tech");
    }

    [Fact]
    public void Map_CompanyToCompanyDto_ShouldCalculateCountsCorrectly()
    {
        // Arrange
        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = "HireWise Solutions",
            Website = "https://hirewise.dev",
            Location = "Colombo",
            CreatedByUser = new User { FirstName = "Nadil", LastName = "Dulnidu" },
            Employees = new List<User> { new User(), new User() },
            Departments = new List<Department> { new Department() },
            Jobs = new List<Job>
            {
                new Job { Status = JobStatus.OPEN },
                new Job { Status = JobStatus.CLOSED }
            }
        };

        // Act
        var dto = _mapper.Map<CompanyDto>(company);

        // Assert
        dto.Should().NotBeNull();
        dto.Name.Should().Be("HireWise Solutions");
        dto.CreatedByName.Should().Be("Nadil Dulnidu");
        dto.EmployeeCount.Should().Be(2);
        dto.DepartmentCount.Should().Be(1);
        dto.ActiveJobCount.Should().Be(1);
    }

    [Fact]
    public void Map_DepartmentToDepartmentDto_ShouldMapFieldsCorrectly()
    {
        // Arrange
        var department = new Department
        {
            Id = Guid.NewGuid(),
            Name = "Quality Assurance",
            Description = "Automated testing and QA",
            Company = new Company { Name = "HireWise Corp" },
            Jobs = new List<Job>
            {
                new Job { Status = JobStatus.OPEN },
                new Job { Status = JobStatus.OPEN }
            }
        };

        // Act
        var dto = _mapper.Map<DepartmentDto>(department);

        // Assert
        dto.Should().NotBeNull();
        dto.Name.Should().Be("Quality Assurance");
        dto.CompanyName.Should().Be("HireWise Corp");
        dto.ActiveJobCount.Should().Be(2);
    }

    [Fact]
    public void Map_CreateJobRequestToJob_ShouldMapMatchingProperties()
    {
        // Arrange
        var request = new CreateJobRequest
        {
            Title = "DevOps Engineer",
            Description = "Oversee CI/CD pipelines and Kubernetes infrastructure.",
            Requirements = "Docker, K8s, GitHub Actions",
            Location = "Remote",
            SalaryMin = 3000,
            SalaryMax = 5000,
            SalaryCurrency = "USD"
        };

        // Act
        var job = _mapper.Map<Job>(request);

        // Assert
        job.Should().NotBeNull();
        job.Title.Should().Be("DevOps Engineer");
        job.Description.Should().Be(request.Description);
        job.SalaryMin.Should().Be(3000);
        job.SalaryMax.Should().Be(5000);
    }
}
