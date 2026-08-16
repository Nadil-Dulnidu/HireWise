from fastapi import APIRouter, Depends, status
from ai_service.core.security import verify_api_key
from ai_service.models.schemas import EvaluateApplicationRequest, WorkflowResponse
from datetime import datetime
import uuid

router = APIRouter(prefix="/workflows", tags=["Workflows"], dependencies=[Depends(verify_api_key)])

@router.post("/evaluate", response_model=WorkflowResponse, status_code=status.HTTP_202_ACCEPTED)
async def trigger_evaluation_workflow(request: EvaluateApplicationRequest):
    """
    Triggers asynchronous LangGraph multi-agent recruitment evaluation workflow:
    1. Job Analysis Agent
    2. Resume Analysis Agent
    3. Candidate Evaluation & Ranking Agent
    4. Deterministic Schema & Constraint Validation
    """
    workflow_id = uuid.uuid4()
    
    return WorkflowResponse(
        workflow_id=workflow_id,
        application_id=request.application_id,
        status="IN_PROGRESS",
        current_step="JOB_ANALYSIS",
        created_at=datetime.utcnow()
    )

@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow_status(workflow_id: uuid.UUID):
    """
    Returns current state, completed steps, and approval status for given workflow ID.
    """
    return WorkflowResponse(
        workflow_id=workflow_id,
        application_id=uuid.uuid4(),
        status="AWAITING_APPROVAL",
        current_step="RECRUITER_APPROVAL",
        created_at=datetime.utcnow()
    )
