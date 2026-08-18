namespace HireWise.Api.DTOs.Availability;

public class CreateAvailabilitySlotRequest
{
    public DayOfWeek DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string Timezone { get; set; } = "UTC";
    public bool IsRecurring { get; set; } = true;
    public DateOnly? SpecificDate { get; set; }
}

public class UpdateAvailabilitySlotRequest
{
    public DayOfWeek? DayOfWeek { get; set; }
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }
    public string? Timezone { get; set; }
    public bool? IsRecurring { get; set; }
    public DateOnly? SpecificDate { get; set; }
}

public class BulkCreateAvailabilityRequest
{
    public List<CreateAvailabilitySlotRequest> Slots { get; set; } = new();
}

public class AvailabilitySlotDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public DayOfWeek DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string Timezone { get; set; } = "UTC";
    public bool IsRecurring { get; set; }
    public DateOnly? SpecificDate { get; set; }
    public DateTime CreatedAt { get; set; }
}
