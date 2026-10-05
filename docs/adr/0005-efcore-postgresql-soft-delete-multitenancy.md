# ADR-0005: EF Core Global Query Filters for Soft-Delete & Tenant Isolation

> **Status:** Accepted  
> **Date:** 2026-09-22  
> **Deciders:** Backend Architecture Guild  

---

## Context

Enterprise recruitment platforms must comply with strict data retention rules, GDPR/CCPA "right to be forgotten", accidental deletion recovery, and multi-tenant security guarantees. Specifically:
- Hard-deleting rows (jobs, applications, feedback) can corrupt relational referential integrity and destroy audit trails.
- Multi-tenant data leaks (e.g., Recruiter from Company A viewing applications for Company B) constitute severe compliance violations.
- Writing manual `WHERE is_deleted = false AND company_id = @companyId` across dozens of repository methods is error-prone.

## Decision

We implemented **EF Core Global Query Filters** and an automated **ChangeTracker Interceptor** within `ApplicationDbContext`:

1. **Global Soft-Deletion**:
   - All domain entities inherit from `BaseEntity` (`Id`, `CreatedAt`, `UpdatedAt`, `IsDeleted`, `DeletedAt`).
   - Every entity is configured in EF Core `OnModelCreating` with:
     ```csharp
     modelBuilder.Entity<TEntity>().HasQueryFilter(e => !e.IsDeleted);
     ```
   - Soft-deleted entities are automatically filtered from all queries unless explicitly queried using `.IgnoreQueryFilters()`.
2. **Automated Audit Logging**:
   - `ApplicationDbContext.SaveChangesAsync()` intercepts all added and modified entities using the EF Core `ChangeTracker`.
   - Mutating operations automatically generate immutable JSONB entries in `AuditLogs` capturing old values, new values, user IDs, and client IP addresses.
3. **Tenant Query Scoping**:
   - Tenant boundaries are enforced via `ICurrentUserService.CompanyId` in service queries, ensuring non-admin users only access records belonging to their company.

## Consequences

### Positive
- **Zero-Friction Protection**: Developers cannot accidentally query deleted records in standard LINQ queries.
- **Accidental Deletion Recovery**: Soft-deleted entities can be restored without database backups.
- **Immutable Audit Trail**: Guaranteed tracking of who modified what record and when.

### Negative / Trade-offs
- Unique database constraints (e.g., unique email or single application per job) must account for soft-deleted rows or use partial unique indexes (`WHERE is_deleted = false`).
- Database storage expands over time, requiring periodic archival policies for long-deleted records.
