namespace HireWise.Api.Services;

public interface IClerkSyncService
{
    Task<bool> SyncUserRoleAsync(string clerkUserId, string role, CancellationToken ct = default);
}
