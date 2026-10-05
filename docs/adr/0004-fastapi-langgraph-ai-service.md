# ADR-0004: FastAPI & LangGraph StateGraph for AI Workflows

> **Status:** Accepted  
> **Date:** 2026-09-21  
> **Deciders:** System Architecture Team, AI Guild  

---

## Context

Automated recruitment pipelines require complex multi-step reasoning:
1. Parsing unstructured job requirements and diverse resume PDFs/DOCXs.
2. Generating calibrated semantic match scores without hallucination.
3. Formulating customized interview question banks targeting specific candidate gaps.
4. Harmonizing interview schedules across external calendars.

Single-prompt LLM architectures are prone to non-deterministic failure, silent hallucinations, lack of auditability, and catastrophic failures if an LLM times out midway through execution. Furthermore, employment regulations mandate human oversight (Human-in-the-Loop) before automated candidate rejection or progression.

## Decision

We chose **FastAPI with LangGraph StateGraph** running on Python 3.11 with Google Cloud Vertex AI (Gemini 1.5 Pro and Gemini 1.5 Flash):

1. **Deterministic State Machine**:
   - The workflow is modeled as a compiled `StateGraph` with explicit nodes for each agent task and conditional edges for routing and error handling.
2. **Discrete 6-Agent Specialization**:
   - Job Analysis, Resume Analysis, Candidate Evaluation, Anti-Bias Validation, Question Generation, and Scheduling Reconciliation.
3. **Explicit Human-in-the-Loop (HITL) Gates**:
   - Execution automatically pauses at `evaluation_approval_gate` and `schedule_approval_gate`.
   - The graph state is frozen in PostgreSQL until a recruiter submits an approval decision via the REST API.
4. **Service Boundary**:
   - The AI Service operates as a private microservice (`apps/ai-service`) invoked synchronously via `POST /api/v1/workflows/start` and reporting milestone completions back to ASP.NET Core via authenticated webhooks (`/api/internal/ai-callback`).

## Consequences

### Positive
- **Guaranteed Human Oversight**: Decisions affecting candidates cannot proceed without explicit recruiter sign-off.
- **Resilient Step-Level Retries**: If a transient LLM error occurs at step 4, the workflow can retry only that step without re-running expensive steps 1–3.
- **Traceability**: Every agent input, raw prompt, and structured Pydantic output is stored in PostgreSQL `AiWorkflowSteps` for auditing.

### Negative / Trade-offs
- Introduces Python runtime dependencies and LangGraph library version pinning alongside the .NET backend.
- Managing distributed state transitions between LangGraph and EF Core requires strict webhook synchronization and idempotent status handlers.
