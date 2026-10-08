using FluentAssertions;
using HireWise.Api.Data;
using HireWise.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace HireWise.Api.Tests.Services;

public class PlatformSettingsServiceTests
{
    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task EnsureSeededAsync_WhenDbEmpty_ShouldSeedDefaultSettings()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var service = new PlatformSettingsService(db, NullLogger<PlatformSettingsService>.Instance);

        // Act
        await service.EnsureSeededAsync();

        // Assert
        var settings = await db.PlatformSettings.ToListAsync();
        settings.Should().NotBeEmpty();
        settings.Should().Contain(s => s.Key == "PlatformName");
        settings.Should().Contain(s => s.Key == "DefaultTimezone");
    }

    [Fact]
    public async Task GetValueAsync_WhenKeyExists_ShouldReturnConfiguredValue()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var service = new PlatformSettingsService(db, NullLogger<PlatformSettingsService>.Instance);
        await service.EnsureSeededAsync();

        // Act
        var result = await service.GetValueAsync("PlatformName", "Default");

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be("HireWise Recruitment Platform");
    }

    [Fact]
    public async Task GetValueAsync_WhenKeyMissing_ShouldReturnFallbackDefault()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var service = new PlatformSettingsService(db, NullLogger<PlatformSettingsService>.Instance);

        // Act
        var result = await service.GetValueAsync("NonExistentKey", "MyFallback");

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be("MyFallback");
    }

    [Fact]
    public async Task UpdateBulkAsync_ShouldUpdateAndAddNewSettings()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var service = new PlatformSettingsService(db, NullLogger<PlatformSettingsService>.Instance);
        await service.EnsureSeededAsync();

        var updates = new Dictionary<string, string>
        {
            { "PlatformName", "HireWise Enterprise v2" },
            { "CustomSettingKey", "CustomValue123" }
        };

        // Act
        var result = await service.UpdateBulkAsync(updates);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var updatedPlatformName = await db.PlatformSettings.FirstAsync(s => s.Key == "PlatformName");
        updatedPlatformName.Value.Should().Be("HireWise Enterprise v2");

        var customSetting = await db.PlatformSettings.FirstOrDefaultAsync(s => s.Key == "CustomSettingKey");
        customSetting.Should().NotBeNull();
        customSetting!.Value.Should().Be("CustomValue123");
    }
}
