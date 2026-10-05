"""
API Routes for triggering and monitoring AI recruitment evaluation workflows,
generating interview questions, scheduling recommendations, and managing approval gates.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
import uuid

from ai_service.core.security import verify_api_key
from ai_service.models.schemas import (
    EvaluateApplicationRequest,
    WorkflowResponse,
    GenerateQuestionsRequest,
    InterviewQuestionsPayload,
    SchedulingRequest,
    SchedulingRecommendation,
    ValidationResult,
    EvaluationApprovalRequest,
    ScheduleConfirmationRequest,
)
from ai_service.models.responses import WorkflowDetailResponse, StepResponse
from ai_service.services.workflow_service import WorkflowService
from ai_service.agents import (
    InterviewQuestionGeneratorAgent,
    InterviewSchedulingAgent,
    ValidationAgent,
)

router = APIRouter(
    prefix="/workflows", tags=["Workflows"], dependencies=[Depends(verify_api_key)]
)
workflow_service = WorkflowService()
question_agent = InterviewQuestionGeneratorAgent()
scheduling_agent = InterviewSchedulingAgent()
validation_agent = ValidationAgent()


@router.post(
    "/evaluate", response_model=WorkflowResponse, status_code=status.HTTP_202_ACCEPTED
)
async def trigger_evaluation_workflow(request: EvaluateApplicationRequest):
    """
    Triggers asynchronous LangGraph multi-agent recruitment evaluation workflow:
    1. Job Description Analysis Agent
    2. Resume Analysis Agent
    3. Candidate Evaluation & Ranking Agent
    4. Deterministic Schema & Constraint Validation
    5. Pauses at Recruiter Review Gate (AWAITING_APPROVAL)
    """
    response = await workflow_service.start_evaluation(request)
    return response


@router.post("/{workflow_id}/approve-evaluation", response_model=WorkflowResponse)
async def approve_candidate_evaluation(
    workflow_id: uuid.UUID, request: EvaluationApprovalRequest
):
    """
    Approval Gate 1: Recruiter reviews AI evaluation.
    - If decision == 'APPROVED': Resumes workflow to generate tailored interview questions and schedule slots.
    - If decision == 'REJECTED': Terminates workflow with status REJECTED.
    """
    try:
        return await workflow_service.submit_evaluation_approval(workflow_id, request)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))


@router.post("/{workflow_id}/confirm-schedule", response_model=WorkflowResponse)
async def confirm_interview_schedule(
    workflow_id: uuid.UUID, request: ScheduleConfirmationRequest
):
    """
    Approval Gate 2: Recruiter / Candidate confirms selected interview slot.
    Resumes workflow to finalize the Interview entity and mark workflow as COMPLETED.
    """
    try:
        return await workflow_service.confirm_schedule_slot(workflow_id, request)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))


@router.post("/generate-questions", response_model=InterviewQuestionsPayload)
async def generate_interview_questions(request: GenerateQuestionsRequest):
    """
    Agent 5: Generates tailored interview questions (Technical, Behavioral, Problem Solving, Project-Based)
    with scoring rubrics and difficulty ratings.
    """
    return await question_agent.execute(
        job_analysis=request.job_analysis,
        resume_analysis=request.resume_analysis,
        candidate_evaluation=request.candidate_evaluation,
        count_per_category=request.count_per_category,
    )


@router.post("/recommend-schedule", response_model=SchedulingRecommendation)
async def recommend_interview_schedule(request: SchedulingRequest):
    """
    Agent 6: Recommends optimal interview time slots by analyzing candidate and interviewer availability.
    """
    return await scheduling_agent.execute(request)


@router.post("/validate", response_model=ValidationResult)
async def validate_artifact(artifact: Dict[str, Any]):
    """
    Agent 4: Deterministically validates schema compliance and domain business rules for any artifact.
    """
    return validation_agent.validate(artifact)


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow_status(workflow_id: uuid.UUID):
    """
    Returns basic status and current active step for a workflow.
    """
    res = await workflow_service.get_workflow_status(workflow_id)
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AiWorkflow with ID {workflow_id} not found.",
        )
    return res


@router.get("/{workflow_id}/details", response_model=WorkflowDetailResponse)
async def get_workflow_details(workflow_id: uuid.UUID):
    """
    Returns full workflow lifecycle state, steps, agent outputs, and final evaluation result.
    """
    res = await workflow_service.get_workflow_details(workflow_id)
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AiWorkflow with ID {workflow_id} not found.",
        )
    return res


@router.get("/{workflow_id}/steps", response_model=List[StepResponse])
async def get_workflow_steps(workflow_id: uuid.UUID):
    """
    Returns all executed and pending steps for a workflow.
    """
    return await workflow_service.get_workflow_steps(workflow_id)
