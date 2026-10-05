using Microsoft.EntityFrameworkCore;

namespace HireWise.Api.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(ApplicationDbContext db, ILogger logger, CancellationToken ct = default)
    {
        try
        {
            logger.LogInformation("Checking database schema and applying migrations...");

            // Ensure database is created/migrated
            await db.Database.MigrateAsync(ct);

            logger.LogInformation("Database initialization and schema migration complete.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error occurred during database initialization / migration");
            throw;
        }
    }
}

