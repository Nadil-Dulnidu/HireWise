# ADR-0002: Clerk Authentication & Hybrid Multi-Tenancy

> **Status:** Accepted  
> **Date:** 2026-09-19  
> **Deciders:** System Architecture Team  

---

## Context

HireWise requires a robust authentication and organization management solution that handles:
- Multi-tenant employer accounts (Recruiters, Interviewers) with role hierarchies and invitation links.
- Global candidates who create a single profile and apply to jobs across multiple companies.
- RS256 JWT cryptographic validation without hitting the identity provider on every microservice request.
- Native mobile authentication for Flutter on Android/iOS.

Building custom auth, session management, multi-factor authentication (MFA), and organization switching would consume considerable engineering effort and introduce unnecessary security risk.

## Decision

We selected **Clerk Authentication** (`@clerk/clerk-react`, `clerk_flutter`, and backend JWKS validation) paired with a **Hybrid Multi-Tenancy Data Model**:

1. **Authentication Gateway**:
   - Clerk handles user registration, passwordless OTP, Google OAuth, and session tokens.
   - The ASP.NET Core API validates incoming Bearer JWTs using Clerk's public JSON Web Key Set (JWKS) via `JwtBearerDefaults`.
2. **Hybrid Scoping Model**:
   - **Candidates**: Global scope. `CompanyId` is `null`. Candidates can discover and apply to open jobs across any tenant.
   - **Recruiters & Interviewers**: Scoped to a specific `CompanyId` via Clerk Organization (`org_id` claim in JWT).
3. **Internal Synchronization**:
   - User identity is bridged into internal PostgreSQL `Users` table on first authenticated request via `UserContextMiddleware` and Clerk webhooks.

## Consequences

### Positive
- **Enterprise-Grade Auth**: Turnkey MFA, social sign-in, session revocation, and security alerts.
- **Zero-Roundtrip Verification**: JWTs are validated locally by the API using cached JWKS public keys with sub-millisecond overhead.
- **Natural Tenant Isolation**: Recruiter access is automatically scoped to their organization without risking cross-tenant data leakage.

### Negative / Trade-offs
- Vendor lock-in on Clerk's user directory and token format.
- Mobile auth depends on `clerk_flutter` and `clerk_auth` Native SDK, requiring specific package version pinning and deep linking configuration.
