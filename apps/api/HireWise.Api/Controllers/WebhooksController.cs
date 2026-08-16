using HireWise.Api.DTOs.Common;
using HireWise.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HireWise.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WebhooksController : ControllerBase
{
    private readonly IClerkWebhookService _webhookService;
    private readonly ILogger<WebhooksController> _logger;

    public WebhooksController(IClerkWebhookService webhookService, ILogger<WebhooksController> logger)
    {
        _webhookService = webhookService;
        _logger = logger;
    }

    [HttpPost("clerk")]
    public async Task<IActionResult> HandleClerkWebhook(CancellationToken ct)
    {
        using var reader = new StreamReader(Request.Body);
        var payload = await reader.ReadToEndAsync(ct);

        var correlationId = HttpContext.Items["CorrelationId"]?.ToString();
        _logger.LogInformation("Received Clerk webhook payload. Length: {Length}, CorrelationId: {CorrelationId}",
            payload.Length, correlationId);

        var success = await _webhookService.HandleWebhookAsync(payload, Request.Headers, ct);

        if (!success)
        {
            return BadRequest(ApiResponse<object>.Fail("Failed to process webhook event", correlationId));
        }

        return Ok(new { received = true });
    }
}
