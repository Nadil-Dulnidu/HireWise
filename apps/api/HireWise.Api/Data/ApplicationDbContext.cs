using HireWise.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HireWise.Api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Job> Jobs => Set<Job>();
    public DbSet<Resume> Resumes => Set<Resume>();
    public DbSet<Application> Applications => Set<Application>();
    public DbSet<Interview> Interviews => Set<Interview>();
    public DbSet<InterviewFeedback> InterviewFeedbacks => Set<InterviewFeedback>();
    public DbSet<InterviewQuestion> InterviewQuestions => Set<InterviewQuestion>();
    public DbSet<AvailabilitySlot> AvailabilitySlots => Set<AvailabilitySlot>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AiWorkflow> AiWorkflows => Set<AiWorkflow>();
    public DbSet<AiWorkflowStep> AiWorkflowSteps => Set<AiWorkflowStep>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Global Query Filter for Soft Delete
        modelBuilder.Entity<User>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Company>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Department>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Job>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Resume>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Application>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Interview>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<InterviewFeedback>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<InterviewQuestion>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<AvailabilitySlot>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Notification>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<AiWorkflow>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<AiWorkflowStep>().HasQueryFilter(e => !e.IsDeleted);

        // User indexes & constraints
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.ClerkUserId).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Role).HasConversion<string>();
            entity.Property(e => e.Status).HasConversion<string>();

            entity.HasOne(e => e.Company)
                .WithMany(c => c.Employees)
                .HasForeignKey(e => e.CompanyId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Company
        modelBuilder.Entity<Company>(entity =>
        {
            entity.HasIndex(e => e.Name);
            entity.HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Department
        modelBuilder.Entity<Department>(entity =>
        {
            entity.HasOne(e => e.Company)
                .WithMany(c => c.Departments)
                .HasForeignKey(e => e.CompanyId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Job
        modelBuilder.Entity<Job>(entity =>
        {
            entity.Property(e => e.Status).HasConversion<string>();
            entity.Property(e => e.EmploymentType).HasConversion<string>();
            entity.Property(e => e.ExperienceLevel).HasConversion<string>();

            entity.HasOne(e => e.Company)
                .WithMany(c => c.Jobs)
                .HasForeignKey(e => e.CompanyId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Department)
                .WithMany(d => d.Jobs)
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Resume
        modelBuilder.Entity<Resume>(entity =>
        {
            entity.HasOne(e => e.Candidate)
                .WithMany(u => u.Resumes)
                .HasForeignKey(e => e.CandidateId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Application (Unique candidate per job rule)
        modelBuilder.Entity<Application>(entity =>
        {
            entity.HasIndex(e => new { e.JobId, e.CandidateId }).IsUnique();
            entity.Property(e => e.Status).HasConversion<string>();

            entity.HasOne(e => e.Job)
                .WithMany(j => j.Applications)
                .HasForeignKey(e => e.JobId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Candidate)
                .WithMany(u => u.Applications)
                .HasForeignKey(e => e.CandidateId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.AiWorkflow)
                .WithOne(w => w.Application)
                .HasForeignKey<AiWorkflow>(w => w.ApplicationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Interview
        modelBuilder.Entity<Interview>(entity =>
        {
            entity.Property(e => e.Status).HasConversion<string>();

            entity.HasOne(e => e.Application)
                .WithOne(a => a.Interview)
                .HasForeignKey<Interview>(e => e.ApplicationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Interviewer)
                .WithMany(u => u.AssignedInterviews)
                .HasForeignKey(e => e.InterviewerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Candidate)
                .WithMany()
                .HasForeignKey(e => e.CandidateId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Job)
                .WithMany()
                .HasForeignKey(e => e.JobId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Interview Feedback
        modelBuilder.Entity<InterviewFeedback>(entity =>
        {
            entity.Property(e => e.Recommendation).HasConversion<string>();

            entity.HasOne(e => e.Interview)
                .WithOne(i => i.Feedback)
                .HasForeignKey<InterviewFeedback>(e => e.InterviewId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Interviewer)
                .WithMany(u => u.SubmittedFeedbacks)
                .HasForeignKey(e => e.InterviewerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Interview Questions
        modelBuilder.Entity<InterviewQuestion>(entity =>
        {
            entity.Property(e => e.Category).HasConversion<string>();
            entity.Property(e => e.DifficultyLevel).HasConversion<string>();

            entity.HasOne(e => e.Interview)
                .WithMany(i => i.Questions)
                .HasForeignKey(e => e.InterviewId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Availability Slot
        modelBuilder.Entity<AvailabilitySlot>(entity =>
        {
            entity.HasOne(e => e.User)
                .WithMany(u => u.AvailabilitySlots)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Notification
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.Property(e => e.Type).HasConversion<string>();

            entity.HasOne(e => e.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Ai Workflow
        modelBuilder.Entity<AiWorkflow>(entity =>
        {
            entity.Property(e => e.Status).HasConversion<string>();
            entity.Property(e => e.PlanJson).HasColumnType("jsonb");
            entity.Property(e => e.CompletedStepsJson).HasColumnType("jsonb");
            entity.Property(e => e.ErrorStateJson).HasColumnType("jsonb");
            entity.Property(e => e.FinalResultJson).HasColumnType("jsonb");
        });

        // Ai Workflow Step
        modelBuilder.Entity<AiWorkflowStep>(entity =>
        {
            entity.Property(e => e.Status).HasConversion<string>();
            entity.Property(e => e.ApprovalStatus).HasConversion<string>();
            entity.Property(e => e.InputJson).HasColumnType("jsonb");
            entity.Property(e => e.OutputJson).HasColumnType("jsonb");
            entity.Property(e => e.ValidationResultJson).HasColumnType("jsonb");

            entity.HasOne(e => e.Workflow)
                .WithMany(w => w.Steps)
                .HasForeignKey(e => e.WorkflowId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.ApprovedByUser)
                .WithMany()
                .HasForeignKey(e => e.ApprovedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Audit Log
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.Property(e => e.OldValuesJson).HasColumnType("jsonb");
            entity.Property(e => e.NewValuesJson).HasColumnType("jsonb");
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.EntityType);
            entity.HasIndex(e => e.CreatedAt);
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries<BaseEntity>();

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
