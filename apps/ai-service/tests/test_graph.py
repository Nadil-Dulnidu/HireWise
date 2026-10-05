import pytest
import uuid
from unittest.mock import AsyncMock, patch
from ai_service.graph.builder import build_evaluation_graph
from ai_service.graph.state import EvaluationState


@pytest.mark.asyncio
async def test_langgraph_pipeline_execution():
    """
    Tests the complete 4-agent LangGraph workflow execution with mock database calls.
    """
    workflow_id = str(uuid.uuid4())
    app_id = str(uuid.uuid4())
    step_ids = {
        "JOB_ANALYSIS": str(uuid.uuid4()),
        "RESUME_ANALYSIS": str(uuid.uuid4()),
        "CANDIDATE_EVALUATION": str(uuid.uuid4()),
        "VALIDATION": str(uuid.uuid4()),
    }

    initial_state: EvaluationState = {
        "workflow_id": workflow_id,
        "application_id": app_id,
        "step_ids": step_ids,
        "job_title": "Senior Backend Engineer",
        "job_description": "We are seeking a Senior Backend Engineer proficient in .NET 8, C#, PostgreSQL, and distributed architectures.",
        "job_requirements": "5+ years experience, C#, .NET 8, PostgreSQL, Redis, REST APIs.",
        "candidate_resume_url": "https://storage.hirewise.dev/resumes/candidate123.pdf",
        "resume_raw_text": "Alex Morgan, Senior Software Engineer with 6 years experience in C#, .NET Core, PostgreSQL, and AWS.",
        "current_step": "JOB_ANALYSIS",
    }

    # Patch DB repo and callback client methods
    with (
        patch(
            "ai_service.graph.nodes.repo.update_step", new_callable=AsyncMock
        ) as mock_update_step,
        patch(
            "ai_service.graph.nodes.repo.update_workflow_status", new_callable=AsyncMock
        ) as mock_update_wf,
        patch(
            "ai_service.services.callback_client.CallbackClient.notify_workflow_complete",
            new_callable=AsyncMock,
        ) as mock_notify,
    ):
        graph = build_evaluation_graph()
        final_state = await graph.ainvoke(initial_state)

        # Assert graph transitioned through all agents
        assert "job_analysis" in final_state
        assert final_state["job_analysis"] is not None
        assert "required_skills" in final_state["job_analysis"]

        assert "resume_analysis" in final_state
        assert final_state["resume_analysis"] is not None

        assert "candidate_evaluation" in final_state
        assert final_state["candidate_evaluation"] is not None
        assert 0 <= final_state["candidate_evaluation"]["overall_match_score"] <= 100

        assert "validation_result" in final_state
        assert final_state["validation_result"]["is_valid"] is True

        assert "final_result" in final_state
        assert final_state["current_step"] == "RECRUITER_APPROVAL"

        # Verify DB updates were triggered
        assert mock_update_step.call_count >= 4
        assert mock_update_wf.call_count >= 4
        assert mock_notify.call_count == 1
