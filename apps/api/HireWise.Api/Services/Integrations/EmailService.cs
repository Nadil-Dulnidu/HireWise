using Resend;

namespace HireWise.Api.Services.Integrations;

public interface IEmailService
{
    Task SendApplicationReceivedEmailAsync(string toEmail, string candidateName, string jobTitle, string companyName, CancellationToken ct = default);
    Task SendApplicationStatusUpdateEmailAsync(string toEmail, string candidateName, string jobTitle, string newStatus, CancellationToken ct = default);
    Task SendInterviewScheduledEmailAsync(string toEmail, string recipientName, string jobTitle, DateTime startTime, DateTime endTime, string? meetingLink, CancellationToken ct = default);
    Task SendInterviewRescheduledEmailAsync(string toEmail, string recipientName, string jobTitle, DateTime newStartTime, CancellationToken ct = default);
    Task SendInterviewCancelledEmailAsync(string toEmail, string recipientName, string jobTitle, string? reason, CancellationToken ct = default);
    Task SendAiEvaluationCompleteEmailAsync(string toEmail, string recruiterName, string candidateName, string jobTitle, CancellationToken ct = default);
    Task SendInterviewFeedbackSubmittedEmailAsync(string toEmail, string recruiterName, string interviewerName, string candidateName, string jobTitle, CancellationToken ct = default);
    Task SendAvailabilitySlotRequestEmailAsync(string toEmail, string candidateName, string jobTitle, string companyName, CancellationToken ct = default);
}

public class EmailService : IEmailService
{
    private readonly IResend _resend;
    private readonly ILogger<EmailService> _logger;
    private readonly bool _enabled;
    private readonly string _fromAddress;

    public EmailService(IResend resend, IConfiguration config, ILogger<EmailService> logger)
    {
        _resend = resend;
        _logger = logger;

        _enabled = config.GetValue<bool>("Resend:Enabled", false)
            || config.GetValue<bool>("RESEND_ENABLED", false);

        _fromAddress = !string.IsNullOrWhiteSpace(config["RESEND_FROM_ADDRESS"])
            ? config["RESEND_FROM_ADDRESS"]!
            : (!string.IsNullOrWhiteSpace(config["Resend:FromAddress"])
                ? config["Resend:FromAddress"]!
                : "HireWise <onboarding@resend.dev>");

        var apiKey = !string.IsNullOrWhiteSpace(config["RESEND_API_KEY"])
            ? config["RESEND_API_KEY"]!
            : (!string.IsNullOrWhiteSpace(config["Resend:ApiKey"])
                ? config["Resend:ApiKey"]!
                : "");

        if (_enabled && !string.IsNullOrWhiteSpace(apiKey) && !apiKey.StartsWith("re_placeholder"))
        {
            _logger.LogInformation("Resend email service initialized. From: {FromAddress}", _fromAddress);
        }
        else if (_enabled)
        {
            _logger.LogWarning("Resend is enabled but no valid API key is configured. Email sending will be disabled.");
            _enabled = false;
        }
        else
        {
            _logger.LogInformation("Resend email service is disabled. Set Resend:Enabled=true and provide an API key to enable.");
        }
    }

    private async Task SendEmailAsync(string to, string subject, string htmlBody, CancellationToken ct)
    {
        if (!_enabled)
        {
            _logger.LogDebug("Email skipped (disabled): To={To}, Subject={Subject}", to, subject);
            return;
        }

        try
        {
            var message = new EmailMessage
            {
                From = _fromAddress,
                To = { to },
                Subject = subject,
                HtmlBody = htmlBody
            };

            await _resend.EmailSendAsync(message, ct);
            _logger.LogInformation("Email sent successfully: To={To}, Subject={Subject}", to, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email via Resend: To={To}, Subject={Subject}. Email delivery will be skipped.", to, subject);
            // Don't throw — email failure should not break business logic
        }
    }

    public async Task SendApplicationReceivedEmailAsync(string toEmail, string candidateName, string jobTitle, string companyName, CancellationToken ct = default)
    {
        var html = EmailTemplates.ApplicationReceived(candidateName, jobTitle, companyName);
        await SendEmailAsync(toEmail, $"Application Received — {jobTitle} at {companyName}", html, ct);
    }

    public async Task SendApplicationStatusUpdateEmailAsync(string toEmail, string candidateName, string jobTitle, string newStatus, CancellationToken ct = default)
    {
        var html = EmailTemplates.ApplicationStatusUpdate(candidateName, jobTitle, newStatus);
        await SendEmailAsync(toEmail, $"Application Update — {jobTitle}", html, ct);
    }

    public async Task SendInterviewScheduledEmailAsync(string toEmail, string recipientName, string jobTitle, DateTime startTime, DateTime endTime, string? meetingLink, CancellationToken ct = default)
    {
        var html = EmailTemplates.InterviewScheduled(recipientName, jobTitle, startTime, endTime, meetingLink);
        await SendEmailAsync(toEmail, $"Interview Scheduled — {jobTitle}", html, ct);
    }

    public async Task SendInterviewRescheduledEmailAsync(string toEmail, string recipientName, string jobTitle, DateTime newStartTime, CancellationToken ct = default)
    {
        var html = EmailTemplates.InterviewRescheduled(recipientName, jobTitle, newStartTime);
        await SendEmailAsync(toEmail, $"Interview Rescheduled — {jobTitle}", html, ct);
    }

    public async Task SendInterviewCancelledEmailAsync(string toEmail, string recipientName, string jobTitle, string? reason, CancellationToken ct = default)
    {
        var html = EmailTemplates.InterviewCancelled(recipientName, jobTitle, reason);
        await SendEmailAsync(toEmail, $"Interview Cancelled — {jobTitle}", html, ct);
    }

    public async Task SendAiEvaluationCompleteEmailAsync(string toEmail, string recruiterName, string candidateName, string jobTitle, CancellationToken ct = default)
    {
        var html = EmailTemplates.AiEvaluationComplete(recruiterName, candidateName, jobTitle);
        await SendEmailAsync(toEmail, $"AI Evaluation Ready — {candidateName} for {jobTitle}", html, ct);
    }

    public async Task SendInterviewFeedbackSubmittedEmailAsync(string toEmail, string recruiterName, string interviewerName, string candidateName, string jobTitle, CancellationToken ct = default)
    {
        var html = EmailTemplates.FeedbackSubmitted(recruiterName, interviewerName, candidateName, jobTitle);
        await SendEmailAsync(toEmail, $"Interview Feedback Submitted — {candidateName} for {jobTitle}", html, ct);
    }

    public async Task SendAvailabilitySlotRequestEmailAsync(string toEmail, string candidateName, string jobTitle, string companyName, CancellationToken ct = default)
    {
        var html = EmailTemplates.AvailabilitySlotRequest(candidateName, jobTitle, companyName);
        await SendEmailAsync(toEmail, $"Action Required: Add Your Interview Availability — {jobTitle} at {companyName}", html, ct);
    }
}

