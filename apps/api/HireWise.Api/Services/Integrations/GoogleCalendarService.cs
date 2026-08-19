using Google.Apis.Auth.OAuth2;
using Google.Apis.Calendar.v3;
using Google.Apis.Calendar.v3.Data;
using Google.Apis.Services;
using HireWise.Api.Models;

namespace HireWise.Api.Services.Integrations;

public interface IGoogleCalendarService
{
    Task<string?> CreateInterviewEventAsync(Interview interview, User candidate, User interviewer, Job job, CancellationToken ct = default);
    Task<bool> UpdateInterviewEventAsync(string eventId, Interview interview, CancellationToken ct = default);
    Task<bool> DeleteInterviewEventAsync(string eventId, CancellationToken ct = default);
}

public class GoogleCalendarService : IGoogleCalendarService
{
    private readonly IConfiguration _config;
    private readonly ILogger<GoogleCalendarService> _logger;
    private bool _enabled;
    private readonly string _calendarId;
    private CalendarService? _calendarService;

    public GoogleCalendarService(IConfiguration config, ILogger<GoogleCalendarService> logger)
    {
        _config = config;
        _logger = logger;

        _enabled = config.GetValue<bool>("GoogleCalendar:Enabled", false)
            || config.GetValue<bool>("GOOGLE_CALENDAR_ENABLED", false);

        _calendarId = config["GoogleCalendar:CalendarId"]
            ?? config["GOOGLE_CALENDAR_ID"]
            ?? "primary";

        if (_enabled)
        {
            InitializeCalendarService();
        }
        else
        {
            _logger.LogInformation("Google Calendar integration is disabled. Set GoogleCalendar:Enabled=true to enable.");
        }
    }

    private void InitializeCalendarService()
    {
        try
        {
            var keyPath = _config["GoogleCalendar:ServiceAccountKeyPath"]
                ?? _config["GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_PATH"]
                ?? "";

            if (string.IsNullOrWhiteSpace(keyPath) || !File.Exists(keyPath))
            {
                _logger.LogWarning("Google Calendar service account key file not found at '{KeyPath}'. Calendar integration will be disabled.", keyPath);
                _enabled = false;
                return;
            }

            var credential = GoogleCredential.FromFile(keyPath)
                .CreateScoped(CalendarService.Scope.Calendar);

            _calendarService = new CalendarService(new BaseClientService.Initializer
            {
                HttpClientInitializer = credential,
                ApplicationName = "HireWise"
            });

            _logger.LogInformation("Google Calendar service initialized successfully with calendar '{CalendarId}'.", _calendarId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize Google Calendar service. Calendar integration will be disabled.");
            _enabled = false;
        }
    }

    public async Task<string?> CreateInterviewEventAsync(Interview interview, User candidate, User interviewer, Job job, CancellationToken ct = default)
    {
        if (!_enabled || _calendarService == null)
        {
            _logger.LogDebug("Google Calendar is disabled — skipping event creation for Interview {InterviewId}.", interview.Id);
            return null;
        }

        try
        {
            var calendarEvent = new Event
            {
                Summary = $"HireWise Interview: {job.Title} — {candidate.FirstName} {candidate.LastName}",
                Description = BuildEventDescription(interview, candidate, interviewer, job),
                Start = new EventDateTime
                {
                    DateTimeDateTimeOffset = new DateTimeOffset(interview.ScheduledStartTime, TimeSpan.Zero),
                    TimeZone = "UTC"
                },
                End = new EventDateTime
                {
                    DateTimeDateTimeOffset = new DateTimeOffset(interview.ScheduledEndTime, TimeSpan.Zero),
                    TimeZone = "UTC"
                },
                Attendees = new List<EventAttendee>
                {
                    new EventAttendee { Email = candidate.Email, DisplayName = $"{candidate.FirstName} {candidate.LastName}", ResponseStatus = "needsAction" },
                    new EventAttendee { Email = interviewer.Email, DisplayName = $"{interviewer.FirstName} {interviewer.LastName}", ResponseStatus = "needsAction" }
                },
                Reminders = new Event.RemindersData
                {
                    UseDefault = false,
                    Overrides = new List<EventReminder>
                    {
                        new EventReminder { Method = "popup", Minutes = 30 },
                        new EventReminder { Method = "popup", Minutes = 10 }
                    }
                },
                Status = "confirmed",
                Transparency = "opaque"
            };

            // Add meeting link to the description and as a conference data if provided
            if (!string.IsNullOrWhiteSpace(interview.MeetingLink))
            {
                calendarEvent.Location = interview.MeetingLink;
            }

            var request = _calendarService.Events.Insert(calendarEvent, _calendarId);
            request.SendUpdates = EventsResource.InsertRequest.SendUpdatesEnum.All;

            var createdEvent = await request.ExecuteAsync(ct);

            _logger.LogInformation("Google Calendar event '{EventId}' created for Interview {InterviewId}.", createdEvent.Id, interview.Id);
            return createdEvent.Id;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create Google Calendar event for Interview {InterviewId}. Interview will proceed without calendar integration.", interview.Id);
            return null;
        }
    }

    public async Task<bool> UpdateInterviewEventAsync(string eventId, Interview interview, CancellationToken ct = default)
    {
        if (!_enabled || _calendarService == null)
        {
            _logger.LogDebug("Google Calendar is disabled — skipping event update for event '{EventId}'.", eventId);
            return false;
        }

        try
        {
            // Fetch existing event
            var existingEvent = await _calendarService.Events.Get(_calendarId, eventId).ExecuteAsync(ct);
            if (existingEvent == null)
            {
                _logger.LogWarning("Google Calendar event '{EventId}' not found. Cannot update.", eventId);
                return false;
            }

            // Update times
            existingEvent.Start = new EventDateTime
            {
                DateTimeDateTimeOffset = new DateTimeOffset(interview.ScheduledStartTime, TimeSpan.Zero),
                TimeZone = "UTC"
            };
            existingEvent.End = new EventDateTime
            {
                DateTimeDateTimeOffset = new DateTimeOffset(interview.ScheduledEndTime, TimeSpan.Zero),
                TimeZone = "UTC"
            };

            if (!string.IsNullOrWhiteSpace(interview.MeetingLink))
            {
                existingEvent.Location = interview.MeetingLink;
            }

            var request = _calendarService.Events.Update(existingEvent, _calendarId, eventId);
            request.SendUpdates = EventsResource.UpdateRequest.SendUpdatesEnum.All;

            await request.ExecuteAsync(ct);

            _logger.LogInformation("Google Calendar event '{EventId}' updated for Interview {InterviewId}.", eventId, interview.Id);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update Google Calendar event '{EventId}'.", eventId);
            return false;
        }
    }

    public async Task<bool> DeleteInterviewEventAsync(string eventId, CancellationToken ct = default)
    {
        if (!_enabled || _calendarService == null)
        {
            _logger.LogDebug("Google Calendar is disabled — skipping event deletion for event '{EventId}'.", eventId);
            return false;
        }

        try
        {
            var request = _calendarService.Events.Delete(_calendarId, eventId);
            request.SendUpdates = EventsResource.DeleteRequest.SendUpdatesEnum.All;

            await request.ExecuteAsync(ct);

            _logger.LogInformation("Google Calendar event '{EventId}' deleted.", eventId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete Google Calendar event '{EventId}'.", eventId);
            return false;
        }
    }

    private static string BuildEventDescription(Interview interview, User candidate, User interviewer, Job job)
    {
        var description = $"""
            📋 HireWise Interview Details
            ════════════════════════════════

            Position: {job.Title}
            Candidate: {candidate.FirstName} {candidate.LastName} ({candidate.Email})
            Interviewer: {interviewer.FirstName} {interviewer.LastName} ({interviewer.Email})
            """;

        if (!string.IsNullOrWhiteSpace(interview.MeetingLink))
        {
            description += $"\n\n🔗 Meeting Link: {interview.MeetingLink}";
        }

        if (!string.IsNullOrWhiteSpace(interview.Notes))
        {
            description += $"\n\n📝 Notes: {interview.Notes}";
        }

        description += "\n\n—\nManaged by HireWise AI Recruitment Platform";

        return description;
    }
}
