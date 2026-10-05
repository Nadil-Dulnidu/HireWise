using System.Security.Claims;
using System.Text.Json.Serialization;
using AspNetCoreRateLimit;
using DotNetEnv;
using FluentValidation;
using FluentValidation.AspNetCore;
using HireWise.Api.Data;
using HireWise.Api.Hubs;
using HireWise.Api.Middleware;
using HireWise.Api.Services;
using HireWise.Api.Services.Integrations;
using HireWise.Api.Validators.Users;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Resend;
using Serilog;

// 0. Load .env file (traverses current and parent directories)
DotNetEnv.Env.TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

// Ensure Kestrel binds to configured URLs/ports (Cloud Run port 8080, Docker, or fallback 5101)
var configuredPort = Environment.GetEnvironmentVariable("PORT")
    ?? Environment.GetEnvironmentVariable("ASPNETCORE_HTTP_PORTS");
var bindUrl = Environment.GetEnvironmentVariable("ASPNETCORE_URLS")
    ?? (!string.IsNullOrWhiteSpace(configuredPort) ? $"http://0.0.0.0:{configuredPort}" : "http://0.0.0.0:5101");
builder.WebHost.UseUrls(bindUrl);

// 1. Serilog Setup
Serilog.Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Application", "HireWise.Api")
    .Enrich.WithProperty("Environment", builder.Environment.EnvironmentName)
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] ({CorrelationId}) [{UserRole}:{ClerkUserId}] {Message:lj}{NewLine}{Exception}")
    .WriteTo.File("logs/hirewise-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// 2. Database Context
var candidateConnectionStrings = new[]
{
    builder.Configuration["DATABASE_URL"],
    builder.Configuration["ConnectionStrings__DefaultConnection"],
    builder.Configuration.GetConnectionString("DefaultConnection"),
    Environment.GetEnvironmentVariable("DATABASE_URL"),
    Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
};

var rawConnectionString = candidateConnectionStrings.FirstOrDefault(s => !string.IsNullOrWhiteSpace(s))
    ?? "Host=localhost;Database=hirewise_db;Username=postgres;Password=postgres";

var connectionString = ParseConnectionString(rawConnectionString);

try
{
    var csb = new Npgsql.NpgsqlConnectionStringBuilder(connectionString);
    Serilog.Log.Information("Configured database target: Host={Host};Port={Port};Database={Database};Username={Username};SslMode={SslMode}",
        csb.Host, csb.Port, csb.Database, csb.Username, csb.SslMode);
}
catch
{
    // Ignore logging errors if builder cannot inspect
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(3);
    }));

// 3. Authentication & Clerk JWT Configuration
var clerkAuthority = Environment.GetEnvironmentVariable("CLERK_AUTHORITY")
    ?? builder.Configuration["CLERK_AUTHORITY"]
    ?? builder.Configuration["Clerk:Authority"]
    ?? builder.Configuration["Clerk__Authority"]
    ?? "https://helping-anemone-4730.clerk.accounts.dev";

var jwksResolver = new ClerkJwksResolver(clerkAuthority);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = clerkAuthority;
        options.RequireHttpsMetadata = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = !builder.Environment.IsDevelopment()
                || !string.IsNullOrEmpty(builder.Configuration["Clerk:Authority"])
                || !string.IsNullOrEmpty(builder.Configuration["CLERK_AUTHORITY"]),
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKeyResolver = jwksResolver.ResolveSigningKeys,
            NameClaimType = ClaimTypes.NameIdentifier,
            RoleClaimType = ClaimTypes.Role
        };

        // Allow SignalR to read access_token from query string
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            },
            OnAuthenticationFailed = context =>
            {
                var logger = context.HttpContext.RequestServices.GetService<ILogger<Program>>();
                logger?.LogWarning("JWT Authentication failed for request to {Path}: {Error}",
                    context.HttpContext.Request.Path, context.Exception.Message);
                return Task.CompletedTask;
            }
        };
    });

// 4. Role Authorization Policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("ADMIN"));
    options.AddPolicy("RecruiterOnly", policy => policy.RequireRole("RECRUITER"));
    options.AddPolicy("InterviewerOnly", policy => policy.RequireRole("INTERVIEWER"));
    options.AddPolicy("CandidateOnly", policy => policy.RequireRole("CANDIDATE"));
    options.AddPolicy("StaffOnly", policy => policy.RequireRole("ADMIN", "RECRUITER", "INTERVIEWER"));
});

// 5. Dependency Injection Services
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ICompanyService, CompanyService>();
builder.Services.AddScoped<IDepartmentService, DepartmentService>();
builder.Services.AddScoped<IJobService, JobService>();
var storageProvider = builder.Configuration["Storage:Provider"]
    ?? builder.Configuration["STORAGE_PROVIDER"]
    ?? "LocalStorage";

if (string.Equals(storageProvider, "GoogleCloudStorage", StringComparison.OrdinalIgnoreCase)
    || string.Equals(storageProvider, "Gcp", StringComparison.OrdinalIgnoreCase)
    || string.Equals(storageProvider, "Gcs", StringComparison.OrdinalIgnoreCase))
{
    builder.Services.AddScoped<HireWise.Api.Services.Storage.IStorageService, HireWise.Api.Services.Storage.GoogleCloudStorageService>();
}
else
{
    builder.Services.AddScoped<HireWise.Api.Services.Storage.IStorageService, HireWise.Api.Services.Storage.LocalStorageService>();
}
builder.Services.AddScoped<IResumeService, ResumeService>();
builder.Services.AddScoped<IApplicationService, ApplicationService>();
builder.Services.AddHttpClient<HireWise.Api.Services.Ai.IAiServiceClient, HireWise.Api.Services.Ai.AiServiceClient>();
builder.Services.AddScoped<IClerkWebhookService, ClerkWebhookService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IInterviewService, InterviewService>();
builder.Services.AddScoped<IInterviewFeedbackService, InterviewFeedbackService>();
builder.Services.AddScoped<IAvailabilityService, AvailabilityService>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();
builder.Services.AddHttpClient<IClerkSyncService, ClerkSyncService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
builder.Services.AddScoped<IPlatformSettingsService, PlatformSettingsService>();

// Integrations (Email - Resend)
var resendApiKey = builder.Configuration["RESEND_API_KEY"]
    ?? builder.Configuration["Resend:ApiKey"]
    ?? "re_placeholder_key";

builder.Services.AddOptions<ResendClientOptions>().Configure(options =>
{
    options.ApiToken = resendApiKey;
});
builder.Services.AddHttpClient<IResend, ResendClient>();

builder.Services.AddScoped<IEmailService, EmailService>();

// AutoMapper & FluentValidation
builder.Services.AddAutoMapper(cfg => cfg.AddProfile<HireWise.Api.Mappings.MappingProfile>());
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<UpdateProfileRequestValidator>();
builder.Services.AddValidatorsFromAssemblyContaining<HireWise.Api.Validators.Applications.ApplyJobRequestValidator>();
builder.Services.AddValidatorsFromAssemblyContaining<HireWise.Api.Validators.Interviews.CreateInterviewRequestValidator>();
builder.Services.AddValidatorsFromAssemblyContaining<HireWise.Api.Validators.Availability.CreateAvailabilitySlotRequestValidator>();

// SignalR
builder.Services.AddSignalR();

// 6. Rate Limiting Configuration
builder.Services.AddMemoryCache();
builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("IpRateLimiting"));
builder.Services.Configure<IpRateLimitPolicies>(builder.Configuration.GetSection("IpRateLimitPolicies"));
builder.Services.AddInMemoryRateLimiting();
builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();

// 7. CORS
var allowedOriginsConfig = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
var allowedOriginsEnv = builder.Configuration["CORS_ALLOWED_ORIGINS"]
    ?? builder.Configuration["Cors__AllowedOrigins"];

var allowedOrigins = (allowedOriginsConfig != null && allowedOriginsConfig.Length > 0)
    ? allowedOriginsConfig
    : (allowedOriginsEnv != null
        ? allowedOriginsEnv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        : new[] {
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:4173",
            "https://hirewise-prod-web-pofxtzi7yq-uc.a.run.app"
        });

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendCorsPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .SetIsOriginAllowed(origin =>
              {
                  if (string.IsNullOrEmpty(origin)) return false;
                  // Allow localhost, custom configured domains, and Cloud Run production web services
                  return origin.StartsWith("http://localhost:") ||
                         origin.StartsWith("https://localhost:") ||
                         origin.EndsWith(".run.app") ||
                         allowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase);
              })
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 8. Controllers & JSON Options
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

// 9. Swagger / OpenAPI Setup with JWT Support
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "HireWise Business API",
        Version = "v1",
        Description = "Authoritative Business & Recruitment Lifecycle API for HireWise Platform"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below. Example: 'Bearer 12345abcdef'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// 10. HTTP Pipeline
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseMiddleware<GlobalExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "HireWise API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseIpRateLimiting();
app.UseCors("FrontendCorsPolicy");
app.UseStaticFiles();

var uploadsDir = Path.Combine(builder.Environment.ContentRootPath, "uploads");
if (!Directory.Exists(uploadsDir))
{
    Directory.CreateDirectory(uploadsDir);
}
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsDir),
    RequestPath = "/uploads"
});

app.UseAuthentication();
app.UseMiddleware<UserContextMiddleware>();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

// Database Migration & Seed Pipeline on Startup
var applyMigrations = app.Configuration.GetValue<bool>("Database:ApplyMigrationsOnStartup", false)
    || app.Configuration.GetValue<bool>("DATABASE_APPLY_MIGRATIONS_ON_STARTUP", false);

if (applyMigrations)
{
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await DbInitializer.InitializeAsync(db, app.Logger);
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "Could not apply automatic migrations on startup. Ensure database is running and reachable.");
    }
}

// Health check endpoint
app.MapGet("/api/health", async (ApplicationDbContext db) =>
{
    bool dbConnected = false;
    try
    {
        dbConnected = await db.Database.CanConnectAsync();
    }
    catch
    {
        dbConnected = false;
    }

    return Results.Ok(new
    {
        status = dbConnected ? "Healthy" : "Degraded",
        database = dbConnected ? "Connected" : "Disconnected",
        service = "HireWise.Api",
        timestamp = DateTime.UtcNow
    });
});

app.Urls.Clear();
app.Urls.Add(bindUrl);
app.Logger.LogInformation("HireWise API started and listening on: {BindUrl}", bindUrl);
app.Run();

// Helper method to parse PostgreSQL URIs or standard ADO.NET connection strings
static string ParseConnectionString(string? connectionStringOrUrl)
{
    if (string.IsNullOrWhiteSpace(connectionStringOrUrl))
    {
        return "Host=localhost;Database=hirewise_db;Username=postgres;Password=postgres";
    }

    // 1. Strip surrounding quotes and whitespace
    var conn = connectionStringOrUrl.Trim();
    while ((conn.StartsWith("\"") && conn.EndsWith("\"")) ||
           (conn.StartsWith("'") && conn.EndsWith("'")))
    {
        if (conn.Length <= 2)
            return "Host=localhost;Database=hirewise_db;Username=postgres;Password=postgres";
        conn = conn.Substring(1, conn.Length - 2).Trim();
    }

    conn = conn.Trim('"', '\'').Trim();

    if (string.IsNullOrWhiteSpace(conn))
    {
        return "Host=localhost;Database=hirewise_db;Username=postgres;Password=postgres";
    }

    // 2. Check if it contains a URI scheme (e.g. postgres://, postgresql://, postgresql+asyncpg://, etc.)
    var schemeIdx = conn.IndexOf("://", StringComparison.Ordinal);
    if (schemeIdx == -1)
    {
        // ADO.NET key-value format (e.g., Host=localhost;Port=5432;Database=...)
        try
        {
            var testBuilder = new Npgsql.NpgsqlConnectionStringBuilder(conn);
            return testBuilder.ConnectionString;
        }
        catch (Exception ex)
        {
            Serilog.Log.Warning(ex, "Direct ADO.NET parsing encountered an issue; returning raw trimmed connection string.");
            return conn;
        }
    }

    // 3. Parse URI format robustly
    try
    {
        var afterScheme = conn.Substring(schemeIdx + 3);

        // Separate query string if present (?sslmode=require&...)
        string queryString = string.Empty;
        var queryIdx = afterScheme.IndexOf('?');
        if (queryIdx != -1)
        {
            queryString = afterScheme.Substring(queryIdx + 1);
            afterScheme = afterScheme.Substring(0, queryIdx);
        }

        // Separate user credentials from host/path
        string userInfo = string.Empty;
        string hostAndPath = afterScheme;

        var slashIdx = afterScheme.IndexOf('/');
        var atIdx = slashIdx != -1 ? afterScheme.LastIndexOf('@', slashIdx) : afterScheme.LastIndexOf('@');

        if (atIdx != -1)
        {
            userInfo = afterScheme.Substring(0, atIdx);
            hostAndPath = afterScheme.Substring(atIdx + 1);
        }

        string username = "postgres";
        string password = string.Empty;

        if (!string.IsNullOrEmpty(userInfo))
        {
            var colonIdx = userInfo.IndexOf(':');
            if (colonIdx != -1)
            {
                username = Uri.UnescapeDataString(userInfo.Substring(0, colonIdx));
                password = Uri.UnescapeDataString(userInfo.Substring(colonIdx + 1));
            }
            else
            {
                username = Uri.UnescapeDataString(userInfo);
            }
        }

        string host = "localhost";
        int port = 5432;
        string database = "hirewise_db";

        slashIdx = hostAndPath.IndexOf('/');
        string hostAndPort = slashIdx != -1 ? hostAndPath.Substring(0, slashIdx) : hostAndPath;
        if (slashIdx != -1 && slashIdx + 1 < hostAndPath.Length)
        {
            database = hostAndPath.Substring(slashIdx + 1).Trim('/');
        }

        var portColonIdx = hostAndPort.LastIndexOf(':');
        if (portColonIdx != -1 && int.TryParse(hostAndPort.Substring(portColonIdx + 1), out var parsedPort))
        {
            port = parsedPort;
            host = hostAndPort.Substring(0, portColonIdx);
        }
        else if (!string.IsNullOrWhiteSpace(hostAndPort))
        {
            host = hostAndPort;
        }

        var builder = new Npgsql.NpgsqlConnectionStringBuilder
        {
            Host = host,
            Port = port,
            Database = string.IsNullOrWhiteSpace(database) ? "hirewise_db" : database,
            Username = username,
            Password = password
        };

        // Parse query string options (SSL mode, pooling, etc.)
        if (!string.IsNullOrWhiteSpace(queryString))
        {
            var queryParams = queryString.Split('&', StringSplitOptions.RemoveEmptyEntries);
            foreach (var param in queryParams)
            {
                var kv = param.Split('=', 2);
                var key = Uri.UnescapeDataString(kv[0]).Trim();
                var val = kv.Length > 1 ? Uri.UnescapeDataString(kv[1]).Trim() : string.Empty;

                if (string.Equals(key, "sslmode", StringComparison.OrdinalIgnoreCase))
                {
                    if (string.Equals(val, "require", StringComparison.OrdinalIgnoreCase))
                        builder.SslMode = Npgsql.SslMode.Require;
                    else if (string.Equals(val, "disable", StringComparison.OrdinalIgnoreCase))
                        builder.SslMode = Npgsql.SslMode.Disable;
                    else if (string.Equals(val, "prefer", StringComparison.OrdinalIgnoreCase))
                        builder.SslMode = Npgsql.SslMode.Prefer;
                    else if (string.Equals(val, "verify-full", StringComparison.OrdinalIgnoreCase))
                        builder.SslMode = Npgsql.SslMode.VerifyFull;
                    else if (string.Equals(val, "verify-ca", StringComparison.OrdinalIgnoreCase))
                        builder.SslMode = Npgsql.SslMode.VerifyCA;
                }
                else if (string.Equals(key, "trust_server_certificate", StringComparison.OrdinalIgnoreCase) ||
                         string.Equals(key, "trustservercertificate", StringComparison.OrdinalIgnoreCase))
                {
                    // Parameter handled for compatibility
                }
            }
        }

        return builder.ConnectionString;
    }
    catch (Exception ex)
    {
        Serilog.Log.Error(ex, "Failed to parse database connection string URI: {Raw}", RedactPassword(conn));
        return conn;
    }
}

static string RedactPassword(string input)
{
    if (string.IsNullOrWhiteSpace(input)) return string.Empty;
    return System.Text.RegularExpressions.Regex.Replace(input, @":([^@/:\?]+)@", ":****@");
}


public class ClerkJwksResolver
{
    private readonly HttpClient _httpClient = new();
    private readonly string _jwksUrl;
    private IList<SecurityKey>? _cachedKeys;
    private DateTime _cacheExpiresAt = DateTime.MinValue;
    private readonly SemaphoreSlim _semaphore = new(1, 1);

    public ClerkJwksResolver(string authority)
    {
        _jwksUrl = $"{authority.TrimEnd('/')}/.well-known/jwks.json";
    }

    public IEnumerable<SecurityKey> ResolveSigningKeys(string? token, SecurityToken? securityToken, string? kid, TokenValidationParameters? validationParameters)
    {
        if (_cachedKeys != null && DateTime.UtcNow < _cacheExpiresAt)
        {
            if (string.IsNullOrEmpty(kid)) return _cachedKeys;
            var matched = _cachedKeys.Where(k => k.KeyId == kid).ToList();
            if (matched.Count > 0) return matched;
        }

        _semaphore.Wait();
        try
        {
            if (_cachedKeys != null && DateTime.UtcNow < _cacheExpiresAt)
            {
                if (string.IsNullOrEmpty(kid)) return _cachedKeys;
                var matched = _cachedKeys.Where(k => k.KeyId == kid).ToList();
                if (matched.Count > 0) return matched;
            }

            var json = _httpClient.GetStringAsync(_jwksUrl).GetAwaiter().GetResult();
            var jwks = new JsonWebKeySet(json);
            _cachedKeys = jwks.GetSigningKeys();
            _cacheExpiresAt = DateTime.UtcNow.AddMinutes(30);

            if (string.IsNullOrEmpty(kid)) return _cachedKeys;
            return _cachedKeys.Where(k => k.KeyId == kid);
        }
        catch (Exception ex)
        {
            Serilog.Log.Error(ex, "Failed to fetch Clerk JWKS keys from {Url}", _jwksUrl);
            return _cachedKeys ?? (IEnumerable<SecurityKey>)Array.Empty<SecurityKey>();
        }
        finally
        {
            _semaphore.Release();
        }
    }
}
