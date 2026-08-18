import pytest
import uuid
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone
from ai_service.main import app
from ai_service.core.config import settings

@pytest.mark.asyncio
async def test_workflows_evaluate_requires_auth():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/v1/workflows/evaluate", json={
            "application_id": str(uuid.uuid4()),
            "job_title": "Software Engineer",
            "job_description": "Engineering role",
            "job_requirements": "C#, React",
            "candidate_resume_url": "http://example.com/resume.pdf"
        })
        assert response.status_code == 401

@pytest.mark.asyncio
async def test_workflows_evaluate_success():
    transport = ASGITransport(app=app)
    app_id = str(uuid.uuid4())

    with patch("ai_service.db.repository.WorkflowRepository.create_workflow", new_callable=AsyncMock) as mock_create_wf, \
         patch("ai_service.db.repository.WorkflowRepository.create_step", new_callable=AsyncMock) as mock_create_step, \
         patch("ai_service.services.workflow_service.WorkflowService._run_workflow_graph", new_callable=AsyncMock) as mock_run_graph:

        headers = {"X-Api-Key": settings.AI_SERVICE_API_KEY}
        payload = {
            "application_id": app_id,
            "job_title": "Full Stack Developer",
            "job_description": "Building next gen SaaS platform",
            "job_requirements": "Python, React, TypeScript",
            "candidate_resume_url": "http://storage.hirewise.dev/resume123.pdf"
        }

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/api/v1/workflows/evaluate", json=payload, headers=headers)
            assert response.status_code == 202
            data = response.json()
            assert data["application_id"] == app_id
            assert data["status"] == "IN_PROGRESS"
            assert data["current_step"] == "JOB_ANALYSIS"
            assert "workflow_id" in data

            assert mock_create_wf.call_count == 1
            assert mock_create_step.call_count == 4
            assert mock_run_graph.call_count == 1
