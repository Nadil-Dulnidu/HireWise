# HireWise Backend API (`apps/api`)

> **ASP.NET Core 8 Web API** — Core business logic, multi-tenant persistence, and real-time notification hub for the HireWise recruitment automation platform.

---

## 🏛️ Architecture Overview

The API is structured as an ASP.NET Core 8 Web API within `apps/api/HireWise.Api`:

- **Controllers (`Controllers/`)**: 16 RESTful controllers providing endpoints for users, jobs, applications, resumes, interviews, AI workflows, notifications, and administrative controls.
- **Data & EF Core (`Data/`)**: `ApplicationDbContext` with PostgreSQL 16, automatic soft-delete query filtering, and automated JSONB audit logging.
- **Middleware Pipeline (`Middleware/`)**:
  - `UserContextMiddleware`: Resolves Clerk user IDs and organization scopes.
  - `GlobalExceptionMiddleware`: Translates uncaught exceptions into RFC 7807 responses.
  - `AuditLogMiddleware`: Records mutating request telemetry.
- **Real-Time Hub (`Hubs/NotificationHub.cs`)**: SignalR WebSocket hub for pushing live updates to Web and Mobile clients.

---

## 🚀 Getting Started

### Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- Running PostgreSQL 16 (or local Docker Compose)
- Running Redis 7 (optional for local dev, required for production)

### Configuration
Update `appsettings.Development.json` or configure environment variables:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=hirewise_db;Username=hirewise_user;Password=hirewise_secure_password_dev"
  },
  "Clerk": {
    "SecretKey": "sk_test_your_clerk_secret_key",
    "JwksUrl": "https://helping-anemone-4730.clerk.accounts.dev/.well-known/jwks.json"
  },
  "AiService": {
    "BaseUrl": "http://localhost:8000",
    "ApiKey": "hw_ai_service_secret_key"
  },
  "Storage": {
    "Provider": "LocalStorage"
  }
}
```

### Running Locally
```bash
cd apps/api/HireWise.Api
dotnet restore
dotnet run
```
API runs on `http://localhost:5101`.  
Explore interactive documentation at `http://localhost:5101/swagger`.

---

## 🧪 Testing

Run xUnit test suites:
```bash
cd apps/api
dotnet test --logger "console;verbosity=normal"
```

---

## 📚 Related Documentation
- [API Reference Guide](../../docs/api.md)
- [Database & ERD Documentation](../../docs/database.md)
- [Security & Tenant Isolation](../../docs/security.md)
- [Candidate Mobile Implementation Plan](../../docs/mobile/implementation_plan.md)
