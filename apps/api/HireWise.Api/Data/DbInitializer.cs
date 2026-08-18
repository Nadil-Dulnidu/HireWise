using HireWise.Api.Models;
using HireWise.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace HireWise.Api.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(ApplicationDbContext db, ILogger logger, CancellationToken ct = default)
    {
        try
        {
            logger.LogInformation("Checking database schema and seed status...");

            // Ensure database is created/migrated
            await db.Database.MigrateAsync(ct);

            // 1. Seed Administrator
            var adminUser = await db.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Role == UserRole.ADMIN, ct);
            if (adminUser == null)
            {
                adminUser = new User
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    ClerkUserId = "user_admin_seed_hirewise",
                    Email = "admin@hirewise.dev",
                    FirstName = "System",
                    LastName = "Administrator",
                    Role = UserRole.ADMIN,
                    Status = UserStatus.ACTIVE,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                db.Users.Add(adminUser);
                await db.SaveChangesAsync(ct);
                logger.LogInformation("Seeded default administrator: admin@hirewise.dev");
            }

            // 2. Seed Sample Companies
            if (!await db.Companies.AnyAsync(ct))
            {
                var company1 = new Company
                {
                    Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    ClerkOrganizationId = "org_seed_cloudscale",
                    Slug = "cloudscale-technologies",
                    Name = "CloudScale Technologies",
                    Description = "Global leader in distributed cloud compute and resilient multi-region infrastructure.",
                    Website = "https://cloudscale.io",
                    Industry = "Cloud Infrastructure",
                    Size = "500-1000",
                    Location = "San Francisco, CA / Remote",
                    CreatedByUserId = adminUser.Id,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var company2 = new Company
                {
                    Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    ClerkOrganizationId = "org_seed_neuralpulse",
                    Slug = "neuralpulse-ai",
                    Name = "NeuralPulse AI",
                    Description = "Pioneering multi-agent orchestration, LLM reasoning architectures, and agentic workflows.",
                    Website = "https://neuralpulse.ai",
                    Industry = "Artificial Intelligence",
                    Size = "100-250",
                    Location = "New York, NY / Hybrid",
                    CreatedByUserId = adminUser.Id,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var company3 = new Company
                {
                    Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    ClerkOrganizationId = "org_seed_fintechgrid",
                    Slug = "fintech-grid",
                    Name = "FinTech Grid",
                    Description = "High-throughput, ultra-low-latency financial transaction settlement rails.",
                    Website = "https://fintechgrid.com",
                    Industry = "Financial Technology",
                    Size = "1000+",
                    Location = "Austin, TX / Remote",
                    CreatedByUserId = adminUser.Id,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                db.Companies.AddRange(company1, company2, company3);
                await db.SaveChangesAsync(ct);
                logger.LogInformation("Seeded 3 sample companies.");

                // 3. Seed Sample Departments
                var dept1 = new Department
                {
                    Id = Guid.NewGuid(),
                    Name = "Platform Engineering",
                    Description = "Core cloud infrastructure, Kubernetes, and developer velocity tools.",
                    CompanyId = company1.Id
                };

                var dept2 = new Department
                {
                    Id = Guid.NewGuid(),
                    Name = "Applied AI Research",
                    Description = "Multi-agent systems, fine-tuning, and structured LLM inference.",
                    CompanyId = company2.Id
                };

                var dept3 = new Department
                {
                    Id = Guid.NewGuid(),
                    Name = "Core Banking Rails",
                    Description = "Real-time ledger processing, event sourcing, and high-frequency messaging.",
                    CompanyId = company3.Id
                };

                db.Departments.AddRange(dept1, dept2, dept3);
                await db.SaveChangesAsync(ct);
                logger.LogInformation("Seeded sample departments.");

                // 4. Seed Recruiters & Interviewers for sample companies
                var recruiter1 = new User
                {
                    Id = Guid.NewGuid(),
                    ClerkUserId = "user_recruiter_cloudscale",
                    Email = "recruiter@cloudscale.io",
                    FirstName = "Jordan",
                    LastName = "Vance",
                    Role = UserRole.RECRUITER,
                    Status = UserStatus.ACTIVE,
                    CompanyId = company1.Id
                };

                var interviewer1 = new User
                {
                    Id = Guid.NewGuid(),
                    ClerkUserId = "user_interviewer_cloudscale",
                    Email = "interviewer@cloudscale.io",
                    FirstName = "Marcus",
                    LastName = "Chen",
                    Role = UserRole.INTERVIEWER,
                    Status = UserStatus.ACTIVE,
                    CompanyId = company1.Id
                };

                db.Users.AddRange(recruiter1, interviewer1);
                await db.SaveChangesAsync(ct);
                logger.LogInformation("Seeded recruiter and interviewer staff.");

                // 5. Seed Open Technical Jobs
                var job1 = new Job
                {
                    Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    Title = "Senior Full Stack Engineer (React + .NET 8)",
                    Description = "We are seeking a talented Senior Full Stack Engineer to lead the architecture of our cloud observability dashboard. You will work on high-traffic web applications using React 19, TypeScript, C# (.NET 8), and PostgreSQL.",
                    Requirements = "• 5+ years building distributed web applications\n• Strong expertise in C# / ASP.NET Core\n• Proficiency with modern React, TypeScript, and state management\n• Experience with relational database design and query optimization in PostgreSQL\n• Familiarity with Docker, CI/CD, and Cloud Run",
                    Location = "San Francisco, CA / Remote",
                    EmploymentType = EmploymentType.FULL_TIME,
                    ExperienceLevel = ExperienceLevel.SENIOR,
                    SalaryMin = 140000,
                    SalaryMax = 180000,
                    SalaryCurrency = "USD",
                    Status = JobStatus.OPEN,
                    CompanyId = company1.Id,
                    DepartmentId = dept1.Id,
                    CreatedByUserId = recruiter1.Id,
                    ApplicationDeadline = DateTime.UtcNow.AddMonths(2)
                };

                var job2 = new Job
                {
                    Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                    Title = "Staff Machine Learning Engineer (LangGraph / PyTorch)",
                    Description = "Join NeuralPulse AI to build production-grade multi-agent autonomous reasoning engines. You will design LangGraph state machines, structured schema evaluation pipelines, and optimize Vertex AI Gemini model deployments.",
                    Requirements = "• 6+ years in Machine Learning and Python backend engineering\n• Hands-on experience with LangGraph, LangChain, and structured LLM tool calling\n• Deep understanding of prompt engineering, deterministic guardrails, and validation\n• Experience deploying containerized ML services using FastAPI and GCP",
                    Location = "New York, NY / Hybrid",
                    EmploymentType = EmploymentType.FULL_TIME,
                    ExperienceLevel = ExperienceLevel.LEAD,
                    SalaryMin = 180000,
                    SalaryMax = 230000,
                    SalaryCurrency = "USD",
                    Status = JobStatus.OPEN,
                    CompanyId = company2.Id,
                    DepartmentId = dept2.Id,
                    CreatedByUserId = adminUser.Id,
                    ApplicationDeadline = DateTime.UtcNow.AddMonths(3)
                };

                var job3 = new Job
                {
                    Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                    Title = "Distributed Systems Backend Architect",
                    Description = "Architect ultra-reliable settlement backends capable of processing 50,000 transactions per second with sub-10ms latency. Experience with event sourcing, Kafka, and PostgreSQL locking models required.",
                    Requirements = "• 8+ years architecting high-scale distributed backend systems\n• Deep understanding of distributed transactions, idempotency, and concurrency\n• Mastery of C# or Go with PostgreSQL relational design\n• Experience with message streaming (Kafka, RabbitMQ)",
                    Location = "Austin, TX / Remote",
                    EmploymentType = EmploymentType.FULL_TIME,
                    ExperienceLevel = ExperienceLevel.SENIOR,
                    SalaryMin = 160000,
                    SalaryMax = 210000,
                    SalaryCurrency = "USD",
                    Status = JobStatus.OPEN,
                    CompanyId = company3.Id,
                    DepartmentId = dept3.Id,
                    CreatedByUserId = adminUser.Id,
                    ApplicationDeadline = DateTime.UtcNow.AddMonths(1)
                };

                db.Jobs.AddRange(job1, job2, job3);
                await db.SaveChangesAsync(ct);
                logger.LogInformation("Seeded 3 open technical job postings.");
            }

            logger.LogInformation("Database initialization and seed verification complete.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error occurred during database initialization / seeding");
            throw;
        }
    }
}
