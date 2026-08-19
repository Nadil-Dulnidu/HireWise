import uuid
from datetime import datetime, timezone
from typing import Dict, Any

from ai_service.core.logging import logger
from ai_service.graph.state import EvaluationState
from ai_service.db.repository import WorkflowRepository
from ai_service.agents import (
    JobDescriptionAnalysisAgent,
    ResumeAnalysisAgent,
    CandidateEvaluationAgent,
    ValidationAgent,
    InterviewQuestionGeneratorAgent,
    InterviewSchedulingAgent
)
from ai_service.models.schemas import (
    JobAnalysis,
    ResumeAnalysis,
    CandidateEvaluation,
    ValidationResult,
    InterviewQuestionsPayload,
    SchedulingRecommendation
)

repo = WorkflowRepository()

job_agent = JobDescriptionAnalysisAgent()
resume_agent = ResumeAnalysisAgent()
eval_agent = CandidateEvaluationAgent()
validation_agent = ValidationAgent()
question_agent = InterviewQuestionGeneratorAgent()
scheduling_agent = InterviewSchedulingAgent()

async def job_analysis_node(state: EvaluationState) -> EvaluationState:
    """
    Agent 1: Extracts structured requirements, technical domains, and competencies from Job Posting.
    """
    workflow_id = uuid.UUID(state["workflow_id"])
    step_id = uuid.UUID(state["step_ids"]["JOB_ANALYSIS"]) if "step_ids" in state and "JOB_ANALYSIS" in state["step_ids"] else None

    logger.info(f"[{workflow_id}] Running Agent 1: Job Description Analysis...")
    if step_id:
        await repo.update_step(step_id, status="IN_PROGRESS", started_at=datetime.now(timezone.utc))

    try:
        result: JobAnalysis = await job_agent.execute(
            job_title=state.get("job_title", ""),
            job_description=state.get("job_description", ""),
            job_requirements=state.get("job_requirements", "")
        )
        result_dict = result.model_dump()

        if step_id:
            await repo.update_step(step_id, status="COMPLETED", output_data=result_dict)

        await repo.update_workflow_status(
            workflow_id=workflow_id,
            status="IN_PROGRESS",
            current_step="RESUME_ANALYSIS",
            completed_steps=["JOB_ANALYSIS"]
        )

        logger.info(f"[{workflow_id}] Agent 1 Job Analysis completed successfully.")
        return {
            **state,
            "job_analysis": result_dict,
            "current_step": "RESUME_ANALYSIS"
        }
    except Exception as ex:
        logger.error(f"[{workflow_id}] Agent 1 failed: {ex}")
        if step_id:
            await repo.update_step(step_id, status="FAILED", output_data={"error": str(ex)})
        return {
            **state,
            "error": f"Job Analysis failed: {str(ex)}",
            "current_step": "FAILED"
        }

async def resume_analysis_node(state: EvaluationState) -> EvaluationState:
    """
    Agent 2: Parses candidate resume/career profile and extracts structured competencies.
    """
    workflow_id = uuid.UUID(state["workflow_id"])
    step_id = uuid.UUID(state["step_ids"]["RESUME_ANALYSIS"]) if "step_ids" in state and "RESUME_ANALYSIS" in state["step_ids"] else None

    logger.info(f"[{workflow_id}] Running Agent 2: Resume Analysis...")
    if step_id:
        await repo.update_step(step_id, status="IN_PROGRESS", started_at=datetime.now(timezone.utc))

    try:
        result: ResumeAnalysis = await resume_agent.execute(
            resume_url=state.get("candidate_resume_url"),
            raw_text=state.get("resume_raw_text")
        )
        result_dict = result.model_dump()

        if step_id:
            await repo.update_step(step_id, status="COMPLETED", output_data=result_dict)

        await repo.update_workflow_status(
            workflow_id=workflow_id,
            status="IN_PROGRESS",
            current_step="CANDIDATE_EVALUATION",
            completed_steps=["JOB_ANALYSIS", "RESUME_ANALYSIS"]
        )

        logger.info(f"[{workflow_id}] Agent 2 Resume Analysis completed successfully.")
        return {
            **state,
            "resume_analysis": result_dict,
            "current_step": "CANDIDATE_EVALUATION"
        }
    except Exception as ex:
        logger.error(f"[{workflow_id}] Agent 2 failed: {ex}")
        if step_id:
            await repo.update_step(step_id, status="FAILED", output_data={"error": str(ex)})
        return {
            **state,
            "error": f"Resume Analysis failed: {str(ex)}",
            "current_step": "FAILED"
        }

async def candidate_evaluation_node(state: EvaluationState) -> EvaluationState:
    """
    Agent 3: Evaluates fit score, skill match %, experience match %, strengths, and recommendation.
    """
    workflow_id = uuid.UUID(state["workflow_id"])
    step_id = uuid.UUID(state["step_ids"]["CANDIDATE_EVALUATION"]) if "step_ids" in state and "CANDIDATE_EVALUATION" in state["step_ids"] else None

    logger.info(f"[{workflow_id}] Running Agent 3: Candidate Evaluation & Ranking...")
    if step_id:
        await repo.update_step(step_id, status="IN_PROGRESS", started_at=datetime.now(timezone.utc))

    job_dict = state.get("job_analysis") or {}
    cand_dict = state.get("resume_analysis") or {}

    try:
        job_analysis = JobAnalysis(**job_dict)
        resume_analysis = ResumeAnalysis(**cand_dict)

        result: CandidateEvaluation = await eval_agent.execute(
            job_analysis=job_analysis,
            resume_analysis=resume_analysis
        )
        result_dict = result.model_dump()

        if step_id:
            await repo.update_step(step_id, status="COMPLETED", output_data=result_dict)

        await repo.update_workflow_status(
            workflow_id=workflow_id,
            status="IN_PROGRESS",
            current_step="VALIDATION",
            completed_steps=["JOB_ANALYSIS", "RESUME_ANALYSIS", "CANDIDATE_EVALUATION"]
        )

        logger.info(f"[{workflow_id}] Agent 3 Candidate Evaluation completed with score {result.overall_match_score}%.")
        return {
            **state,
            "candidate_evaluation": result_dict,
            "current_step": "VALIDATION"
        }
    except Exception as ex:
        logger.error(f"[{workflow_id}] Agent 3 failed: {ex}")
        if step_id:
            await repo.update_step(step_id, status="FAILED", output_data={"error": str(ex)})
        return {
            **state,
            "error": f"Candidate Evaluation failed: {str(ex)}",
            "current_step": "FAILED"
        }

async def validation_node(state: EvaluationState) -> EvaluationState:
    """
    Agent 4: Deterministic validation of outputs against schema constraints and business rules.
    """
    workflow_id = uuid.UUID(state["workflow_id"])
    step_id = uuid.UUID(state["step_ids"]["VALIDATION"]) if "step_ids" in state and "VALIDATION" in state["step_ids"] else None

    logger.info(f"[{workflow_id}] Running Agent 4: Deterministic Schema & Constraint Validation...")
    if step_id:
        await repo.update_step(step_id, status="IN_PROGRESS", started_at=datetime.now(timezone.utc))

    eval_data = state.get("candidate_evaluation")
    if not eval_data:
        val_result = ValidationResult(
            is_valid=False,
            validation_errors=["Candidate evaluation artifact is missing."],
            warnings=[],
            confidence_score=0.0
        )
    else:
        val_result = validation_agent.validate(eval_data, artifact_type="CandidateEvaluation")

    val_dict = val_result.model_dump()
    is_valid = val_result.is_valid

    if step_id:
        await repo.update_step(step_id, status="COMPLETED" if is_valid else "FAILED", output_data=val_dict)

    await repo.update_workflow_status(
        workflow_id=workflow_id,
        status="IN_PROGRESS" if is_valid else "FAILED",
        current_step="FINALIZE" if is_valid else "ERROR",
        completed_steps=["JOB_ANALYSIS", "RESUME_ANALYSIS", "CANDIDATE_EVALUATION", "VALIDATION"]
    )

    logger.info(f"[{workflow_id}] Agent 4 Validation completed. is_valid={is_valid}, errors={val_result.validation_errors}")
    return {
        **state,
        "validation_result": val_dict,
        "is_valid": is_valid,
        "current_step": "FINALIZE" if is_valid else "ERROR"
    }

async def finalize_node(state: EvaluationState) -> EvaluationState:
    """
    Final node: Aggregates artifacts into final result, updates status to AWAITING_APPROVAL,
    and notifies ASP.NET API via callback.
    """
    from ai_service.services.callback_client import CallbackClient

    workflow_id = uuid.UUID(state["workflow_id"])
    app_id = uuid.UUID(state["application_id"])
    logger.info(f"[{workflow_id}] Finalizing AI Evaluation Workflow for Application {app_id}...")

    final_result = {
        "job_analysis": state.get("job_analysis"),
        "resume_analysis": state.get("resume_analysis"),
        "candidate_evaluation": state.get("candidate_evaluation"),
        "validation_result": state.get("validation_result")
    }

    # Mark workflow as AWAITING_APPROVAL (Recruiter Review Gate)
    await repo.update_workflow_status(
        workflow_id=workflow_id,
        status="AWAITING_APPROVAL",
        current_step="RECRUITER_APPROVAL",
        final_result=final_result,
        completed_steps=["JOB_ANALYSIS", "RESUME_ANALYSIS", "CANDIDATE_EVALUATION", "VALIDATION"]
    )

    # Trigger async callback to ASP.NET API
    callback = CallbackClient()
    await callback.notify_workflow_complete(
        workflow_id=workflow_id,
        application_id=app_id,
        status="AWAITING_APPROVAL",
        final_result=final_result
    )

    logger.info(f"[{workflow_id}] Evaluation workflow completed successfully. Paused at Recruiter Approval Gate.")
    return {
        **state,
        "final_result": final_result,
        "current_step": "RECRUITER_APPROVAL"
    }

async def error_node(state: EvaluationState) -> EvaluationState:
    """
    Error node: Handles failures gracefully and notifies ASP.NET API.
    """
    from ai_service.services.callback_client import CallbackClient

    workflow_id = uuid.UUID(state["workflow_id"])
    app_id = uuid.UUID(state["application_id"])
    error_msg = state.get("error") or "Validation failed or execution error encountered."
    logger.warning(f"[{workflow_id}] Workflow entered error state: {error_msg}")

    error_state = {
        "error": error_msg,
        "validation_result": state.get("validation_result")
    }

    await repo.update_workflow_status(
        workflow_id=workflow_id,
        status="FAILED",
        current_step="FAILED",
        error_state=error_state
    )

    callback = CallbackClient()
    await callback.notify_workflow_complete(
        workflow_id=workflow_id,
        application_id=app_id,
        status="FAILED",
        final_result={"error": error_msg}
    )

    return {
        **state,
        "current_step": "FAILED"
    }
