using HireWise.Api.Data;
using HireWise.Api.DTOs.AgentConfig;
using HireWise.Api.DTOs.Common;
using HireWise.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HireWise.Api.Services;

public class AgentConfigService : IAgentConfigService
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<AgentConfigService> _logger;

    public AgentConfigService(ApplicationDbContext db, ILogger<AgentConfigService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public static List<AgentConfig> GetDefaultConfigs() => new()
    {
        new AgentConfig
        {
            AgentKey = "job_analysis",
            Name = "Job Description Analysis Agent",
            Description = "Extracts structured specifications, required skills, domains, and responsibilities from raw job postings.",
            Model = "gemini-3.5-flash",
            SystemPrompt = @"You are an expert Technical Recruiter and Talent Acquisition Specialist.
Your task is to analyze job postings and extract high-fidelity structured specifications.

Carefully evaluate the job title, description, and requirements:
1. Identify all mandatory/required technical and professional skills.
2. Identify preferred or nice-to-have skills.
3. Determine the minimum years of relevant experience required.
4. Determine the expected education level or field of study.
5. Identify the core technical domains (e.g., Backend, Frontend, Cloud, DevOps, Machine Learning, Security).
6. Summarize the key responsibilities into distinct actionable bullet points.

Always produce accurate, grounded, and concise output conforming strictly to the requested schema.",
            Temperature = 0.2,
            MaxTokens = 4096,
            IsActive = true
        },
        new AgentConfig
        {
            AgentKey = "resume_analysis",
            Name = "Resume Parsing & Analysis Agent",
            Description = "Parses candidate resumes and extracts structured candidate profile data with high precision.",
            Model = "gemini-3.5-flash",
            SystemPrompt = @"You are an expert Technical Resume Screener and Career Analyst.
Your task is to parse candidate resumes or career summaries and extract structured profile data with high precision.

Extract:
1. Candidate's full name (if present).
2. All technical tools, languages, frameworks, methodologies, and platforms (extracted_skills).
3. Estimated total years of relevant professional experience.
4. Education history (degrees, institutions, majors).
5. Key project highlights and notable achievements.
6. Professional certifications or credentials.
7. A concise 2-3 sentence executive summary of the candidate's core competencies.

Ground all extracted data strictly in the resume text. Do not invent or assume qualifications.",
            Temperature = 0.2,
            MaxTokens = 4096,
            IsActive = true
        },
        new AgentConfig
        {
            AgentKey = "candidate_evaluation",
            Name = "Candidate Evaluation & Ranking Agent",
            Description = "Objectively evaluates candidate profile against job specifications and produces match scores and recommendations.",
            Model = "gemini-3.5-flash",
            SystemPrompt = @"You are a Senior Technical Hiring Panelist and Assessment Expert.
Your task is to objectively evaluate a candidate's profile against the job analysis requirements.

Guidelines:
1. Compare required and preferred skills against the candidate's extracted skills to determine skill_match_percentage (0-100).
2. Compare required years of experience and seniority against candidate's experience to determine experience_match_percentage (0-100).
3. Compute an overall_match_score (0-100) reflecting holistic fit (skills, experience, domain alignment, and education).
4. List key candidate strengths aligned with the position.
5. Identify specific gaps or risks (e.g., missing mandatory tech, seniority gap).
6. Provide an actionable recommendation:
   - STRONG_HIRE: Overall score >= 85%, meets all mandatory requirements, strong depth.
   - HIRE: Overall score >= 70%, meets core requirements with minor gaps easily learned.
   - NO_HIRE: Overall score between 50-69%, missing critical required skills or experience.
   - STRONG_NO_HIRE: Overall score < 50%, completely misaligned profile.
7. Provide concise, constructive reasoning explaining the assessment.",
            Temperature = 0.2,
            MaxTokens = 4096,
            IsActive = true
        },
        new AgentConfig
        {
            AgentKey = "question_generator",
            Name = "Interview Question Generator Agent",
            Description = "Generates customized technical, behavioral, problem-solving, and project-based interview rubrics.",
            Model = "gemini-3.5-flash",
            SystemPrompt = @"You are a Principal Software Engineer and Interview Calibration Lead.
Your task is to generate tailored, highly effective technical and behavioral interview questions tailored to a specific candidate and job role.

For the candidate and role:
1. Generate TECHNICAL questions specifically probing skills claimed on their resume vs the role's stack.
2. Generate BEHAVIORAL questions probing past conflict resolution, leadership, communication, and ownership.
3. Generate PROBLEM_SOLVING questions testing real-world architectural design, debugging, or algorithmic intuition.
4. Generate PROJECT_BASED questions drilling into specific projects and claims made on the candidate's resume.

For each question provide: category, question, rationale, expected_answer_rubric, difficulty.",
            Temperature = 0.4,
            MaxTokens = 4096,
            IsActive = true
        },
        new AgentConfig
        {
            AgentKey = "scheduling",
            Name = "Scheduling Reasoning Agent",
            Description = "Evaluates candidate and interviewer availability constraints and provides slot reasoning.",
            Model = "gemini-3.5-flash-lite",
            SystemPrompt = @"You are an Executive Recruitment Operations Coordinator.
Your task is to analyze candidate and interviewer availability constraints, explain recommended interview windows, and highlight any scheduling trade-offs, timezone differences, or conflicts.

Provide a clear, professional 2-3 sentence explanation summarizing the proposed scheduling slots.",
            Temperature = 0.1,
            MaxTokens = 2048,
            IsActive = true
        },
        new AgentConfig
        {
            AgentKey = "validation",
            Name = "Validation & Guardrails Agent",
            Description = "Validates agent artifacts against schema constraints, detects hallucinations, and ensures compliance.",
            Model = "gemini-3.5-flash-lite",
            SystemPrompt = @"You are an AI Quality Assurance and Guardrails Specialist.
Your task is to review recruitment evaluations and interview questions for adherence to anti-bias standards, hallucination mitigation, and strict JSON output schemas.",
            Temperature = 0.0,
            MaxTokens = 2048,
            IsActive = true
        }
    };

    public async Task EnsureSeededAsync(CancellationToken ct = default)
    {
        if (!await _db.AgentConfigs.AnyAsync(ct))
        {
            _logger.LogInformation("Seeding default agent configs...");
            var defaults = GetDefaultConfigs();
            _db.AgentConfigs.AddRange(defaults);
            await _db.SaveChangesAsync(ct);
            _logger.LogInformation("Seeded {Count} default agent configs.", defaults.Count);
        }
    }

    public async Task<Result<List<AgentConfigDto>>> GetAllAsync(CancellationToken ct = default)
    {
        await EnsureSeededAsync(ct);

        var configs = await _db.AgentConfigs
            .OrderBy(c => c.CreatedAt)
            .Select(c => MapToDto(c))
            .ToListAsync(ct);

        return Result<List<AgentConfigDto>>.Success(configs);
    }

    public async Task<Result<AgentConfigDto>> GetByKeyAsync(string agentKey, CancellationToken ct = default)
    {
        await EnsureSeededAsync(ct);

        var config = await _db.AgentConfigs
            .FirstOrDefaultAsync(c => c.AgentKey.ToLower() == agentKey.ToLower(), ct);

        if (config == null)
        {
            return Result<AgentConfigDto>.NotFound($"Agent config for '{agentKey}' not found.");
        }

        return Result<AgentConfigDto>.Success(MapToDto(config));
    }

    public async Task<Result<AgentConfigDto>> UpdateAsync(Guid id, UpdateAgentConfigRequest request, CancellationToken ct = default)
    {
        var config = await _db.AgentConfigs.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (config == null)
        {
            return Result<AgentConfigDto>.NotFound("Agent config not found.");
        }

        if (!string.IsNullOrWhiteSpace(request.Model))
            config.Model = request.Model.Trim();

        if (request.SystemPrompt != null)
            config.SystemPrompt = request.SystemPrompt;

        if (request.Temperature.HasValue)
            config.Temperature = Math.Clamp(request.Temperature.Value, 0.0, 2.0);

        if (request.MaxTokens.HasValue)
            config.MaxTokens = Math.Clamp(request.MaxTokens.Value, 128, 32768);

        if (request.IsActive.HasValue)
            config.IsActive = request.IsActive.Value;

        config.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Updated agent config for {AgentKey} ({Id})", config.AgentKey, config.Id);

        return Result<AgentConfigDto>.Success(MapToDto(config));
    }

    public async Task<Result<List<AgentConfigDto>>> ResetToDefaultsAsync(CancellationToken ct = default)
    {
        var defaults = GetDefaultConfigs();
        var existingConfigs = await _db.AgentConfigs.ToListAsync(ct);

        foreach (var def in defaults)
        {
            var existing = existingConfigs.FirstOrDefault(c => c.AgentKey.Equals(def.AgentKey, StringComparison.OrdinalIgnoreCase));
            if (existing != null)
            {
                existing.Name = def.Name;
                existing.Description = def.Description;
                existing.Model = def.Model;
                existing.SystemPrompt = def.SystemPrompt;
                existing.Temperature = def.Temperature;
                existing.MaxTokens = def.MaxTokens;
                existing.IsActive = def.IsActive;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _db.AgentConfigs.Add(def);
            }
        }

        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Reset all agent configs to default values.");

        return await GetAllAsync(ct);
    }

    private static AgentConfigDto MapToDto(AgentConfig c) => new()
    {
        Id = c.Id,
        AgentKey = c.AgentKey,
        Name = c.Name,
        Description = c.Description,
        Model = c.Model,
        SystemPrompt = c.SystemPrompt,
        Temperature = c.Temperature,
        MaxTokens = c.MaxTokens,
        IsActive = c.IsActive,
        UpdatedAt = c.UpdatedAt
    };
}
