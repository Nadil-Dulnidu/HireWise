import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from ai_service.core.logging import logger
from ai_service.graph.state import EvaluationState
from ai_service.db.repository import WorkflowRepository
from ai_service.utils.retry_policy import execute_with_retry_and_timeout
from ai_service.agents import (
    JobDescriptionAnalysisAgent,
    ResumeAnalysisAgent,
    CandidateEvaluationAgent,
    ValidationAgent,
    InterviewQuestionGeneratorAgent,
    InterviewSchedulingAgent,
)
from ai_service.models.schemas import (
    JobAnalysis,
    ResumeAnalysis,
    CandidateEvaluation,
    ValidationResult,
    InterviewQuestionsPayload,
    SchedulingRecommendation,
    AvailabilitySlotInput,
    SchedulingRequest,
)

repo = WorkflowRepository()

job_agent = JobDescriptionAnalysisAgent()
resume_agent = ResumeAnalysisAgent()
eval_agent = CandidateEvaluationAgent()
validation_agent = ValidationAgent()
question_agent = InterviewQuestionGeneratorAgent()
scheduling_agent = InterviewSchedulingAgent()


# ==============================================================================
# Step 1: Job Description Analysis Node
# ==============================================================================
async def job_analysis_node(state: EvaluationState) -> EvaluationState:
    workflow_id_str = state["workflow_id"]
    workflow_id = uuid.UUID(workflow_id_str)
    step_id = (
        uuid.UUID(state["step_ids"]["JOB_ANALYSIS"])
        if "step_ids" in state and "JOB_ANALYSIS" in state["step_ids"]
        else None
    )

    logger.info(
        f"[{workflow_id}] Starting Stage 1, Step 1: Job Description Analysis..."
    )
    if step_id:
        await repo.update_step(
            step_id, status="IN_PROGRESS", started_at=datetime.now(timezone.utc)
        )

    async def execute_task():
        return await job_agent.execute(
            job_title=state.get("job_title", ""),
            job_description=state.get("job_description", ""),
            job_requirements=state.get("job_requirements", ""),
        )

    async def on_retry(attempt: int, ex: Exception):
        if step_id:
            await repo.increment_step_retry(step_id)

    try:
        result: JobAnalysis = await execute_with_retry_and_timeout(
            func=execute_task,
            step_name="JOB_ANALYSIS",
            workflow_id=workflow_id_str,
            max_retries=3,
            timeout_seconds=20.0,
            on_retry=on_retry,
        )
        result_dict = result.model_dump()

        if step_id:
            await repo.update_step(step_id, status="COMPLETED", output_data=result_dict)

        await repo.update_workflow_status(
            workflow_id=workflow_id,
            status="IN_PROGRESS",
            current_step="RESUME_ANALYSIS",
            completed_steps=["JOB_ANALYSIS"],
        )

        return {**state, "job_analysis": result_dict, "current_step": "RESUME_ANALYSIS"}
    except Exception as ex:
        logger.error(f"[{workflow_id}] Agent 1 failed after retries: {ex}")
        if step_id:
            await repo.update_step(
                step_id, status="FAILED", output_data={"error": str(ex)}
            )
        return {
            **state,
            "error": f"Job Analysis failed: {str(ex)}",
            "current_step": "FAILED",
        }


# ==============================================================================
# Step 2: Resume Analysis Node
# ==============================================================================
async def resume_analysis_node(state: EvaluationState) -> EvaluationState:
    workflow_id_str = state["workflow_id"]
    workflow_id = uuid.UUID(workflow_id_str)
    step_id = (
        uuid.UUID(state["step_ids"]["RESUME_ANALYSIS"])
        if "step_ids" in state and "RESUME_ANALYSIS" in state["step_ids"]
        else None
    )

    logger.info(f"[{workflow_id}] Starting Stage 1, Step 2: Resume Analysis...")
    if step_id:
        await repo.update_step(
            step_id, status="IN_PROGRESS", started_at=datetime.now(timezone.utc)
        )

    async def execute_task():
        return await resume_agent.execute(
            resume_url=state.get("candidate_resume_url"),
            raw_text=state.get("resume_raw_text"),
        )

    async def on_retry(attempt: int, ex: Exception):
        if step_id:
            await repo.increment_step_retry(step_id)

    try:
        result: ResumeAnalysis = await execute_with_retry_and_timeout(
            func=execute_task,
            step_name="RESUME_ANALYSIS",
            workflow_id=workflow_id_str,
            max_retries=3,
            timeout_seconds=20.0,
            on_retry=on_retry,
        )
        result_dict = result.model_dump()

        if step_id:
            await repo.update_step(step_id, status="COMPLETED", output_data=result_dict)

        await repo.update_workflow_status(
            workflow_id=workflow_id,
            status="IN_PROGRESS",
            current_step="CANDIDATE_EVALUATION",
            completed_steps=["JOB_ANALYSIS", "RESUME_ANALYSIS"],
        )

        return {
            **state,
            "resume_analysis": result_dict,
            "current_step": "CANDIDATE_EVALUATION",
        }
    except Exception as ex:
        logger.error(f"[{workflow_id}] Agent 2 failed after retries: {ex}")
        if step_id:
            await repo.update_step(
                step_id, status="FAILED", output_data={"error": str(ex)}
            )
        return {
            **state,
            "error": f"Resume Analysis failed: {str(ex)}",
            "current_step": "FAILED",
        }


# ==============================================================================
# Step 3: Candidate Evaluation Node
# ==============================================================================
async def candidate_evaluation_node(state: EvaluationState) -> EvaluationState:
    workflow_id_str = state["workflow_id"]
    workflow_id = uuid.UUID(workflow_id_str)
    step_id = (
        uuid.UUID(state["step_ids"]["CANDIDATE_EVALUATION"])
        if "step_ids" in state and "CANDIDATE_EVALUATION" in state["step_ids"]
        else None
    )

    logger.info(
        f"[{workflow_id}] Starting Stage 1, Step 3: Candidate Evaluation & Fit Scoring..."
    )
    if step_id:
        await repo.update_step(
            step_id, status="IN_PROGRESS", started_at=datetime.now(timezone.utc)
        )

    job_dict = state.get("job_analysis") or {}
    cand_dict = state.get("resume_analysis") or {}

    async def execute_task():
        job_analysis = JobAnalysis(**job_dict)
        resume_analysis = ResumeAnalysis(**cand_dict)
        return await eval_agent.execute(
            job_analysis=job_analysis, resume_analysis=resume_analysis
        )

    async def on_retry(attempt: int, ex: Exception):
        if step_id:
            await repo.increment_step_retry(step_id)

    try:
        result: CandidateEvaluation = await execute_with_retry_and_timeout(
            func=execute_task,
            step_name="CANDIDATE_EVALUATION",
            workflow_id=workflow_id_str,
            max_retries=3,
            timeout_seconds=20.0,
            on_retry=on_retry,
        )
        result_dict = result.model_dump()

        if step_id:
            await repo.update_step(step_id, status="COMPLETED", output_data=result_dict)

        await repo.update_workflow_status(
            workflow_id=workflow_id,
            status="IN_PROGRESS",
            current_step="VALIDATION",
            completed_steps=["JOB_ANALYSIS", "RESUME_ANALYSIS", "CANDIDATE_EVALUATION"],
        )

        return {
            **state,
            "candidate_evaluation": result_dict,
            "current_step": "VALIDATION",
        }
    except Exception as ex:
        logger.error(f"[{workflow_id}] Agent 3 failed after retries: {ex}")
        if step_id:
            await repo.update_step(
                step_id, status="FAILED", output_data={"error": str(ex)}
            )
        return {
            **state,
            "error": f"Candidate Evaluation failed: {str(ex)}",
            "current_step": "FAILED",
        }


# ==============================================================================
# Step 4: Validation Node
# ==============================================================================
async def validation_node(state: EvaluationState) -> EvaluationState:
    workflow_id_str = state["workflow_id"]
    workflow_id = uuid.UUID(workflow_id_str)
    step_id = (
        uuid.UUID(state["step_ids"]["VALIDATION"])
        if "step_ids" in state and "VALIDATION" in state["step_ids"]
        else None
    )

    logger.info(
        f"[{workflow_id}] Starting Stage 1, Step 4: Deterministic Schema & Constraint Validation..."
    )
    if step_id:
        await repo.update_step(
            step_id, status="IN_PROGRESS", started_at=datetime.now(timezone.utc)
        )

    eval_data = state.get("candidate_evaluation")
    if not eval_data:
        val_result = ValidationResult(
            is_valid=False,
            validation_errors=["Candidate evaluation artifact is missing."],
            warnings=[],
            confidence_score=0.0,
        )
    else:
        val_result = validation_agent.validate(
            eval_data, artifact_type="CandidateEvaluation"
        )

    val_dict = val_result.model_dump()
    is_valid = val_result.is_valid

    if step_id:
        await repo.update_step(
            step_id, status="COMPLETED" if is_valid else "FAILED", output_data=val_dict
        )

    if not is_valid:
        await repo.update_workflow_status(
            workflow_id=workflow_id,
            status="FAILED",
            current_step="ERROR",
            error_state={"validation_errors": val_result.validation_errors},
        )
        return {
            **state,
            "validation_result": val_dict,
            "is_valid": False,
            "error": f"Validation errors: {', '.join(val_result.validation_errors)}",
            "current_step": "ERROR",
        }

    return {
        **state,
        "validation_result": val_dict,
        "is_valid": True,
        "current_step": "EVALUATION_APPROVAL_GATE",
    }


# ==============================================================================
# Approval Gate 1: Recruiter Evaluation Approval Gate
# ==============================================================================
async def evaluation_approval_gate_node(state: EvaluationState) -> EvaluationState:
    """
    Approval Gate 1: Pauses workflow if human recruiter review is pending.
    If already approved, advances to Question Generation.
    If rejected, terminates application in REJECTED state.
    """
    from ai_service.services.callback_client import CallbackClient

    workflow_id_str = state["workflow_id"]
    workflow_id = uuid.UUID(workflow_id_str)
    app_id = uuid.UUID(state["application_id"])

    eval_approved = state.get("evaluation_approved")

    # Case A: Recruiter approved candidate
    if eval_approved is True:
        logger.info(
            f"[{workflow_id}] Recruiter evaluation approval confirmed. Advancing to Stage 2: Question Generation..."
        )
        step_id = (
            uuid.UUID(state["step_ids"]["EVALUATION_APPROVAL"])
            if "step_ids" in state and "EVALUATION_APPROVAL" in state["step_ids"]
            else None
        )
        if step_id:
            await repo.update_step_approval(
                step_id=step_id,
                approval_status="APPROVED",
                approved_by_user_id=uuid.UUID(state["evaluation_approved_by"])
                if state.get("evaluation_approved_by")
                else None,
                approval_notes=state.get("evaluation_approval_notes"),
            )

        await repo.update_workflow_status(
            workflow_id=workflow_id,
            status="IN_PROGRESS",
            current_step="QUESTION_GENERATION",
            completed_steps=[
                "JOB_ANALYSIS",
                "RESUME_ANALYSIS",
                "CANDIDATE_EVALUATION",
                "VALIDATION",
                "EVALUATION_APPROVAL",
            ],
        )
        return {**state, "current_step": "QUESTION_GENERATION"}

    # Case B: Recruiter rejected candidate
    elif eval_approved is False:
        logger.info(
            f"[{workflow_id}] Recruiter rejected candidate at evaluation review gate."
        )
        return {**state, "status": "REJECTED", "current_step": "REJECTION"}

    # Case C: First pass -> Pause and wait for human decision
    logger.info(
        f"[{workflow_id}] Evaluation complete. Pausing workflow at Recruiter Approval Gate (AWAITING_APPROVAL)..."
    )

    evaluation_artifact = {
        "job_analysis": state.get("job_analysis"),
        "resume_analysis": state.get("resume_analysis"),
        "candidate_evaluation": state.get("candidate_evaluation"),
        "validation_result": state.get("validation_result"),
    }

    await repo.update_workflow_status(
        workflow_id=workflow_id,
        status="AWAITING_APPROVAL",
        current_step="RECRUITER_APPROVAL",
        final_result=evaluation_artifact,
        completed_steps=[
            "JOB_ANALYSIS",
            "RESUME_ANALYSIS",
            "CANDIDATE_EVALUATION",
            "VALIDATION",
        ],
    )

    # Notify ASP.NET API via callback
    callback = CallbackClient()
    await callback.notify_workflow_complete(
        workflow_id=workflow_id,
        application_id=app_id,
        status="AWAITING_APPROVAL",
        final_result=evaluation_artifact,
    )

    return {
        **state,
        "final_result": evaluation_artifact,
        "status": "AWAITING_APPROVAL",
        "current_step": "RECRUITER_APPROVAL",
    }


# ==============================================================================
# Step 5: Question Generation Node
# ==============================================================================
async def question_generation_node(state: EvaluationState) -> EvaluationState:
    workflow_id_str = state["workflow_id"]
    workflow_id = uuid.UUID(workflow_id_str)
    step_id = (
        uuid.UUID(state["step_ids"]["QUESTION_GENERATION"])
        if "step_ids" in state and "QUESTION_GENERATION" in state["step_ids"]
        else None
    )

    logger.info(
        f"[{workflow_id}] Starting Stage 2, Step 5: Interview Question Generation..."
    )
    if step_id:
        await repo.update_step(
            step_id, status="IN_PROGRESS", started_at=datetime.now(timezone.utc)
        )

    job_dict = state.get("job_analysis") or {}
    cand_dict = state.get("resume_analysis") or {}
    eval_dict = state.get("candidate_evaluation") or {}

    async def execute_task():
        job_analysis = JobAnalysis(**job_dict)
        resume_analysis = ResumeAnalysis(**cand_dict)
        candidate_eval = CandidateEvaluation(**eval_dict) if eval_dict else None

        return await question_agent.execute(
            job_analysis=job_analysis,
            resume_analysis=resume_analysis,
            candidate_evaluation=candidate_eval,
            count_per_category=2,
        )

    async def on_retry(attempt: int, ex: Exception):
        if step_id:
            await repo.increment_step_retry(step_id)

    try:
        result: InterviewQuestionsPayload = await execute_with_retry_and_timeout(
            func=execute_task,
            step_name="QUESTION_GENERATION",
            workflow_id=workflow_id_str,
            max_retries=3,
            timeout_seconds=25.0,
            on_retry=on_retry,
        )
        result_dict = result.model_dump()

        if step_id:
            await repo.update_step(step_id, status="COMPLETED", output_data=result_dict)

        await repo.update_workflow_status(
            workflow_id=workflow_id,
            status="IN_PROGRESS",
            current_step="SCHEDULING",
            completed_steps=[
                "JOB_ANALYSIS",
                "RESUME_ANALYSIS",
                "CANDIDATE_EVALUATION",
                "VALIDATION",
                "EVALUATION_APPROVAL",
                "QUESTION_GENERATION",
            ],
        )

        return {
            **state,
            "interview_questions": result_dict,
            "current_step": "SCHEDULING",
        }
    except Exception as ex:
        logger.error(f"[{workflow_id}] Question Generation failed after retries: {ex}")
        if step_id:
            await repo.update_step(
                step_id, status="FAILED", output_data={"error": str(ex)}
            )
        return {
            **state,
            "error": f"Question Generation failed: {str(ex)}",
            "current_step": "FAILED",
        }


# ==============================================================================
# Step 6: Interview Scheduling Node
# ==============================================================================
async def scheduling_recommendation_node(state: EvaluationState) -> EvaluationState:
    workflow_id_str = state["workflow_id"]
    workflow_id = uuid.UUID(workflow_id_str)
    step_id = (
        uuid.UUID(state["step_ids"]["SCHEDULING"])
        if "step_ids" in state and "SCHEDULING" in state["step_ids"]
        else None
    )

    logger.info(
        f"[{workflow_id}] Starting Stage 3, Step 6: Interview Scheduling & Constraint Optimization..."
    )
    if step_id:
        await repo.update_step(
            step_id, status="IN_PROGRESS", started_at=datetime.now(timezone.utc)
        )

    candidate_slots_raw = state.get("candidate_slots") or []
    interviewer_slots_raw = state.get("interviewer_slots") or []

    c_slots = [
        AvailabilitySlotInput(**s) if isinstance(s, dict) else s
        for s in candidate_slots_raw
    ]
    i_slots = [
        AvailabilitySlotInput(**s) if isinstance(s, dict) else s
        for s in interviewer_slots_raw
    ]

    async def execute_task():
        return scheduling_agent.schedule(
            candidate_id=state.get("candidate_id") or state.get("application_id"),
            interviewer_id=state.get("interviewer_id") or "default_interviewer",
            candidate_slots=c_slots,
            interviewer_slots=i_slots,
            duration_minutes=state.get("duration_minutes") or 45,
            target_timezone=state.get("timezone") or "UTC",
        )

    try:
        result: SchedulingRecommendation = await execute_with_retry_and_timeout(
            func=execute_task,
            step_name="SCHEDULING",
            workflow_id=workflow_id_str,
            max_retries=2,
            timeout_seconds=15.0,
        )
        result_dict = result.model_dump()

        if step_id:
            await repo.update_step(step_id, status="COMPLETED", output_data=result_dict)

        await repo.update_workflow_status(
            workflow_id=workflow_id,
            status="IN_PROGRESS",
            current_step="SCHEDULE_APPROVAL_GATE",
            completed_steps=[
                "JOB_ANALYSIS",
                "RESUME_ANALYSIS",
                "CANDIDATE_EVALUATION",
                "VALIDATION",
                "EVALUATION_APPROVAL",
                "QUESTION_GENERATION",
                "SCHEDULING",
            ],
        )

        return {
            **state,
            "scheduling_recommendation": result_dict,
            "current_step": "SCHEDULE_APPROVAL_GATE",
        }
    except Exception as ex:
        logger.error(f"[{workflow_id}] Scheduling Recommendation failed: {ex}")
        if step_id:
            await repo.update_step(
                step_id, status="FAILED", output_data={"error": str(ex)}
            )
        return {
            **state,
            "error": f"Scheduling Recommendation failed: {str(ex)}",
            "current_step": "FAILED",
        }


# ==============================================================================
# Approval Gate 2: Schedule Confirmation Gate
# ==============================================================================
async def schedule_approval_gate_node(state: EvaluationState) -> EvaluationState:
    """
    Approval Gate 2: Pauses workflow if human schedule confirmation is pending.
    If schedule slot confirmed, proceeds to interview creation and finalization.
    """
    from ai_service.services.callback_client import CallbackClient

    workflow_id_str = state["workflow_id"]
    workflow_id = uuid.UUID(workflow_id_str)
    app_id = uuid.UUID(state["application_id"])

    schedule_approved = state.get("schedule_approved")
    selected_slot = state.get("selected_slot")

    # If slot confirmed by recruiter/interviewer
    if schedule_approved is True or selected_slot is not None:
        logger.info(
            f"[{workflow_id}] Interview slot confirmed. Proceeding to Interview Creation..."
        )
        return {**state, "current_step": "INTERVIEW_CREATION"}

    # Otherwise, pause at Schedule Approval Gate
    logger.info(
        f"[{workflow_id}] Scheduling recommendation computed. Pausing at Schedule Confirmation Gate..."
    )

    schedule_artifact = {
        "interview_questions": state.get("interview_questions"),
        "scheduling_recommendation": state.get("scheduling_recommendation"),
    }

    await repo.update_workflow_status(
        workflow_id=workflow_id,
        status="AWAITING_SCHEDULE_APPROVAL",
        current_step="SCHEDULE_APPROVAL",
        final_result=schedule_artifact,
    )

    callback = CallbackClient()
    await callback.notify_workflow_complete(
        workflow_id=workflow_id,
        application_id=app_id,
        status="AWAITING_SCHEDULE_APPROVAL",
        final_result=schedule_artifact,
    )

    return {
        **state,
        "status": "AWAITING_SCHEDULE_APPROVAL",
        "current_step": "SCHEDULE_APPROVAL",
    }


# ==============================================================================
# Step 7: Interview Creation & Finalize Node
# ==============================================================================
async def interview_creation_node(state: EvaluationState) -> EvaluationState:
    from ai_service.services.callback_client import CallbackClient

    workflow_id_str = state["workflow_id"]
    workflow_id = uuid.UUID(workflow_id_str)
    app_id = uuid.UUID(state["application_id"])

    interview_id_str = state.get("interview_id") or str(uuid.uuid4())

    final_payload = {
        "job_analysis": state.get("job_analysis"),
        "resume_analysis": state.get("resume_analysis"),
        "candidate_evaluation": state.get("candidate_evaluation"),
        "interview_questions": state.get("interview_questions"),
        "scheduling_recommendation": state.get("scheduling_recommendation"),
        "selected_slot": state.get("selected_slot"),
        "interview_id": interview_id_str,
    }

    logger.info(
        f"[{workflow_id}] Completing entire recruitment workflow and finalizing interview {interview_id_str}..."
    )

    await repo.update_workflow_status(
        workflow_id=workflow_id,
        status="COMPLETED",
        current_step="COMPLETED",
        final_result=final_payload,
        completed_steps=[
            "JOB_ANALYSIS",
            "RESUME_ANALYSIS",
            "CANDIDATE_EVALUATION",
            "VALIDATION",
            "EVALUATION_APPROVAL",
            "QUESTION_GENERATION",
            "SCHEDULING",
            "SCHEDULE_APPROVAL",
            "INTERVIEW_CREATION",
        ],
    )

    callback = CallbackClient()
    await callback.notify_workflow_complete(
        workflow_id=workflow_id,
        application_id=app_id,
        status="COMPLETED",
        final_result=final_payload,
    )

    return {
        **state,
        "final_result": final_payload,
        "interview_id": interview_id_str,
        "status": "COMPLETED",
        "current_step": "COMPLETED",
    }


# ==============================================================================
# Rejection & Error Nodes
# ==============================================================================
async def rejection_node(state: EvaluationState) -> EvaluationState:
    from ai_service.services.callback_client import CallbackClient

    workflow_id_str = state["workflow_id"]
    workflow_id = uuid.UUID(workflow_id_str)
    app_id = uuid.UUID(state["application_id"])

    logger.info(
        f"[{workflow_id}] Candidate was rejected. Terminating workflow gracefully."
    )

    final_result = {
        "job_analysis": state.get("job_analysis"),
        "resume_analysis": state.get("resume_analysis"),
        "candidate_evaluation": state.get("candidate_evaluation"),
        "rejection_reason": state.get("evaluation_approval_notes")
        or "Rejected during recruiter review.",
    }

    await repo.update_workflow_status(
        workflow_id=workflow_id,
        status="REJECTED",
        current_step="REJECTED",
        final_result=final_result,
    )

    callback = CallbackClient()
    await callback.notify_workflow_complete(
        workflow_id=workflow_id,
        application_id=app_id,
        status="REJECTED",
        final_result=final_result,
    )

    return {**state, "status": "REJECTED", "current_step": "REJECTED"}


async def error_node(state: EvaluationState) -> EvaluationState:
    from ai_service.services.callback_client import CallbackClient

    workflow_id_str = state["workflow_id"]
    workflow_id = uuid.UUID(workflow_id_str)
    app_id = uuid.UUID(state["application_id"])
    error_msg = state.get("error") or "Execution failure encountered."

    logger.warning(f"[{workflow_id}] Workflow entered error state: {error_msg}")

    error_state = {
        "error": error_msg,
        "validation_result": state.get("validation_result"),
    }

    await repo.update_workflow_status(
        workflow_id=workflow_id,
        status="FAILED",
        current_step="FAILED",
        error_state=error_state,
    )

    callback = CallbackClient()
    await callback.notify_workflow_complete(
        workflow_id=workflow_id,
        application_id=app_id,
        status="FAILED",
        final_result={"error": error_msg},
    )

    return {**state, "status": "FAILED", "current_step": "FAILED"}
