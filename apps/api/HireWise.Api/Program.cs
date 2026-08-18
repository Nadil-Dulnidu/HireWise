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
using HireWise.Api.Validators.Users;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

// 0. Load .env file (traverses current and parent directories)
DotNetEnv.Env.TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

// 1. Serilog Setup
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] ({CorrelationId}) {Message:lj}{NewLine}{Exception}")
    .WriteTo.File("logs/hirewise-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// 2. Database Context
var rawConnectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? builder.Configuration["DATABASE_URL"]
    ?? builder.Configuration["ConnectionStrings__DefaultConnection"]
    ?? "Host=localhost;Database=hirewise_db;Username=postgres;Password=postgres";

var connectionString = ParseConnectionString(rawConnectionString);

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(3);
    }));

// 3. Authentication & Clerk JWT Configuration
var clerkAuthority = builder.Configuration["Clerk:Authority"]
    ?? builder.Configuration["CLERK_AUTHORITY"]
    ?? builder.Configuration["Clerk__Authority"]
    ?? "https://clerk.hirewise.dev";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = clerkAuthority;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = !builder.Environment.IsDevelopment() 
                || !string.IsNullOrEmpty(builder.Configuration["Clerk:Authority"]) 
                || !string.IsNullOrEmpty(builder.Configuration["CLERK_AUTHORITY"]),
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
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
builder.Services.AddScoped<HireWise.Api.Services.Storage.IStorageService, HireWise.Api.Services.Storage.LocalStorageService>();
builder.Services.AddScoped<IResumeService, ResumeService>();
builder.Services.AddScoped<IApplicationService, ApplicationService>();
builder.Services.AddHttpClient<HireWise.Api.Services.Ai.IAiServiceClient, HireWise.Api.Services.Ai.AiServiceClient>();
builder.Services.AddScoped<IClerkWebhookService, ClerkWebhookService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IInterviewService, InterviewService>();
builder.Services.AddScoped<IInterviewFeedbackService, InterviewFeedbackService>();
builder.Services.AddScoped<IAvailabilityService, AvailabilityService>();

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
        : new[] { "http://localhost:5173", "http://localhost:3000", "http://localhost:4173" });

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendCorsPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
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

app.Run();

// Helper method to parse PostgreSQL URIs or standard ADO.NET connection strings
static string ParseConnectionString(string connectionStringOrUrl)
{
    if (string.IsNullOrWhiteSpace(connectionStringOrUrl))
        return connectionStringOrUrl;

    if (connectionStringOrUrl.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
        connectionStringOrUrl.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
    {
        try
        {
            var uri = new Uri(connectionStringOrUrl);
            var userInfo = uri.UserInfo.Split(':');
            var username = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : string.Empty;
            var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty;
            var database = uri.AbsolutePath.TrimStart('/');
            var port = uri.Port > 0 ? uri.Port : 5432;
            var host = uri.Host;

            var npgsqlBuilder = new Npgsql.NpgsqlConnectionStringBuilder
            {
                Host = host,
                Port = port,
                Database = database,
                Username = username,
                Password = password
            };

            return npgsqlBuilder.ConnectionString;
        }
        catch
        {
            return connectionStringOrUrl;
        }
    }

    return connectionStringOrUrl;
}
