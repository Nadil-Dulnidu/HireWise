"""
Workflow Service for triggering, monitoring, and managing LangGraph evaluation pipelines.
"""
import uuid
import asyncio
import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from ai_service.core.logging import logger
from ai_service.db.repository import WorkflowRepository
from ai_service.graph.builder import build_evaluation_graph
from ai_service.graph.state import EvaluationState
from ai_service.models.schemas import EvaluateApplicationRequest, WorkflowResponse
from ai_service.models.responses import WorkflowDetailResponse, StepResponse

class WorkflowService:
    def __init__(self):
        self.repo = WorkflowRepository()
        self._graph = None

    def _get_graph(self):
        if self._graph is None:
            self._graph = build_evaluation_graph()
        return self._graph

    async def start_evaluation(self, request: EvaluateApplicationRequest) -> WorkflowResponse:
        """
        Creates DB records for workflow and steps, then triggers LangGraph asynchronously.
        """
        workflow_id = uuid.uuid4()
        app_id = request.application_id
        now = datetime.now(timezone.utc)

        # 1. Create Workflow row in PostgreSQL
        objective = f"AI Multi-Agent Recruitment Evaluation for '{request.job_title}'"
        await self.repo.create_workflow(
            workflow_id=workflow_id,
            application_id=app_id,
            objective=objective
        )

        # 2. Pre-create the 4 execution steps
        step_definitions = [
            ("JOB_ANALYSIS", "Job Description Analysis Agent", 1, {"job_title": request.job_title}),
            ("RESUME_ANALYSIS", "Resume Analysis Agent", 2, {"resume_url": request.candidate_resume_url}),
            ("CANDIDATE_EVALUATION", "Candidate Evaluation & Ranking Agent", 3, {}),
            ("VALIDATION", "Deterministic Validation Agent", 4, {})
        ]

        step_ids: Dict[str, str] = {}
        for step_name, agent_name, step_order, input_data in step_definitions:
            s_id = uuid.uuid4()
            step_ids[step_name] = str(s_id)
            await self.repo.create_step(
                step_id=s_id,
                workflow_id=workflow_id,
                agent_name=agent_name,
                step_name=step_name,
                step_order=step_order,
                status="PENDING",
                input_data=input_data
            )

        # 3. Assemble initial LangGraph state
        initial_state: EvaluationState = {
            "workflow_id": str(workflow_id),
            "application_id": str(app_id),
            "step_ids": step_ids,
            "job_title": request.job_title,
            "job_description": request.job_description,
            "job_requirements": request.job_requirements,
            "candidate_resume_url": request.candidate_resume_url,
            "current_step": "JOB_ANALYSIS"
        }

        # 4. Fire background execution of LangGraph
        graph = self._get_graph()
        asyncio.create_task(self._run_workflow_graph(graph, initial_state, workflow_id))

        logger.info(f"Triggered asynchronous evaluation workflow {workflow_id} for application {app_id}")

        return WorkflowResponse(
            workflow_id=workflow_id,
            application_id=app_id,
            status="IN_PROGRESS",
            current_step="JOB_ANALYSIS",
            created_at=now
        )

    async def _run_workflow_graph(self, graph, initial_state: EvaluationState, workflow_id: uuid.UUID):
        """
        Background worker executing the LangGraph compiled state machine.
        """
        logger.info(f"[{workflow_id}] Starting LangGraph state machine execution...")
        try:
            result = await graph.ainvoke(initial_state)
            logger.info(f"[{workflow_id}] LangGraph execution completed with current_step={result.get('current_step')}")
        except Exception as ex:
            logger.error(f"[{workflow_id}] Uncaught exception during LangGraph execution: {ex}", exc_info=True)
            await self.repo.update_workflow_status(
                workflow_id=workflow_id,
                status="FAILED",
                current_step="FAILED",
                error_state={"exception": str(ex)}
            )

    async def get_workflow_status(self, workflow_id: uuid.UUID) -> Optional[WorkflowResponse]:
        """
        Fetches basic status of workflow for polling or fast checks.
        """
        wf = await self.repo.get_workflow(workflow_id)
        if not wf:
            return None

        return WorkflowResponse(
            workflow_id=uuid.UUID(str(wf["Id"])),
            application_id=uuid.UUID(str(wf["ApplicationId"])),
            status=wf["Status"],
            current_step=wf["CurrentStep"],
            created_at=wf["CreatedAt"]
        )

    async def get_workflow_details(self, workflow_id: uuid.UUID) -> Optional[WorkflowDetailResponse]:
        """
        Fetches full workflow details including steps and artifacts.
        """
        wf = await self.repo.get_workflow(workflow_id)
        if not wf:
            return None

        steps_data = await self.repo.get_steps(workflow_id)
        steps_list = []
        for s in steps_data:
            input_val = json.loads(s["InputJson"]) if isinstance(s.get("InputJson"), str) else s.get("InputJson")
            output_val = json.loads(s["OutputJson"]) if isinstance(s.get("OutputJson"), str) else s.get("OutputJson")
            val_result = json.loads(s["ValidationResultJson"]) if isinstance(s.get("ValidationResultJson"), str) else s.get("ValidationResultJson")

            steps_list.append(StepResponse(
                id=uuid.UUID(str(s["Id"])),
                workflow_id=uuid.UUID(str(s["WorkflowId"])),
                agent_name=s["AgentName"],
                step_name=s["StepName"],
                step_order=s["StepOrder"],
                status=s["Status"],
                input_data=input_val,
                output_data=output_val,
                validation_result=val_result,
                retry_count=s.get("RetryCount", 0),
                started_at=s.get("StartedAt"),
                completed_at=s.get("CompletedAt")
            ))

        plan_val = json.loads(wf["PlanJson"]) if isinstance(wf.get("PlanJson"), str) else wf.get("PlanJson")
        completed_val = json.loads(wf["CompletedStepsJson"]) if isinstance(wf.get("CompletedStepsJson"), str) else wf.get("CompletedStepsJson")
        final_val = json.loads(wf["FinalResultJson"]) if isinstance(wf.get("FinalResultJson"), str) else wf.get("FinalResultJson")
        error_val = json.loads(wf["ErrorStateJson"]) if isinstance(wf.get("ErrorStateJson"), str) else wf.get("ErrorStateJson")

        return WorkflowDetailResponse(
            workflow_id=uuid.UUID(str(wf["Id"])),
            application_id=uuid.UUID(str(wf["ApplicationId"])),
            objective=wf["Objective"],
            status=wf["Status"],
            current_step=wf["CurrentStep"],
            plan=plan_val,
            completed_steps=completed_val,
            final_result=final_val,
            error_state=error_val,
            steps=steps_list,
            started_at=wf.get("StartedAt"),
            completed_at=wf.get("CompletedAt"),
            created_at=wf["CreatedAt"]
        )

    async def get_workflow_steps(self, workflow_id: uuid.UUID) -> List[StepResponse]:
        """
        Returns only the steps for a workflow.
        """
        details = await self.get_workflow_details(workflow_id)
        return details.steps if details else []
