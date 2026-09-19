import pytest
import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, patch

from ai_service.graph.builder import build_evaluation_graph
from ai_service.graph.state import EvaluationState
from ai_service.utils.retry_policy import execute_with_retry_and_timeout
from ai_service.models.schemas import (
    JobAnalysis,
    ResumeAnalysis,
    CandidateEvaluation,
    RecommendationType,
    RecommendedSlot,
)


@pytest.mark.asyncio
async def test_full_workflow_stage_1_pauses_at_approval_gate():
    """
    Verifies that initial execution of Stage 1 (Screening) runs:
    Job Analysis -> Resume Analysis -> Candidate Evaluation -> Validation -> Pauses at Recruiter Approval Gate.
    """
    graph = build_evaluation_graph()

    wf_id = str(uuid.uuid4())
    app_id = str(uuid.uuid4())

    initial_state: EvaluationState = {
        "workflow_id": wf_id,
        "application_id": app_id,
        "step_ids": {
            "JOB_ANALYSIS": str(uuid.uuid4()),
            "RESUME_ANALYSIS": str(uuid.uuid4()),
            "CANDIDATE_EVALUATION": str(uuid.uuid4()),
            "VALIDATION": str(uuid.uuid4()),
            "EVALUATION_APPROVAL": str(uuid.uuid4()),
        },
        "job_title": "Senior Cloud Architect",
        "job_description": "Designing scalable AWS and GCP infrastructure.",
        "job_requirements": "Kubernetes, Terraform, Python, Go.",
        "candidate_resume_url": "http://storage.hirewise.dev/resume.pdf",
        "resume_raw_text": "Experienced Cloud Architect with 6 years in Kubernetes, Terraform, and Python.",
        "current_step": "JOB_ANALYSIS",
    }

    with (
        patch(
            "ai_service.db.repository.WorkflowRepository.update_step",
            new_callable=AsyncMock,
        ),
        patch(
            "ai_service.db.repository.WorkflowRepository.update_workflow_status",
            new_callable=AsyncMock,
        ),
        patch(
            "ai_service.services.callback_client.CallbackClient.notify_workflow_complete",
            new_callable=AsyncMock,
        ),
    ):
        final_state = await graph.ainvoke(initial_state)

        # Stage 1 must complete and pause at RECRUITER_APPROVAL
        assert final_state["current_step"] == "RECRUITER_APPROVAL"
        assert final_state["status"] == "AWAITING_APPROVAL"
        assert final_state["is_valid"] is True
        assert final_state.get("job_analysis") is not None
        assert final_state.get("resume_analysis") is not None
        assert final_state.get("candidate_evaluation") is not None


@pytest.mark.asyncio
async def test_full_workflow_stage_2_and_3_with_approval_and_schedule_confirmation():
    """
    Verifies that when recruiter approves evaluation, workflow executes:
    Question Generation -> Scheduling Recommendation -> Pauses at Schedule Confirmation ->
    When slot confirmed -> Finalizes Interview Creation and Completes.
    """
    graph = build_evaluation_graph()
    wf_id = str(uuid.uuid4())
    app_id = str(uuid.uuid4())

    base_time = datetime(2026, 9, 20, 14, 0, tzinfo=timezone.utc)

    # Resume state after recruiter approved evaluation
    approved_state: EvaluationState = {
        "workflow_id": wf_id,
        "application_id": app_id,
        "step_ids": {
            "EVALUATION_APPROVAL": str(uuid.uuid4()),
            "QUESTION_GENERATION": str(uuid.uuid4()),
            "SCHEDULING": str(uuid.uuid4()),
            "SCHEDULE_APPROVAL": str(uuid.uuid4()),
            "INTERVIEW_CREATION": str(uuid.uuid4()),
        },
        "job_analysis": {
            "title": "Senior Cloud Architect",
            "required_skills": ["Kubernetes", "Terraform", "Python"],
            "min_years_experience": 5,
        },
        "resume_analysis": {
            "candidate_name": "Elena Rostova",
            "extracted_skills": ["Kubernetes", "Terraform", "Python"],
            "years_of_experience": 6.0,
        },
        "candidate_evaluation": {
            "overall_match_score": 90,
            "skill_match_percentage": 95,
            "experience_match_percentage": 90,
            "strengths": ["Strong cloud architecture experience"],
            "identified_gaps": [],
            "recommendation": "STRONG_HIRE",
            "recommendation_reasoning": "Excellent fit.",
        },
        "evaluation_approved": True,
        "candidate_id": "cand_123",
        "interviewer_id": "int_456",
        "candidate_slots": [
            {
                "user_id": "cand_123",
                "role": "CANDIDATE",
                "start_time": base_time.isoformat(),
                "end_time": (base_time + timedelta(hours=3)).isoformat(),
                "timezone": "UTC",
            }
        ],
        "interviewer_slots": [
            {
                "user_id": "int_456",
                "role": "INTERVIEWER",
                "start_time": base_time.isoformat(),
                "end_time": (base_time + timedelta(hours=3)).isoformat(),
                "timezone": "UTC",
            }
        ],
        "duration_minutes": 45,
        "current_step": "QUESTION_GENERATION",
    }

    with (
        patch(
            "ai_service.db.repository.WorkflowRepository.update_step",
            new_callable=AsyncMock,
        ),
        patch(
            "ai_service.db.repository.WorkflowRepository.update_workflow_status",
            new_callable=AsyncMock,
        ),
        patch(
            "ai_service.services.callback_client.CallbackClient.notify_workflow_complete",
            new_callable=AsyncMock,
        ),
    ):
        # 1. Run through Stage 2 -> should pause at SCHEDULE_APPROVAL
        stage2_state = await graph.ainvoke(approved_state)
        assert stage2_state["current_step"] == "SCHEDULE_APPROVAL"
        assert stage2_state["status"] == "AWAITING_SCHEDULE_APPROVAL"
        assert stage2_state.get("interview_questions") is not None
        assert stage2_state.get("scheduling_recommendation") is not None

        # 2. Confirm schedule slot and resume to completion
        confirm_slot_state: EvaluationState = {
            **stage2_state,
            "schedule_approved": True,
            "selected_slot": stage2_state["scheduling_recommendation"][
                "recommended_slots"
            ][0],
            "current_step": "INTERVIEW_CREATION",
        }

        final_completed_state = await graph.ainvoke(confirm_slot_state)
        assert final_completed_state["current_step"] == "COMPLETED"
        assert final_completed_state["status"] == "COMPLETED"
        assert final_completed_state.get("interview_id") is not None


@pytest.mark.asyncio
async def test_full_workflow_rejection_at_gate_1():
    """
    Verifies that if a recruiter rejects a candidate, the workflow transitions to REJECTED.
    """
    graph = build_evaluation_graph()
    wf_id = str(uuid.uuid4())
    app_id = str(uuid.uuid4())

    rejected_state: EvaluationState = {
        "workflow_id": wf_id,
        "application_id": app_id,
        "step_ids": {"EVALUATION_APPROVAL": str(uuid.uuid4())},
        "evaluation_approved": False,
        "evaluation_approval_notes": "Candidate lacking necessary cloud scale experience.",
        "current_step": "EVALUATION_APPROVAL_GATE",
    }

    with (
        patch(
            "ai_service.db.repository.WorkflowRepository.update_step",
            new_callable=AsyncMock,
        ),
        patch(
            "ai_service.db.repository.WorkflowRepository.update_workflow_status",
            new_callable=AsyncMock,
        ),
        patch(
            "ai_service.services.callback_client.CallbackClient.notify_workflow_complete",
            new_callable=AsyncMock,
        ),
    ):
        result = await graph.ainvoke(rejected_state)
        assert result["current_step"] == "REJECTED"
        assert result["status"] == "REJECTED"


@pytest.mark.asyncio
async def test_retry_policy_recovers_after_transient_failure():
    """
    Verifies that execute_with_retry_and_timeout retries a flaky task and succeeds.
    """
    call_count = 0

    async def flaky_task():
        nonlocal call_count
        call_count += 1
        if call_count < 2:
            raise ConnectionResetError("Transient network drop")
        return "Success on attempt 2"

    retries_recorded = []

    async def on_retry(attempt: int, ex: Exception):
        retries_recorded.append(attempt)

    result = await execute_with_retry_and_timeout(
        func=flaky_task,
        step_name="FLAKY_STEP",
        workflow_id="test_wf_123",
        max_retries=3,
        initial_delay=0.01,
        on_retry=on_retry,
    )

    assert result == "Success on attempt 2"
    assert call_count == 2
    assert retries_recorded == [1]


@pytest.mark.asyncio
async def test_retry_policy_enforces_timeout():
    """
    Verifies that execute_with_retry_and_timeout raises TimeoutError when a task hangs.
    """

    async def hanging_task():
        await asyncio.sleep(1.0)
        return "Done"

    with pytest.raises(TimeoutError) as exc_info:
        await execute_with_retry_and_timeout(
            func=hanging_task,
            step_name="HANGING_STEP",
            workflow_id="test_wf_123",
            max_retries=2,
            timeout_seconds=0.05,
            initial_delay=0.01,
        )

    assert "timed out after" in str(exc_info.value)
