"""
Workflow Service for triggering, monitoring, approving, and resuming multi-agent recruitment pipelines.
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
from ai_service.models.schemas import (
    EvaluateApplicationRequest,
    WorkflowResponse,
    EvaluationApprovalRequest,
    ScheduleConfirmationRequest,
)
from ai_service.models.responses import WorkflowDetailResponse, StepResponse


class WorkflowService:
    def __init__(self):
        self.repo = WorkflowRepository()
        self._graph = None

    def _get_graph(self):
        if self._graph is None:
            self._graph = build_evaluation_graph()
        return self._graph

    async def start_evaluation(
        self, request: EvaluateApplicationRequest
    ) -> WorkflowResponse:
        """
        Creates DB records for workflow and steps, then triggers LangGraph asynchronously.
        """
        workflow_id = uuid.uuid4()
        app_id = request.application_id
        now = datetime.now(timezone.utc)

        # 1. Create Workflow row in PostgreSQL
        objective = f"AI Multi-Agent Recruitment Pipeline for '{request.job_title}'"
        await self.repo.create_workflow(
            workflow_id=workflow_id, application_id=app_id, objective=objective
        )

        # 2. Pre-create the execution steps
        step_definitions = [
            (
                "JOB_ANALYSIS",
                "Job Description Analysis Agent",
                1,
                {"job_title": request.job_title},
            ),
            (
                "RESUME_ANALYSIS",
                "Resume Analysis Agent",
                2,
                {"resume_url": request.candidate_resume_url},
            ),
            ("CANDIDATE_EVALUATION", "Candidate Evaluation & Ranking Agent", 3, {}),
            ("VALIDATION", "Deterministic Validation Agent", 4, {}),
            ("EVALUATION_APPROVAL", "Recruiter Evaluation Review Gate", 5, {}),
            ("QUESTION_GENERATION", "Interview Question Generator Agent", 6, {}),
            ("SCHEDULING", "Interview Scheduling Agent", 7, {}),
            ("SCHEDULE_APPROVAL", "Recruiter Schedule Confirmation Gate", 8, {}),
            ("INTERVIEW_CREATION", "Interview Entity Finalization", 9, {}),
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
                input_data=input_data,
            )

        c_slots_dump = (
            [s.model_dump(mode="json") for s in request.candidate_slots]
            if request.candidate_slots
            else []
        )
        i_slots_dump = (
            [s.model_dump(mode="json") for s in request.interviewer_slots]
            if request.interviewer_slots
            else []
        )

        cand_id_val = request.candidate_id
        inv_id_val = request.interviewer_id

        if not c_slots_dump or not i_slots_dump:
            try:
                cand_db, inv_db, c_db, i_db = await self.repo.get_availability_slots_for_application(app_id)
                if not c_slots_dump and c_db:
                    c_slots_dump = c_db
                if not i_slots_dump and i_db:
                    i_slots_dump = i_db
                if not cand_id_val and cand_db:
                    cand_id_val = cand_db
                if not inv_id_val and inv_db:
                    inv_id_val = inv_db
            except Exception as e:
                logger.warning(f"[{workflow_id}] Error resolving availability slots from DB: {e}")

        # 3. Assemble initial LangGraph state
        initial_state: EvaluationState = {
            "workflow_id": str(workflow_id),
            "application_id": str(app_id),
            "step_ids": step_ids,
            "job_title": request.job_title,
            "job_description": request.job_description,
            "job_requirements": request.job_requirements,
            "candidate_resume_url": request.candidate_resume_url,
            "candidate_id": cand_id_val or str(app_id),
            "interviewer_id": inv_id_val,
            "candidate_slots": c_slots_dump,
            "interviewer_slots": i_slots_dump,
            "current_step": "JOB_ANALYSIS",
            "status": "IN_PROGRESS",
        }

        # 4. Fire background execution of LangGraph
        graph = self._get_graph()
        asyncio.create_task(self._run_workflow_graph(graph, initial_state, workflow_id))

        logger.info(
            f"Triggered asynchronous evaluation workflow {workflow_id} for application {app_id}"
        )

        return WorkflowResponse(
            workflow_id=workflow_id,
            application_id=app_id,
            status="IN_PROGRESS",
            current_step="JOB_ANALYSIS",
            created_at=now,
        )

    async def submit_evaluation_approval(
        self, workflow_id: uuid.UUID, request: EvaluationApprovalRequest
    ) -> WorkflowResponse:
        """
        Processes human recruiter approval decision at Gate 1.
        If APPROVED -> resumes LangGraph to generate interview questions and scheduling recommendations.
        If REJECTED -> marks workflow as REJECTED.
        """
        wf = await self.repo.get_workflow(workflow_id)
        if not wf:
            raise ValueError(f"Workflow {workflow_id} not found.")

        app_id = uuid.UUID(str(wf["ApplicationId"]))
        steps = await self.repo.get_steps(workflow_id)
        step_ids = {s["StepName"]: str(s["Id"]) for s in steps}

        # Find approval step
        eval_step_id = (
            uuid.UUID(step_ids["EVALUATION_APPROVAL"])
            if "EVALUATION_APPROVAL" in step_ids
            else None
        )
        if eval_step_id:
            await self.repo.update_step_approval(
                step_id=eval_step_id,
                approval_status=request.decision.upper(),
                approved_by_user_id=request.approved_by_user_id,
                approval_notes=request.notes,
            )
            await self.repo.update_step(
                step_id=eval_step_id,
                status="COMPLETED"
                if request.decision.upper() == "APPROVED"
                else "REJECTED",
            )

        final_result = (
            json.loads(wf["FinalResultJson"])
            if isinstance(wf.get("FinalResultJson"), str)
            else wf.get("FinalResultJson") or {}
        )

        if request.decision.upper() == "REJECTED":
            await self.repo.update_workflow_status(
                workflow_id=workflow_id, status="REJECTED", current_step="REJECTED"
            )
            return WorkflowResponse(
                workflow_id=workflow_id,
                application_id=app_id,
                status="REJECTED",
                current_step="REJECTED",
                created_at=wf["CreatedAt"],
            )

        # Extract candidate slots and interviewer slots
        c_slots_req = (
            [s.model_dump(mode="json") if hasattr(s, "model_dump") else s for s in request.candidate_slots]
            if request.candidate_slots
            else final_result.get("candidate_slots") or []
        )
        i_slots_req = (
            [s.model_dump(mode="json") if hasattr(s, "model_dump") else s for s in request.interviewer_slots]
            if request.interviewer_slots
            else final_result.get("interviewer_slots") or []
        )
        cand_id_resolved = request.candidate_id or final_result.get("candidate_id")
        inv_id_resolved = request.interviewer_id or final_result.get("interviewer_id")

        if not c_slots_req or not i_slots_req:
            try:
                cand_db, inv_db, c_db, i_db = await self.repo.get_availability_slots_for_application(app_id)
                if not c_slots_req and c_db:
                    c_slots_req = c_db
                if not i_slots_req and i_db:
                    i_slots_req = i_db
                if not cand_id_resolved and cand_db:
                    cand_id_resolved = cand_db
                if not inv_id_resolved and inv_db:
                    inv_id_resolved = inv_db
            except Exception as e:
                logger.warning(f"[{workflow_id}] Error resolving availability slots from DB in submit_evaluation_approval: {e}")

        # Build resume state to proceed to Stage 2 (Question Generation)
        resume_state: EvaluationState = {
            "workflow_id": str(workflow_id),
            "application_id": str(app_id),
            "step_ids": step_ids,
            "job_analysis": final_result.get("job_analysis"),
            "resume_analysis": final_result.get("resume_analysis"),
            "candidate_evaluation": final_result.get("candidate_evaluation"),
            "validation_result": final_result.get("validation_result"),
            "candidate_id": cand_id_resolved,
            "interviewer_id": inv_id_resolved,
            "candidate_slots": c_slots_req,
            "interviewer_slots": i_slots_req,
            "duration_minutes": request.duration_minutes or final_result.get("duration_minutes") or 45,
            "timezone": request.timezone or final_result.get("timezone") or "UTC",
            "evaluation_approved": True,
            "evaluation_approval_notes": request.notes,
            "evaluation_approved_by": str(request.approved_by_user_id)
            if request.approved_by_user_id
            else None,
            "current_step": "QUESTION_GENERATION",
            "status": "IN_PROGRESS",
        }

        graph = self._get_graph()
        asyncio.create_task(self._run_workflow_graph(graph, resume_state, workflow_id))

        logger.info(
            f"[{workflow_id}] Resumed workflow into Stage 2 (Question Generation & Scheduling) following approval."
        )

        return WorkflowResponse(
            workflow_id=workflow_id,
            application_id=app_id,
            status="IN_PROGRESS",
            current_step="QUESTION_GENERATION",
            created_at=wf["CreatedAt"],
        )

    async def confirm_schedule_slot(
        self, workflow_id: uuid.UUID, request: ScheduleConfirmationRequest
    ) -> WorkflowResponse:
        """
        Processes human schedule slot confirmation at Gate 2.
        Resumes LangGraph to finalize interview entity and complete workflow.
        """
        wf = await self.repo.get_workflow(workflow_id)
        if not wf:
            raise ValueError(f"Workflow {workflow_id} not found.")

        app_id = uuid.UUID(str(wf["ApplicationId"]))
        steps = await self.repo.get_steps(workflow_id)
        step_ids = {s["StepName"]: str(s["Id"]) for s in steps}

        sched_step_id = (
            uuid.UUID(step_ids["SCHEDULE_APPROVAL"])
            if "SCHEDULE_APPROVAL" in step_ids
            else None
        )
        if sched_step_id:
            await self.repo.update_step_approval(
                step_id=sched_step_id,
                approval_status="APPROVED",
                approved_by_user_id=request.approved_by_user_id,
                approval_notes=request.notes,
            )
            await self.repo.update_step(
                step_id=sched_step_id,
                status="COMPLETED",
                output_data=request.selected_slot.model_dump(mode="json"),
            )

        final_result = (
            json.loads(wf["FinalResultJson"])
            if isinstance(wf.get("FinalResultJson"), str)
            else wf.get("FinalResultJson") or {}
        )

        resume_state: EvaluationState = {
            "workflow_id": str(workflow_id),
            "application_id": str(app_id),
            "step_ids": step_ids,
            "job_analysis": final_result.get("job_analysis"),
            "resume_analysis": final_result.get("resume_analysis"),
            "candidate_evaluation": final_result.get("candidate_evaluation"),
            "interview_questions": final_result.get("interview_questions"),
            "scheduling_recommendation": final_result.get("scheduling_recommendation"),
            "selected_slot": request.selected_slot.model_dump(mode="json"),
            "interview_id": request.interview_id or str(uuid.uuid4()),
            "schedule_approved": True,
            "schedule_approval_notes": request.notes,
            "schedule_approved_by": str(request.approved_by_user_id)
            if request.approved_by_user_id
            else None,
            "current_step": "INTERVIEW_CREATION",
            "status": "IN_PROGRESS",
        }

        graph = self._get_graph()
        asyncio.create_task(self._run_workflow_graph(graph, resume_state, workflow_id))

        logger.info(
            f"[{workflow_id}] Resumed workflow into finalization following schedule confirmation."
        )

        return WorkflowResponse(
            workflow_id=workflow_id,
            application_id=app_id,
            status="IN_PROGRESS",
            current_step="INTERVIEW_CREATION",
            created_at=wf["CreatedAt"],
        )

    async def _run_workflow_graph(
        self, graph, initial_state: EvaluationState, workflow_id: uuid.UUID
    ):
        """
        Background worker executing the LangGraph compiled state machine.
        """
        logger.info(f"[{workflow_id}] Starting LangGraph state machine execution...")
        try:
            result = await graph.ainvoke(initial_state)
            logger.info(
                f"[{workflow_id}] LangGraph execution completed with current_step={result.get('current_step')}, status={result.get('status')}"
            )
        except Exception as ex:
            logger.error(
                f"[{workflow_id}] Uncaught exception during LangGraph execution: {ex}",
                exc_info=True,
            )
            await self.repo.update_workflow_status(
                workflow_id=workflow_id,
                status="FAILED",
                current_step="FAILED",
                error_state={"exception": str(ex)},
            )

    async def get_workflow_status(
        self, workflow_id: uuid.UUID
    ) -> Optional[WorkflowResponse]:
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
            created_at=wf["CreatedAt"],
        )

    async def get_workflow_details(
        self, workflow_id: uuid.UUID
    ) -> Optional[WorkflowDetailResponse]:
        """
        Fetches full workflow details including steps and artifacts.
        """
        wf = await self.repo.get_workflow(workflow_id)
        if not wf:
            return None

        steps_data = await self.repo.get_steps(workflow_id)
        steps_list = []
        for s in steps_data:
            input_val = (
                json.loads(s["InputJson"])
                if isinstance(s.get("InputJson"), str)
                else s.get("InputJson")
            )
            output_val = (
                json.loads(s["OutputJson"])
                if isinstance(s.get("OutputJson"), str)
                else s.get("OutputJson")
            )
            val_result = (
                json.loads(s["ValidationResultJson"])
                if isinstance(s.get("ValidationResultJson"), str)
                else s.get("ValidationResultJson")
            )

            steps_list.append(
                StepResponse(
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
                    completed_at=s.get("CompletedAt"),
                )
            )

        plan_val = (
            json.loads(wf["PlanJson"])
            if isinstance(wf.get("PlanJson"), str)
            else wf.get("PlanJson")
        )
        completed_val = (
            json.loads(wf["CompletedStepsJson"])
            if isinstance(wf.get("CompletedStepsJson"), str)
            else wf.get("CompletedStepsJson")
        )
        final_val = (
            json.loads(wf["FinalResultJson"])
            if isinstance(wf.get("FinalResultJson"), str)
            else wf.get("FinalResultJson")
        )
        error_val = (
            json.loads(wf["ErrorStateJson"])
            if isinstance(wf.get("ErrorStateJson"), str)
            else wf.get("ErrorStateJson")
        )

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
            created_at=wf["CreatedAt"],
        )

    async def get_workflow_steps(self, workflow_id: uuid.UUID) -> List[StepResponse]:
        """
        Returns only the steps for a workflow.
        """
        details = await self.get_workflow_details(workflow_id)
        return details.steps if details else []
