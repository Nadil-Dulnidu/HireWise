import uuid
import httpx
from datetime import datetime, timezone
from typing import Dict, Any

from langchain_core.messages import SystemMessage, HumanMessage

from ai_service.core.logging import logger
from ai_service.graph.state import EvaluationState
from ai_service.db.repository import WorkflowRepository
from ai_service.llm.client import get_structured_llm
from ai_service.models.schemas import (
    JobAnalysis,
    ResumeAnalysis,
    CandidateEvaluation,
    ValidationResult
)
from ai_service.prompts.templates import (
    JOB_ANALYSIS_SYSTEM_PROMPT,
    JOB_ANALYSIS_USER_PROMPT,
    RESUME_ANALYSIS_SYSTEM_PROMPT,
    RESUME_ANALYSIS_USER_PROMPT,
    CANDIDATE_EVALUATION_SYSTEM_PROMPT,
    CANDIDATE_EVALUATION_USER_PROMPT,
)

repo = WorkflowRepository()

async def job_analysis_node(state: EvaluationState) -> EvaluationState:
    """
    Agent 1: Extracts structured requirements, technical domains, and competencies from Job Posting.
    """
    workflow_id = uuid.UUID(state["workflow_id"])
    step_id = uuid.UUID(state["step_ids"]["JOB_ANALYSIS"]) if "step_ids" in state and "JOB_ANALYSIS" in state["step_ids"] else None

    logger.info(f"[{workflow_id}] Running Agent 1: Job Description Analysis...")
    if step_id:
        await repo.update_step(step_id, status="IN_PROGRESS", started_at=datetime.now(timezone.utc))

    user_content = JOB_ANALYSIS_USER_PROMPT.format(
        job_title=state.get("job_title", ""),
        job_description=state.get("job_description", ""),
        job_requirements=state.get("job_requirements", "")
    )

    llm = get_structured_llm(JobAnalysis)
    messages = [
        SystemMessage(content=JOB_ANALYSIS_SYSTEM_PROMPT),
        HumanMessage(content=user_content)
    ]

    try:
        result: JobAnalysis = await llm.ainvoke(messages)
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

    # Fetch resume text or fallback to URL context
    resume_text = state.get("resume_raw_text") or ""
    resume_url = state.get("candidate_resume_url") or ""

    if not resume_text and resume_url:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(resume_url)
                if res.status_code == 200:
                    resume_text = res.text[:8000] # Take first 8KB if raw text
        except Exception:
            resume_text = f"Resume document available at URL: {resume_url}"

    if not resume_text:
        resume_text = f"Candidate applied with resume link: {resume_url}"

    user_content = RESUME_ANALYSIS_USER_PROMPT.format(resume_content=resume_text)

    llm = get_structured_llm(ResumeAnalysis)
    messages = [
        SystemMessage(content=RESUME_ANALYSIS_SYSTEM_PROMPT),
        HumanMessage(content=user_content)
    ]

    try:
        result: ResumeAnalysis = await llm.ainvoke(messages)
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

    job = state.get("job_analysis") or {}
    cand = state.get("resume_analysis") or {}

    user_content = CANDIDATE_EVALUATION_USER_PROMPT.format(
        job_title=job.get("title", state.get("job_title", "")),
        required_skills=", ".join(job.get("required_skills", [])),
        preferred_skills=", ".join(job.get("preferred_skills", [])),
        min_years_experience=job.get("min_years_experience", 0),
        technical_domains=", ".join(job.get("technical_domains", [])),
        extracted_skills=", ".join(cand.get("extracted_skills", [])),
        years_of_experience=cand.get("years_of_experience", 0.0),
        education_history=", ".join(cand.get("education_history", [])),
        project_highlights="; ".join(cand.get("project_highlights", [])),
        certifications=", ".join(cand.get("certifications", [])),
        executive_summary=cand.get("executive_summary", "")
    )

    llm = get_structured_llm(CandidateEvaluation)
    messages = [
        SystemMessage(content=CANDIDATE_EVALUATION_SYSTEM_PROMPT),
        HumanMessage(content=user_content)
    ]

    try:
        result: CandidateEvaluation = await llm.ainvoke(messages)
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

    errors = []
    warnings = []

    eval_data = state.get("candidate_evaluation")
    if not eval_data:
        errors.append("Candidate evaluation artifact is missing.")
    else:
        score = eval_data.get("overall_match_score")
        if score is None or not (0 <= score <= 100):
            errors.append(f"Invalid overall_match_score: {score}. Must be between 0 and 100.")
        
        skill_score = eval_data.get("skill_match_percentage")
        if skill_score is None or not (0 <= skill_score <= 100):
            errors.append(f"Invalid skill_match_percentage: {skill_score}. Must be between 0 and 100.")

        rec = eval_data.get("recommendation")
        if not rec or rec not in ("STRONG_HIRE", "HIRE", "NO_HIRE", "STRONG_NO_HIRE"):
            errors.append(f"Invalid recommendation type: {rec}.")

        reasoning = eval_data.get("recommendation_reasoning", "")
        if len(reasoning.strip()) < 10:
            warnings.append("Recommendation reasoning is brief or low detail.")

    is_valid = len(errors) == 0
    val_result = ValidationResult(
        is_valid=is_valid,
        validation_errors=errors,
        warnings=warnings,
        confidence_score=1.0 if is_valid else 0.0
    )
    val_dict = val_result.model_dump()

    if step_id:
        await repo.update_step(step_id, status="COMPLETED" if is_valid else "FAILED", output_data=val_dict)

    await repo.update_workflow_status(
        workflow_id=workflow_id,
        status="IN_PROGRESS" if is_valid else "FAILED",
        current_step="FINALIZE" if is_valid else "ERROR",
        completed_steps=["JOB_ANALYSIS", "RESUME_ANALYSIS", "CANDIDATE_EVALUATION", "VALIDATION"]
    )

    logger.info(f"[{workflow_id}] Agent 4 Validation completed. is_valid={is_valid}, errors={errors}")
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
