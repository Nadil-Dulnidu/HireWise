"""
Detailed Response Schemas for AI Workflows and Step Monitoring.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

class StepResponse(BaseModel):
    id: uuid.UUID
    workflow_id: uuid.UUID
    agent_name: str
    step_name: str
    step_order: int
    status: str
    input_data: Optional[Dict[str, Any]] = None
    output_data: Optional[Dict[str, Any]] = None
    validation_result: Optional[Dict[str, Any]] = None
    retry_count: int = 0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class WorkflowDetailResponse(BaseModel):
    workflow_id: uuid.UUID
    application_id: uuid.UUID
    objective: str
    status: str
    current_step: str
    plan: Optional[List[Dict[str, Any]]] = None
    completed_steps: Optional[List[str]] = None
    final_result: Optional[Dict[str, Any]] = None
    error_state: Optional[Dict[str, Any]] = None
    steps: List[StepResponse] = Field(default_factory=list)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
