namespace HireWise.Api.Middleware;

public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Add security response headers
        context.Response.OnStarting(() =>
        {
            var headers = context.Response.Headers;

            if (!headers.ContainsKey("X-Content-Type-Options"))
            {
                headers["X-Content-Type-Options"] = "nosniff";
            }

            if (!headers.ContainsKey("X-Frame-Options"))
            {
                headers["X-Frame-Options"] = "DENY";
            }

            if (!headers.ContainsKey("X-XSS-Protection"))
            {
                headers["X-XSS-Protection"] = "1; mode=block";
            }

            if (!headers.ContainsKey("Referrer-Policy"))
            {
                headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
            }

            if (!headers.ContainsKey("Permissions-Policy"))
            {
                headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=(), payment=()";
            }

            return Task.CompletedTask;
        });

        await _next(context);
    }
}
