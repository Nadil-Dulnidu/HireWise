using AutoMapper;
using AutoMapper.QueryableExtensions;
using HireWise.Api.Data;
using HireWise.Api.DTOs.Availability;
using HireWise.Api.DTOs.Common;
using HireWise.Api.Models;
using HireWise.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace HireWise.Api.Services;

public interface IAvailabilityService
{
    Task<List<AvailabilitySlotDto>> GetMyAvailabilityAsync(Guid userId, CancellationToken ct = default);
    Task<Result<AvailabilitySlotDto>> CreateAvailabilitySlotAsync(Guid userId, CreateAvailabilitySlotRequest request, CancellationToken ct = default);
    Task<Result<List<AvailabilitySlotDto>>> BulkCreateSlotsAsync(Guid userId, BulkCreateAvailabilityRequest request, CancellationToken ct = default);
    Task<Result<AvailabilitySlotDto>> UpdateAvailabilitySlotAsync(Guid slotId, Guid userId, UpdateAvailabilitySlotRequest request, CancellationToken ct = default);
    Task<Result> DeleteAvailabilitySlotAsync(Guid slotId, Guid userId, CancellationToken ct = default);
    Task<Result<List<AvailabilitySlotDto>>> GetInterviewerAvailabilityAsync(Guid interviewerId, Guid recruiterCompanyId, CancellationToken ct = default);
}

public class AvailabilityService : IAvailabilityService
{
    private readonly ApplicationDbContext _db;
    private readonly IMapper _mapper;
    private readonly ILogger<AvailabilityService> _logger;

    public AvailabilityService(
        ApplicationDbContext db,
        IMapper mapper,
        ILogger<AvailabilityService> logger)
    {
        _db = db;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<List<AvailabilitySlotDto>> GetMyAvailabilityAsync(Guid userId, CancellationToken ct = default)
    {
        return await _db.AvailabilitySlots
            .Include(s => s.User)
            .Where(s => s.UserId == userId)
            .OrderBy(s => s.DayOfWeek)
            .ThenBy(s => s.StartTime)
            .ProjectTo<AvailabilitySlotDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);
    }

    public async Task<Result<AvailabilitySlotDto>> CreateAvailabilitySlotAsync(Guid userId, CreateAvailabilitySlotRequest request, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user == null)
        {
            return Result<AvailabilitySlotDto>.NotFound("User not found.");
        }

        var slot = new AvailabilitySlot
        {
            UserId = userId,
            DayOfWeek = request.DayOfWeek,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Timezone = request.Timezone ?? "UTC",
            IsRecurring = request.IsRecurring,
            SpecificDate = request.SpecificDate
        };

        _db.AvailabilitySlots.Add(slot);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Availability slot {SlotId} created for user {UserId}", slot.Id, userId);

        var dto = await _db.AvailabilitySlots
            .Include(s => s.User)
            .Where(s => s.Id == slot.Id)
            .ProjectTo<AvailabilitySlotDto>(_mapper.ConfigurationProvider)
            .FirstAsync(ct);

        return Result<AvailabilitySlotDto>.Success(dto, 201);
    }

    public async Task<Result<List<AvailabilitySlotDto>>> BulkCreateSlotsAsync(Guid userId, BulkCreateAvailabilityRequest request, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user == null)
        {
            return Result<List<AvailabilitySlotDto>>.NotFound("User not found.");
        }

        var newSlots = request.Slots.Select(r => new AvailabilitySlot
        {
            UserId = userId,
            DayOfWeek = r.DayOfWeek,
            StartTime = r.StartTime,
            EndTime = r.EndTime,
            Timezone = r.Timezone ?? "UTC",
            IsRecurring = r.IsRecurring,
            SpecificDate = r.SpecificDate
        }).ToList();

        _db.AvailabilitySlots.AddRange(newSlots);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("{Count} availability slots created in bulk for user {UserId}", newSlots.Count, userId);

        var ids = newSlots.Select(s => s.Id).ToList();
        var dtos = await _db.AvailabilitySlots
            .Include(s => s.User)
            .Where(s => ids.Contains(s.Id))
            .OrderBy(s => s.DayOfWeek)
            .ThenBy(s => s.StartTime)
            .ProjectTo<AvailabilitySlotDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);

        return Result<List<AvailabilitySlotDto>>.Success(dtos, 201);
    }

    public async Task<Result<AvailabilitySlotDto>> UpdateAvailabilitySlotAsync(Guid slotId, Guid userId, UpdateAvailabilitySlotRequest request, CancellationToken ct = default)
    {
        var slot = await _db.AvailabilitySlots
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == slotId, ct);

        if (slot == null)
        {
            return Result<AvailabilitySlotDto>.NotFound("Availability slot not found.");
        }

        if (slot.UserId != userId)
        {
            return Result<AvailabilitySlotDto>.Forbidden("You can only modify your own availability slots.");
        }

        if (request.DayOfWeek.HasValue) slot.DayOfWeek = request.DayOfWeek.Value;
        if (request.StartTime.HasValue) slot.StartTime = request.StartTime.Value;
        if (request.EndTime.HasValue) slot.EndTime = request.EndTime.Value;
        if (!string.IsNullOrEmpty(request.Timezone)) slot.Timezone = request.Timezone;
        if (request.IsRecurring.HasValue) slot.IsRecurring = request.IsRecurring.Value;
        if (request.SpecificDate.HasValue) slot.SpecificDate = request.SpecificDate.Value;

        await _db.SaveChangesAsync(ct);

        var dto = _mapper.Map<AvailabilitySlotDto>(slot);
        return Result<AvailabilitySlotDto>.Success(dto);
    }

    public async Task<Result> DeleteAvailabilitySlotAsync(Guid slotId, Guid userId, CancellationToken ct = default)
    {
        var slot = await _db.AvailabilitySlots
            .FirstOrDefaultAsync(s => s.Id == slotId, ct);

        if (slot == null)
        {
            return Result.NotFound("Availability slot not found.");
        }

        if (slot.UserId != userId)
        {
            return Result.Forbidden("You can only delete your own availability slots.");
        }

        slot.IsDeleted = true;
        slot.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return Result.Success();
    }

    public async Task<Result<List<AvailabilitySlotDto>>> GetInterviewerAvailabilityAsync(Guid interviewerId, Guid recruiterCompanyId, CancellationToken ct = default)
    {
        var interviewer = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == interviewerId && u.Role == UserRole.INTERVIEWER && u.CompanyId == recruiterCompanyId, ct);

        if (interviewer == null)
        {
            return Result<List<AvailabilitySlotDto>>.NotFound("Interviewer not found or does not belong to your company.");
        }

        var slots = await _db.AvailabilitySlots
            .Include(s => s.User)
            .Where(s => s.UserId == interviewerId)
            .OrderBy(s => s.DayOfWeek)
            .ThenBy(s => s.StartTime)
            .ProjectTo<AvailabilitySlotDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);

        return Result<List<AvailabilitySlotDto>>.Success(slots);
    }
}
