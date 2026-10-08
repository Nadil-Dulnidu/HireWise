using FluentAssertions;
using HireWise.Api.DTOs.Availability;
using HireWise.Api.Validators.Availability;

namespace HireWise.Api.Tests.Validators;

public class AvailabilityValidatorsTests
{
    private readonly CreateAvailabilitySlotRequestValidator _slotValidator = new();
    private readonly BulkCreateAvailabilityRequestValidator _bulkValidator = new();

    [Fact]
    public void CreateAvailabilitySlot_ValidSlot_ShouldPassValidation()
    {
        // Arrange
        var request = new CreateAvailabilitySlotRequest
        {
            DayOfWeek = DayOfWeek.Monday,
            StartTime = new TimeSpan(9, 0, 0),
            EndTime = new TimeSpan(17, 0, 0),
            Timezone = "Asia/Colombo"
        };

        // Act
        var result = _slotValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CreateAvailabilitySlot_EndTimeBeforeStartTime_ShouldFailValidation()
    {
        // Arrange
        var request = new CreateAvailabilitySlotRequest
        {
            DayOfWeek = DayOfWeek.Monday,
            StartTime = new TimeSpan(17, 0, 0),
            EndTime = new TimeSpan(9, 0, 0),
            Timezone = "Asia/Colombo"
        };

        // Act
        var result = _slotValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateAvailabilitySlotRequest.EndTime));
    }

    [Fact]
    public void CreateAvailabilitySlot_EmptyTimezone_ShouldFailValidation()
    {
        // Arrange
        var request = new CreateAvailabilitySlotRequest
        {
            DayOfWeek = DayOfWeek.Wednesday,
            StartTime = new TimeSpan(10, 0, 0),
            EndTime = new TimeSpan(12, 0, 0),
            Timezone = ""
        };

        // Act
        var result = _slotValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateAvailabilitySlotRequest.Timezone));
    }

    [Fact]
    public void BulkCreateAvailability_EmptyList_ShouldFailValidation()
    {
        // Arrange
        var request = new BulkCreateAvailabilityRequest
        {
            Slots = new List<CreateAvailabilitySlotRequest>()
        };

        // Act
        var result = _bulkValidator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(BulkCreateAvailabilityRequest.Slots));
    }
}
