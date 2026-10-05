# ADR-0001: Polyglot Monorepo Architecture

> **Status:** Accepted  
> **Date:** 2026-09-18  
> **Deciders:** System Architecture Team  

---

## Context

The HireWise platform encompasses multiple distinct components:
- Core business logic and REST persistence (ASP.NET Core 8 / C#)
- Deterministic AI agent workflows and LLM orchestration (Python 3.11 / FastAPI / LangGraph)
- Modern recruiter/interviewer administrative web portal (TypeScript / React 18 / Vite)
- Dedicated cross-platform candidate client (Dart / Flutter 3.x)
- Infrastructure-as-code and cloud deployment automation (Terraform / Docker)

We required a repository organization strategy that balances developer velocity, cross-service coordination, unified versioning, and independent deployability.

## Decision

We chose a **polyglot monorepo structure** organized under `apps/`, `infrastructure/`, and `docker/`:

```
/
├── apps/
│   ├── api/             # ASP.NET Core 8 Web API
│   ├── ai-service/      # Python FastAPI + LangGraph Service
│   ├── web/             # React 18 + Vite Web Client
│   └── mobile/          # Flutter 3.x Mobile Candidate Client
├── docker/              # Multi-stage Dockerfiles
├── infrastructure/      # Terraform configurations
├── docs/                # Architecture, API, and Mobile Implementation Plans
├── Makefile             # Root build and test orchestrator
└── docker-compose.yml   # Full-stack local orchestration
```

## Consequences

### Positive
- **Atomic Cross-Service Changes**: API contract changes and consuming client updates (React and Flutter) can be committed and reviewed in single pull requests.
- **Single Source of Truth**: Unified issue tracking, PR reviews, documentation, and configuration across the entire system.
- **Simplified Local Development**: A single `docker compose up` brings up the entire ecosystem with database, cache, and services ready.

### Negative / Trade-offs
- CI workflows must use path filters (`paths:` in GitHub Actions) to avoid running unnecessary test suites across unaffected services.
- Multi-language toolchains (.NET SDK, Node.js, Python, Flutter SDK) must be available on full-stack developer workstations or provided via containers.
