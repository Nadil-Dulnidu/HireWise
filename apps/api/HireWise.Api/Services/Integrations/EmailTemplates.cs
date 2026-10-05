namespace HireWise.Api.Services.Integrations;

/// <summary>
/// Static class containing responsive HTML email templates for HireWise transactional emails.
/// All templates use inline CSS for maximum email client compatibility.
/// </summary>
public static class EmailTemplates
{
    private const string BrandColor = "#6366f1";
    private const string BrandGradient = "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)";
    private const string TextPrimary = "#1e293b";
    private const string TextSecondary = "#64748b";
    private const string BackgroundLight = "#f8fafc";
    private const string CardBackground = "#ffffff";
    private const string BorderColor = "#e2e8f0";

    private static string WrapInLayout(string title, string bodyContent, string? companyName = null)
    {
        var headerTitle = !string.IsNullOrWhiteSpace(companyName) ? $"{companyName} Careers" : "HireWise";
        var headerSubtitle = !string.IsNullOrWhiteSpace(companyName) ? "Talent & Recruitment Platform • Powered by HireWise" : "AI-Powered Recruitment Platform";

        return $"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{title}</title>
        </head>
        <body style="margin:0;padding:0;background-color:{BackgroundLight};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:{BackgroundLight};">
                <tr>
                    <td align="center" style="padding:40px 20px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;">
                            <!-- Header -->
                            <tr>
                                <td style="background:{BrandGradient};padding:32px 40px;border-radius:16px 16px 0 0;text-align:center;">
                                    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">{headerTitle}</h1>
                                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;font-weight:400;">{headerSubtitle}</p>
                                </td>
                            </tr>
                            <!-- Body -->
                            <tr>
                                <td style="background-color:{CardBackground};padding:40px;border-left:1px solid {BorderColor};border-right:1px solid {BorderColor};">
                                    {bodyContent}
                                </td>
                            </tr>
                            <!-- Footer -->
                            <tr>
                                <td style="background-color:{CardBackground};padding:24px 40px 32px;border-radius:0 0 16px 16px;border:1px solid {BorderColor};border-top:none;text-align:center;">
                                    <hr style="border:none;border-top:1px solid {BorderColor};margin:0 0 20px;">
                                    <p style="margin:0;color:{TextSecondary};font-size:12px;line-height:1.6;">
                                        {(!string.IsNullOrWhiteSpace(companyName) ? $"This is an official recruitment notification from {companyName} delivered via HireWise." : "This is an automated message from HireWise.")}<br>
                                        Please contact your designated recruiter if you have any questions.
                                    </p>
                                    <p style="margin:12px 0 0;color:{TextSecondary};font-size:11px;">
                                        &copy; {DateTime.UtcNow.Year} HireWise. All rights reserved.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """;
    }

    private static string StatusBadge(string text, string bgColor, string textColor = "#ffffff")
    {
        return $"""<span style="display:inline-block;background-color:{bgColor};color:{textColor};padding:4px 14px;border-radius:20px;font-size:12px;font-weight:600;letter-spacing:0.5px;">{text}</span>""";
    }

    private static string InfoRow(string label, string value)
    {
        return $"""
        <tr>
            <td style="padding:8px 0;color:{TextSecondary};font-size:14px;font-weight:500;width:140px;vertical-align:top;">{label}</td>
            <td style="padding:8px 0;color:{TextPrimary};font-size:14px;">{value}</td>
        </tr>
        """;
    }

    // =========================================================================
    // Application Emails
    // =========================================================================

    public static string ApplicationReceived(string candidateName, string jobTitle, string companyName)
    {
        var body = $"""
        <h2 style="margin:0 0 8px;color:{TextPrimary};font-size:22px;font-weight:700;">Application Received! 🎉</h2>
        <p style="margin:0 0 24px;color:{TextSecondary};font-size:15px;line-height:1.6;">
            Hi {candidateName}, your application has been successfully submitted.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:{BackgroundLight};border-radius:12px;padding:24px;margin-bottom:24px;">
            {InfoRow("Position", $"<strong>{jobTitle}</strong>")}
            {InfoRow("Company", companyName)}
            {InfoRow("Status", StatusBadge("AI Review In Progress", "#3b82f6"))}
        </table>

        <p style="margin:0 0 8px;color:{TextPrimary};font-size:15px;line-height:1.7;">
            <strong>What happens next?</strong>
        </p>
        <ol style="margin:0 0 24px;padding-left:20px;color:{TextSecondary};font-size:14px;line-height:2;">
            <li>Our AI system is reviewing your resume against the job requirements</li>
            <li>A recruiter will review the AI evaluation results</li>
            <li>You'll receive an update on your application status</li>
        </ol>

        <p style="margin:0;color:{TextSecondary};font-size:14px;">
            You can track your application progress in your HireWise dashboard at any time.
        </p>
        """;

        return WrapInLayout("Application Received — HireWise", body);
    }

    public static string ApplicationStatusUpdate(string candidateName, string jobTitle, string newStatus)
    {
        var statusColor = newStatus switch
        {
            "INTERVIEW_APPROVED" => "#10b981",
            "REJECTED" => "#ef4444",
            "SELECTED" => "#10b981",
            _ => "#6366f1"
        };

        var statusLabel = newStatus.Replace('_', ' ');

        var encouragement = newStatus switch
        {
            "INTERVIEW_APPROVED" => "<p style=\"margin:16px 0 0;color:#10b981;font-size:15px;font-weight:600;\">🎊 Congratulations! You've been approved for an interview. Details will be shared shortly.</p>",
            "REJECTED" => "<p style=\"margin:16px 0 0;color:#64748b;font-size:14px;\">We appreciate your interest and encourage you to apply for other positions that match your skills.</p>",
            "SELECTED" => "<p style=\"margin:16px 0 0;color:#10b981;font-size:15px;font-weight:600;\">🏆 Congratulations! You have been selected for this position!</p>",
            _ => ""
        };

        var body = $"""
        <h2 style="margin:0 0 8px;color:{TextPrimary};font-size:22px;font-weight:700;">Application Update</h2>
        <p style="margin:0 0 24px;color:{TextSecondary};font-size:15px;line-height:1.6;">
            Hi {candidateName}, there's been an update on your application.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:{BackgroundLight};border-radius:12px;padding:24px;margin-bottom:24px;">
            {InfoRow("Position", $"<strong>{jobTitle}</strong>")}
            {InfoRow("New Status", StatusBadge(statusLabel, statusColor))}
        </table>

        {encouragement}
        """;

        return WrapInLayout("Application Update — HireWise", body);
    }

    // =========================================================================
    // Interview Emails
    // =========================================================================

    public static string InterviewScheduled(string recipientName, string jobTitle, DateTime startTime, DateTime endTime, string? meetingLink)
    {
        var dateStr = startTime.ToString("dddd, MMMM d, yyyy");
        var timeStr = $"{startTime:h:mm tt} — {endTime:h:mm tt} UTC";

        var startIso = startTime.ToUniversalTime().ToString("yyyyMMddTHHmmssZ");
        var endIso = endTime.ToUniversalTime().ToString("yyyyMMddTHHmmssZ");
        var title = Uri.EscapeDataString($"HireWise Interview: {jobTitle}");
        var details = Uri.EscapeDataString($"Interview for {jobTitle} on HireWise." + (string.IsNullOrWhiteSpace(meetingLink) ? "" : $"\nJoin Meeting: {meetingLink}"));
        var location = Uri.EscapeDataString(meetingLink ?? "HireWise Platform");
        var calUrl = $"https://calendar.google.com/calendar/render?action=TEMPLATE&text={title}&dates={startIso}/{endIso}&details={details}&location={location}";

        var meetingSection = string.IsNullOrWhiteSpace(meetingLink) ? "" : $"""
        {InfoRow("Meeting Link", $"<a href=\"{meetingLink}\" style=\"color:{BrandColor};text-decoration:none;font-weight:500;\">{meetingLink}</a>")}
        """;

        var body = $"""
        <h2 style="margin:0 0 8px;color:{TextPrimary};font-size:22px;font-weight:700;">Interview Scheduled 📅</h2>
        <p style="margin:0 0 24px;color:{TextSecondary};font-size:15px;line-height:1.6;">
            Hi {recipientName}, an interview has been scheduled for you.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:{BackgroundLight};border-radius:12px;padding:24px;margin-bottom:24px;">
            {InfoRow("Position", $"<strong>{jobTitle}</strong>")}
            {InfoRow("Date", dateStr)}
            {InfoRow("Time", timeStr)}
            {meetingSection}
            {InfoRow("Status", StatusBadge("CONFIRMED", "#10b981"))}
        </table>

        <div style="text-align:center;margin:28px 0;">
            <a href="{calUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:{BrandColor};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;box-shadow:0 4px 6px -1px rgba(99, 102, 241, 0.2);">
                📅 Add to Google Calendar
            </a>
        </div>

        <p style="margin:0;color:{TextSecondary};font-size:14px;line-height:1.7;">
            Please make sure you're available at the scheduled time. If you need to reschedule, contact the recruiter through the HireWise platform.
        </p>
        """;

        return WrapInLayout("Interview Scheduled — HireWise", body);
    }

    public static string InterviewRescheduled(string recipientName, string jobTitle, DateTime newStartTime)
    {
        var dateStr = newStartTime.ToString("dddd, MMMM d, yyyy");
        var timeStr = newStartTime.ToString("h:mm tt") + " UTC";

        var body = $"""
        <h2 style="margin:0 0 8px;color:{TextPrimary};font-size:22px;font-weight:700;">Interview Rescheduled 🔄</h2>
        <p style="margin:0 0 24px;color:{TextSecondary};font-size:15px;line-height:1.6;">
            Hi {recipientName}, your interview has been rescheduled.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:{BackgroundLight};border-radius:12px;padding:24px;margin-bottom:24px;">
            {InfoRow("Position", $"<strong>{jobTitle}</strong>")}
            {InfoRow("New Date", dateStr)}
            {InfoRow("New Time", timeStr)}
            {InfoRow("Status", StatusBadge("RESCHEDULED", "#f59e0b"))}
        </table>

        <p style="margin:0;color:{TextSecondary};font-size:14px;line-height:1.7;">
            Please update your availability accordingly. If you have any conflicts with the new schedule, contact the recruiter through the HireWise platform.
        </p>
        """;

        return WrapInLayout("Interview Rescheduled — HireWise", body);
    }

    public static string InterviewCancelled(string recipientName, string jobTitle, string? reason)
    {
        var reasonSection = string.IsNullOrWhiteSpace(reason) ? "" : $"""
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fef2f2;border-radius:12px;padding:20px;margin-bottom:24px;border-left:4px solid #ef4444;">
            <tr>
                <td style="color:#991b1b;font-size:14px;line-height:1.6;">
                    <strong>Reason:</strong> {reason}
                </td>
            </tr>
        </table>
        """;

        var body = $"""
        <h2 style="margin:0 0 8px;color:{TextPrimary};font-size:22px;font-weight:700;">Interview Cancelled</h2>
        <p style="margin:0 0 24px;color:{TextSecondary};font-size:15px;line-height:1.6;">
            Hi {recipientName}, the interview for the following position has been cancelled.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:{BackgroundLight};border-radius:12px;padding:24px;margin-bottom:24px;">
            {InfoRow("Position", $"<strong>{jobTitle}</strong>")}
            {InfoRow("Status", StatusBadge("CANCELLED", "#ef4444"))}
        </table>

        {reasonSection}

        <p style="margin:0;color:{TextSecondary};font-size:14px;line-height:1.7;">
            If you believe this was done in error, please contact the recruiter through the HireWise platform.
        </p>
        """;

        return WrapInLayout("Interview Cancelled — HireWise", body);
    }

    // =========================================================================
    // Recruiter Notification Emails
    // =========================================================================

    public static string AiEvaluationComplete(string recruiterName, string candidateName, string jobTitle)
    {
        var body = $"""
        <h2 style="margin:0 0 8px;color:{TextPrimary};font-size:22px;font-weight:700;">AI Evaluation Complete ⚡</h2>
        <p style="margin:0 0 24px;color:{TextSecondary};font-size:15px;line-height:1.6;">
            Hi {recruiterName}, the AI evaluation for a candidate application is ready for your review.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:{BackgroundLight};border-radius:12px;padding:24px;margin-bottom:24px;">
            {InfoRow("Candidate", $"<strong>{candidateName}</strong>")}
            {InfoRow("Position", jobTitle)}
            {InfoRow("Status", StatusBadge("READY FOR REVIEW", "#6366f1"))}
        </table>

        <p style="margin:0;color:{TextSecondary};font-size:14px;line-height:1.7;">
            Log in to your HireWise dashboard to view the full AI evaluation report, including skills match, experience analysis, and interview recommendations.
        </p>
        """;

        return WrapInLayout("AI Evaluation Ready — HireWise", body);
    }

    public static string FeedbackSubmitted(string recruiterName, string interviewerName, string candidateName, string jobTitle)
    {
        var body = $"""
        <h2 style="margin:0 0 8px;color:{TextPrimary};font-size:22px;font-weight:700;">Interview Feedback Submitted ✅</h2>
        <p style="margin:0 0 24px;color:{TextSecondary};font-size:15px;line-height:1.6;">
            Hi {recruiterName}, an interviewer has submitted their feedback.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:{BackgroundLight};border-radius:12px;padding:24px;margin-bottom:24px;">
            {InfoRow("Interviewer", $"<strong>{interviewerName}</strong>")}
            {InfoRow("Candidate", candidateName)}
            {InfoRow("Position", jobTitle)}
            {InfoRow("Status", StatusBadge("FEEDBACK READY", "#10b981"))}
        </table>

        <p style="margin:0;color:{TextSecondary};font-size:14px;line-height:1.7;">
            Log in to your HireWise dashboard to review the feedback details and make a hiring decision.
        </p>
        """;

        return WrapInLayout("Interview Feedback Ready — HireWise", body);
    }

    public static string AvailabilitySlotRequest(string candidateName, string jobTitle, string companyName)
    {
        var body = $"""
        <h2 style="margin:0 0 8px;color:{TextPrimary};font-size:22px;font-weight:700;">Action Required: Add Your Interview Availability 📅</h2>
        <p style="margin:0 0 20px;color:{TextSecondary};font-size:15px;line-height:1.6;">
            Hi <strong>{candidateName}</strong>,
        </p>
        <p style="margin:0 0 20px;color:{TextPrimary};font-size:15px;line-height:1.6;">
            Great news! Your application for <strong>{jobTitle}</strong> at <strong>{companyName}</strong> has been shortlisted for an interview round.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:{BackgroundLight};border-radius:12px;padding:24px;margin-bottom:24px;">
            {InfoRow("Position", $"<strong>{jobTitle}</strong>")}
            {InfoRow("Company", companyName)}
            {InfoRow("Next Step", StatusBadge("AVAILABILITY NEEDED", "#f59e0b"))}
        </table>

        <p style="margin:0 0 24px;color:{TextSecondary};font-size:14px;line-height:1.7;">
            Before the hiring team can finalize your interview schedule, please sign in to your HireWise Candidate Portal and submit your available weekly time slots or specific dates.
        </p>

        <div style="text-align:center;margin:32px 0;">
            <a href="https://hirewise.dev/candidate/availability" style="display:inline-block;background:{BrandColor};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;box-shadow:0 4px 6px -1px rgba(99, 102, 241, 0.2);">
                Add Availability Slots &rarr;
            </a>
        </div>

        <p style="margin:0;color:{TextSecondary};font-size:13px;line-height:1.6;">
            Once your slots are saved, your recruiters and interviewers will be able to confirm a time that fits your schedule.
        </p>
        """;

        return WrapInLayout($"Interview Availability Needed — {jobTitle}", body);
    }

    // =========================================================================
    // Final Hiring Decision Emails (Offer & Rejection)
    // =========================================================================

    public static string FinalHiringDecision(
        string candidateName,
        string jobTitle,
        string companyName,
        string? companyWebsite,
        string? companyLocation,
        string recruiterName,
        string? recruiterEmail,
        Models.Enums.ApplicationStatus decision,
        string? customNotes)
    {
        var isOffer = decision == Models.Enums.ApplicationStatus.SELECTED;
        var headline = isOffer ? $"Job Offer: {jobTitle} at {companyName}" : $"Interview Outcome: {jobTitle} at {companyName}";

        var notesHtml = string.IsNullOrWhiteSpace(customNotes) ? "" : $"""
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f1f5f9;border-left:4px solid {(isOffer ? "#10b981" : "#6366f1")};border-radius:8px;padding:16px 20px;margin:20px 0 24px;">
            <tr>
                <td style="color:{TextPrimary};font-size:14px;line-height:1.7;">
                    <strong style="color:{(isOffer ? "#059669" : "#4f46e5")};">Personal Note from {recruiterName}:</strong><br>
                    <span style="font-style:italic;display:inline-block;margin-top:4px;">"{customNotes.Trim()}"</span>
                </td>
            </tr>
        </table>
        """;

        var websiteHtml = string.IsNullOrWhiteSpace(companyWebsite) ? "" :
            $"<a href=\"{companyWebsite}\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color:{BrandColor};text-decoration:none;\">{companyWebsite}</a>";

        var recruiterEmailHtml = string.IsNullOrWhiteSpace(recruiterEmail) ? "" :
            $"<a href=\"mailto:{recruiterEmail}\" style=\"color:{BrandColor};text-decoration:none;\">{recruiterEmail}</a>";

        var locationStr = !string.IsNullOrWhiteSpace(companyLocation) ? companyLocation : "As specified in job listing";

        string body;

        if (isOffer)
        {
            body = $"""
            <div style="text-align:center;margin-bottom:24px;">
                <span style="display:inline-block;background-color:#ecfdf5;color:#059669;border:1px solid #a7f3d0;padding:6px 16px;border-radius:24px;font-size:13px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">
                    🎉 Formal Offer Extended
                </span>
            </div>

            <h2 style="margin:0 0 8px;color:{TextPrimary};font-size:24px;font-weight:700;letter-spacing:-0.5px;text-align:center;">
                Congratulations, {candidateName}!
            </h2>
            <p style="margin:0 0 24px;color:{TextSecondary};font-size:15px;line-height:1.7;text-align:center;">
                On behalf of the entire team at <strong>{companyName}</strong>, we are thrilled to formally extend an offer of employment to you for the position of <strong>{jobTitle}</strong>.
            </p>

            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:{BackgroundLight};border:1px solid {BorderColor};border-radius:12px;padding:24px;margin-bottom:24px;">
                {InfoRow("Position", $"<strong style=\"color:{TextPrimary};\">{jobTitle}</strong>")}
                {InfoRow("Company", $"<strong>{companyName}</strong>")}
                {(!string.IsNullOrWhiteSpace(locationStr) ? InfoRow("Location / Mode", locationStr) : "")}
                {InfoRow("Decision", StatusBadge("OFFER EXTENDED", "#10b981"))}
                {InfoRow("Primary Recruiter", $"<strong>{recruiterName}</strong>" + (!string.IsNullOrWhiteSpace(recruiterEmail) ? $" ({recruiterEmailHtml})" : ""))}
            </table>

            {notesHtml}

            <div style="background-color:#ffffff;border:1px solid #e0e7ff;border-radius:12px;padding:20px;margin-bottom:24px;">
                <h4 style="margin:0 0 10px;color:#3730a3;font-size:15px;font-weight:700;">
                    What Happens Next?
                </h4>
                <ol style="margin:0;padding-left:20px;color:{TextSecondary};font-size:14px;line-height:1.8;">
                    <li><strong>Official Documentation:</strong> Our HR and talent acquisition team is preparing your comprehensive offer package containing salary details, benefits, and start date.</li>
                    <li><strong>Direct Consultation:</strong> Feel free to reply directly to this email or reach out to <strong>{recruiterName}</strong> at any time if you have questions or wish to discuss details.</li>
                    <li><strong>Onboarding Kickoff:</strong> Once accepted, you will receive our welcome portal instructions to prepare for your day one.</li>
                </ol>
            </div>

            <p style="margin:0 0 24px;color:{TextPrimary};font-size:15px;line-height:1.7;">
                Our team was deeply impressed with your technical skills, problem-solving abilities, and cultural contribution throughout the interview process. We are truly looking forward to building the future together at <strong>{companyName}</strong>!
            </p>

            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid {BorderColor};padding-top:20px;margin-top:24px;">
                <tr>
                    <td style="color:{TextPrimary};font-size:14px;line-height:1.6;">
                        Warm regards,<br>
                        <strong style="font-size:15px;color:{TextPrimary};">{recruiterName}</strong><br>
                        <span style="color:{TextSecondary};">Talent Acquisition & Hiring Team</span><br>
                        <strong style="color:#4f46e5;">{companyName}</strong><br>
                        {(!string.IsNullOrWhiteSpace(recruiterEmail) ? $"<span style=\"color:{TextSecondary};font-size:13px;\">Email: {recruiterEmailHtml}</span><br>" : "")}
                        {(!string.IsNullOrWhiteSpace(companyWebsite) ? $"<span style=\"color:{TextSecondary};font-size:13px;\">Website: {websiteHtml}</span>" : "")}
                    </td>
                </tr>
            </table>
            """;
        }
        else
        {
            body = $"""
            <h2 style="margin:0 0 8px;color:{TextPrimary};font-size:22px;font-weight:700;letter-spacing:-0.5px;">
                Interview Outcome: {jobTitle}
            </h2>
            <p style="margin:0 0 20px;color:{TextSecondary};font-size:15px;line-height:1.7;">
                Dear {candidateName},
            </p>
            <p style="margin:0 0 20px;color:{TextSecondary};font-size:15px;line-height:1.7;">
                Thank you very much for taking the time to interview with our engineering and hiring team for the <strong>{jobTitle}</strong> position at <strong>{companyName}</strong>. We truly enjoyed speaking with you and learning more about your technical experience, career journey, and perspectives.
            </p>

            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:{BackgroundLight};border:1px solid {BorderColor};border-radius:12px;padding:24px;margin-bottom:24px;">
                {InfoRow("Position", $"<strong>{jobTitle}</strong>")}
                {InfoRow("Company", companyName)}
                {InfoRow("Application Status", StatusBadge("NOT SELECTED", "#64748b"))}
                {InfoRow("Recruitment Contact", $"{recruiterName}" + (!string.IsNullOrWhiteSpace(recruiterEmail) ? $" ({recruiterEmailHtml})" : ""))}
            </table>

            {notesHtml}

            <p style="margin:0 0 20px;color:{TextSecondary};font-size:14px;line-height:1.8;">
                After careful consideration and reviewing our current technical requirements, we have decided to move forward with another candidate whose background more directly aligns with the specific priorities of this opening.
            </p>

            <p style="margin:0 0 20px;color:{TextSecondary};font-size:14px;line-height:1.8;">
                This was a difficult decision given the high caliber of candidates we met. Our team was genuinely impressed with your preparation and accomplishments. With your permission, we would love to retain your information in our talent network for upcoming openings that may be a great match.
            </p>

            <p style="margin:0 0 24px;color:{TextPrimary};font-size:14px;line-height:1.7;">
                We sincerely appreciate your interest in <strong>{companyName}</strong> and wish you the very best in your job search and future professional endeavors.
            </p>

            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid {BorderColor};padding-top:20px;margin-top:24px;">
                <tr>
                    <td style="color:{TextPrimary};font-size:14px;line-height:1.6;">
                        Sincerely,<br>
                        <strong style="font-size:15px;color:{TextPrimary};">{recruiterName}</strong><br>
                        <span style="color:{TextSecondary};">Talent Acquisition Team</span><br>
                        <strong style="color:#4f46e5;">{companyName}</strong><br>
                        {(!string.IsNullOrWhiteSpace(recruiterEmail) ? $"<span style=\"color:{TextSecondary};font-size:13px;\">Email: {recruiterEmailHtml}</span><br>" : "")}
                        {(!string.IsNullOrWhiteSpace(companyWebsite) ? $"<span style=\"color:{TextSecondary};font-size:13px;\">Website: {websiteHtml}</span>" : "")}
                    </td>
                </tr>
            </table>
            """;
        }

        return WrapInLayout(headline, body, companyName);
    }
}
