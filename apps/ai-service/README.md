# HireWise AI Service (`apps/ai-service`)

> **FastAPI & LangGraph Multi-Agent Orchestrator** — Deterministic candidate screening, resume parsing, anti-bias validation, question generation, and scheduling engine powered by Google Cloud Vertex AI (Gemini).

---

## 🏛️ Architecture Overview

The AI Service is structured using Python 3.11, FastAPI, and LangGraph:

- **StateGraph Engine (`src/ai_service/graph/`)**: Directed graph modeling the recruitment evaluation lifecycle, dynamic entry routing, and Human-in-the-Loop (HITL) pause gates.
- **Specialized Agents (`src/ai_service/agents/`)**:
  1. `job_analysis_agent.py`: Parses job requirements into weighted evaluation rubrics.
  2. `resume_analysis_agent.py`: Extracts structured work history, education, and technical toolsets from PDF/DOCX.
  3. `candidate_evaluation_agent.py`: Computes semantic match scores and detailed gap analyses using Gemini.
  4. `validation_agent.py`: Audits scoring integrity, checks bias heuristics, and flags edge cases.
  5. `question_generator_agent.py`: Formulates customized interview questions with scoring criteria.
  6. `scheduling_agent.py`: Harmonizes candidate and interviewer timeslots.
- **Persistence (`src/ai_service/db/`)**: Stores workflow graph state directly into PostgreSQL `jsonb` tables for resumability and auditability.
- **REST API (`src/ai_service/api/`)**: Endpoints for starting workflows (`POST /api/v1/workflows/start`), inspecting states, and health monitoring.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- [Poetry](https://python-poetry.org/) or standard `pip`
- Google Cloud SDK authenticated with Vertex AI access (`gcloud auth application-default login`)
- Running PostgreSQL database

### Configuration
Create `.env` based on `.env.example`:

```bash
ENVIRONMENT=development
DATABASE_URL=postgresql://hirewise_user:hirewise_secure_password_dev@localhost:5432/hirewise_db
DOTNET_API_BASE_URL=http://localhost:5101
AI_SERVICE_API_KEY=hw_ai_service_secret_key
AI_SERVICE_INTERNAL_KEY=hw_internal_callback_key
VERTEX_PROJECT_ID=your-gcp-project-id
VERTEX_LOCATION=us-central1
```

### Installation & Execution
Using Poetry:
```bash
cd apps/ai-service
poetry install
poetry run uvicorn ai_service.main:app --reload --port 8000
```
Or using standard virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn ai_service.main:app --reload --port 8000
```

Service runs on `http://localhost:8000`.  
Explore OpenAPI docs at `http://localhost:8000/docs`.

---

## 🧪 Testing

Run automated pytest suites:
```bash
cd apps/ai-service
pytest tests/ -v --asyncio-mode=auto
```

Linting and code style:
```bash
ruff check .
```

---

## 📚 Related Documentation
- [AI Architecture & LangGraph Documentation](../../docs/ai_architecture.md)
- [API Reference Guide](../../docs/api.md)
- [ADR-0004: FastAPI & LangGraph StateGraph](../../docs/adr/0004-fastapi-langgraph-ai-service.md)
