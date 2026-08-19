import pytest
import uuid
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone, timedelta
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
            assert mock_create_step.call_count == 9
            assert mock_run_graph.call_count == 1

@pytest.mark.asyncio
async def test_workflows_approve_evaluation_endpoint():
    transport = ASGITransport(app=app)
    headers = {"X-Api-Key": settings.AI_SERVICE_API_KEY}
    wf_id = str(uuid.uuid4())
    app_id = str(uuid.uuid4())

    mock_wf_record = {
        "Id": wf_id,
        "ApplicationId": app_id,
        "Status": "AWAITING_APPROVAL",
        "CurrentStep": "RECRUITER_APPROVAL",
        "FinalResultJson": '{"job_analysis": {}, "candidate_evaluation": {}}',
        "CreatedAt": datetime.now(timezone.utc)
    }

    mock_steps = [
        {"StepName": "EVALUATION_APPROVAL", "Id": str(uuid.uuid4())}
    ]

    with patch("ai_service.db.repository.WorkflowRepository.get_workflow", new_callable=AsyncMock, return_value=mock_wf_record), \
         patch("ai_service.db.repository.WorkflowRepository.get_steps", new_callable=AsyncMock, return_value=mock_steps), \
         patch("ai_service.db.repository.WorkflowRepository.update_step_approval", new_callable=AsyncMock), \
         patch("ai_service.db.repository.WorkflowRepository.update_step", new_callable=AsyncMock), \
         patch("ai_service.services.workflow_service.WorkflowService._run_workflow_graph", new_callable=AsyncMock) as mock_run_graph:

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/workflows/{wf_id}/approve-evaluation",
                json={"decision": "APPROVED", "notes": "Approved for interview"},
                headers=headers
            )
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "IN_PROGRESS"
            assert data["current_step"] == "QUESTION_GENERATION"
            assert mock_run_graph.call_count == 1

@pytest.mark.asyncio
async def test_workflows_confirm_schedule_endpoint():
    transport = ASGITransport(app=app)
    headers = {"X-Api-Key": settings.AI_SERVICE_API_KEY}
    wf_id = str(uuid.uuid4())
    app_id = str(uuid.uuid4())
    base_time = datetime(2026, 9, 20, 14, 0, tzinfo=timezone.utc)

    mock_wf_record = {
        "Id": wf_id,
        "ApplicationId": app_id,
        "Status": "AWAITING_SCHEDULE_APPROVAL",
        "CurrentStep": "SCHEDULE_APPROVAL",
        "FinalResultJson": '{"interview_questions": {}, "scheduling_recommendation": {}}',
        "CreatedAt": datetime.now(timezone.utc)
    }

    mock_steps = [
        {"StepName": "SCHEDULE_APPROVAL", "Id": str(uuid.uuid4())}
    ]

    with patch("ai_service.db.repository.WorkflowRepository.get_workflow", new_callable=AsyncMock, return_value=mock_wf_record), \
         patch("ai_service.db.repository.WorkflowRepository.get_steps", new_callable=AsyncMock, return_value=mock_steps), \
         patch("ai_service.db.repository.WorkflowRepository.update_step_approval", new_callable=AsyncMock), \
         patch("ai_service.db.repository.WorkflowRepository.update_step", new_callable=AsyncMock), \
         patch("ai_service.services.workflow_service.WorkflowService._run_workflow_graph", new_callable=AsyncMock) as mock_run_graph:

        payload = {
            "selected_slot": {
                "start_time": base_time.isoformat(),
                "end_time": (base_time + timedelta(minutes=45)).isoformat(),
                "interviewer_id": "int_1",
                "candidate_id": "cand_1",
                "score": 1.0
            },
            "notes": "Confirmed schedule"
        }

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/workflows/{wf_id}/confirm-schedule",
                json=payload,
                headers=headers
            )
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "IN_PROGRESS"
            assert data["current_step"] == "INTERVIEW_CREATION"
            assert mock_run_graph.call_count == 1

@pytest.mark.asyncio
async def test_workflows_generate_questions_endpoint():
    transport = ASGITransport(app=app)
    headers = {"X-Api-Key": settings.AI_SERVICE_API_KEY}
    payload = {
        "job_analysis": {
            "title": "Backend Engineer",
            "required_skills": ["Python", "FastAPI", "PostgreSQL"],
            "min_years_experience": 3
        },
        "resume_analysis": {
            "candidate_name": "Jane Doe",
            "extracted_skills": ["Python", "FastAPI", "PostgreSQL"],
            "years_of_experience": 4.0
        },
        "count_per_category": 2
    }

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/v1/workflows/generate-questions", json=payload, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "questions" in data
        assert len(data["questions"]) >= 4

@pytest.mark.asyncio
async def test_workflows_recommend_schedule_endpoint():
    transport = ASGITransport(app=app)
    headers = {"X-Api-Key": settings.AI_SERVICE_API_KEY}
    base = datetime(2026, 9, 1, 10, 0, tzinfo=timezone.utc)
    payload = {
        "candidate_id": "cand_1",
        "interviewer_id": "int_1",
        "candidate_slots": [
            {
                "user_id": "cand_1",
                "role": "CANDIDATE",
                "start_time": base.isoformat(),
                "end_time": (base + timedelta(hours=2)).isoformat(),
                "timezone": "UTC"
            }
        ],
        "interviewer_slots": [
            {
                "user_id": "int_1",
                "role": "INTERVIEWER",
                "start_time": base.isoformat(),
                "end_time": (base + timedelta(hours=2)).isoformat(),
                "timezone": "UTC"
            }
        ],
        "duration_minutes": 45,
        "timezone": "UTC"
    }

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/v1/workflows/recommend-schedule", json=payload, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "recommended_slots" in data
        assert len(data["recommended_slots"]) >= 1

@pytest.mark.asyncio
async def test_workflows_validate_endpoint():
    transport = ASGITransport(app=app)
    headers = {"X-Api-Key": settings.AI_SERVICE_API_KEY}
    payload = {
        "overall_match_score": 90,
        "skill_match_percentage": 92,
        "experience_match_percentage": 88,
        "strengths": ["Strong engineering background"],
        "identified_gaps": [],
        "recommendation": "STRONG_HIRE",
        "recommendation_reasoning": "Strong match across all criteria."
    }

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/v1/workflows/validate", json=payload, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is True
        assert len(data["validation_errors"]) == 0
