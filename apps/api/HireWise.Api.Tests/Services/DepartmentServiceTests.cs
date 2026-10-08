using AutoMapper;
using FluentAssertions;
using HireWise.Api.Data;
using HireWise.Api.DTOs.Departments;
using HireWise.Api.Mappings;
using HireWise.Api.Models;
using HireWise.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

namespace HireWise.Api.Tests.Services;

public class DepartmentServiceTests
{
    private readonly IMapper _mapper;

    public DepartmentServiceTests()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddAutoMapper(cfg => cfg.AddProfile<MappingProfile>());
        var provider = services.BuildServiceProvider();
        _mapper = provider.GetRequiredService<IMapper>();
    }

    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task CreateDepartmentAsync_WhenCompanyDoesNotExist_ShouldReturnNotFound()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var service = new DepartmentService(db, _mapper, NullLogger<DepartmentService>.Instance);
        var request = new CreateDepartmentRequest { Name = "Engineering" };

        // Act
        var result = await service.CreateDepartmentAsync(Guid.NewGuid(), request);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(404);
    }

    [Fact]
    public async Task CreateDepartmentAsync_WhenValid_ShouldCreateAndReturnDepartment()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var company = new Company { Id = Guid.NewGuid(), Name = "Acme Tech" };
        db.Companies.Add(company);
        await db.SaveChangesAsync();

        var service = new DepartmentService(db, _mapper, NullLogger<DepartmentService>.Instance);
        var request = new CreateDepartmentRequest { Name = "Platform Architecture" };

        // Act
        var result = await service.CreateDepartmentAsync(company.Id, request);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.StatusCode.Should().Be(201);
        result.Value.Should().NotBeNull();
        result.Value!.Name.Should().Be("Platform Architecture");

        var created = await db.Departments.FirstOrDefaultAsync(d => d.Name == "Platform Architecture");
        created.Should().NotBeNull();
        created!.CompanyId.Should().Be(company.Id);
    }

    [Fact]
    public async Task CreateDepartmentAsync_DuplicateNameInSameCompany_ShouldReturnConflict()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var company = new Company { Id = Guid.NewGuid(), Name = "Acme Tech" };
        db.Companies.Add(company);
        db.Departments.Add(new Department { Id = Guid.NewGuid(), CompanyId = company.Id, Name = "Finance" });
        await db.SaveChangesAsync();

        var service = new DepartmentService(db, _mapper, NullLogger<DepartmentService>.Instance);
        var request = new CreateDepartmentRequest { Name = "Finance" };

        // Act
        var result = await service.CreateDepartmentAsync(company.Id, request);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(409);
    }

    [Fact]
    public async Task GetDepartmentByIdAsync_WhenDepartmentDoesNotExist_ShouldReturnNotFound()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var service = new DepartmentService(db, _mapper, NullLogger<DepartmentService>.Instance);

        // Act
        var result = await service.GetDepartmentByIdAsync(Guid.NewGuid());

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(404);
    }

    [Fact]
    public async Task DeleteDepartmentAsync_WhenExists_ShouldSoftDelete()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var deptId = Guid.NewGuid();
        var department = new Department { Id = deptId, Name = "Legacy Ops", CompanyId = Guid.NewGuid() };
        db.Departments.Add(department);
        await db.SaveChangesAsync();

        var service = new DepartmentService(db, _mapper, NullLogger<DepartmentService>.Instance);

        // Act
        var result = await service.DeleteDepartmentAsync(deptId);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var deleted = await db.Departments.IgnoreQueryFilters().FirstAsync(d => d.Id == deptId);
        deleted.IsDeleted.Should().BeTrue();
        deleted.DeletedAt.Should().NotBeNull();
    }
}
