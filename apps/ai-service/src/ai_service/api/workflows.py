"""
API Routes for triggering and monitoring AI recruitment evaluation workflows.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import uuid

from ai_service.core.security import verify_api_key
from ai_service.models.schemas import EvaluateApplicationRequest, WorkflowResponse
from ai_service.models.responses import WorkflowDetailResponse, StepResponse
from ai_service.services.workflow_service import WorkflowService

router = APIRouter(prefix="/workflows", tags=["Workflows"], dependencies=[Depends(verify_api_key)])
workflow_service = WorkflowService()

@router.post("/evaluate", response_model=WorkflowResponse, status_code=status.HTTP_202_ACCEPTED)
async def trigger_evaluation_workflow(request: EvaluateApplicationRequest):
    """
    Triggers asynchronous LangGraph multi-agent recruitment evaluation workflow:
    1. Job Description Analysis Agent
    2. Resume Analysis Agent
    3. Candidate Evaluation & Ranking Agent
    4. Deterministic Schema & Constraint Validation
    5. Finalize & Notify ASP.NET API
    """
    response = await workflow_service.start_evaluation(request)
    return response

@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow_status(workflow_id: uuid.UUID):
    """
    Returns basic status and current active step for a workflow.
    """
    res = await workflow_service.get_workflow_status(workflow_id)
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AiWorkflow with ID {workflow_id} not found."
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
            detail=f"AiWorkflow with ID {workflow_id} not found."
        )
    return res

@router.get("/{workflow_id}/steps", response_model=List[StepResponse])
async def get_workflow_steps(workflow_id: uuid.UUID):
    """
    Returns all executed and pending steps for a workflow.
    """
    return await workflow_service.get_workflow_steps(workflow_id)

@router.post("/{workflow_id}/resume", response_model=WorkflowResponse)
async def resume_workflow_after_approval(workflow_id: uuid.UUID):
    """
    Resumes a paused workflow following recruiter approval.
    """
    wf = await workflow_service.get_workflow_status(workflow_id)
    if not wf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AiWorkflow with ID {workflow_id} not found."
        )
    return wf
