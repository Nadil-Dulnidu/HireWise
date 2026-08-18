"""
Async Repository for persisting and querying AI Workflows and Steps in PostgreSQL.
Directly interfaces with EF Core managed 'AiWorkflows' and 'AiWorkflowSteps' tables.
"""
import json
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from psycopg.rows import dict_row
from ai_service.db.connection import get_db_pool
from ai_service.core.logging import logger

class WorkflowRepository:
    def __init__(self):
        pass

    async def create_workflow(
        self,
        workflow_id: uuid.UUID,
        application_id: uuid.UUID,
        objective: str,
        plan: Optional[List[Dict[str, Any]]] = None
    ) -> uuid.UUID:
        """
        Creates a new AiWorkflow record with status IN_PROGRESS.
        """
        pool = await get_db_pool()
        now = datetime.now(timezone.utc)
        plan_json = json.dumps(plan) if plan else json.dumps([
            {"step": 1, "name": "JOB_ANALYSIS", "agent": "Job Description Analysis Agent"},
            {"step": 2, "name": "RESUME_ANALYSIS", "agent": "Resume Analysis Agent"},
            {"step": 3, "name": "CANDIDATE_EVALUATION", "agent": "Candidate Evaluation & Ranking Agent"},
            {"step": 4, "name": "VALIDATION", "agent": "Validation Agent"}
        ])

        query = """
        INSERT INTO "AiWorkflows" (
            "Id", "ApplicationId", "Objective", "CurrentStep", "Status",
            "PlanJson", "CompletedStepsJson", "ErrorStateJson", "FinalResultJson",
            "StartedAt", "CreatedAt", "UpdatedAt", "IsDeleted"
        ) VALUES (
            %s, %s, %s, %s, %s,
            %s, %s, %s, %s,
            %s, %s, %s, %s
        )
        RETURNING "Id";
        """

        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    query,
                    (
                        str(workflow_id),
                        str(application_id),
                        objective,
                        "JOB_ANALYSIS",
                        "IN_PROGRESS",
                        plan_json,
                        json.dumps([]),
                        None,
                        None,
                        now,
                        now,
                        now,
                        False
                    )
                )
                await conn.commit()
                logger.info(f"Created AiWorkflow {workflow_id} for Application {application_id}")
                return workflow_id

    async def update_workflow_status(
        self,
        workflow_id: uuid.UUID,
        status: str,
        current_step: str,
        final_result: Optional[Dict[str, Any]] = None,
        error_state: Optional[Dict[str, Any]] = None,
        completed_steps: Optional[List[str]] = None
    ):
        """
        Updates workflow lifecycle state, progress, or completion result.
        """
        pool = await get_db_pool()
        now = datetime.now(timezone.utc)
        completed_at = now if status in ("COMPLETED", "AWAITING_APPROVAL", "FAILED") else None

        query = """
        UPDATE "AiWorkflows"
        SET
            "Status" = %s,
            "CurrentStep" = %s,
            "FinalResultJson" = COALESCE(%s, "FinalResultJson"),
            "ErrorStateJson" = COALESCE(%s, "ErrorStateJson"),
            "CompletedStepsJson" = COALESCE(%s, "CompletedStepsJson"),
            "CompletedAt" = COALESCE(%s, "CompletedAt"),
            "UpdatedAt" = %s
        WHERE "Id" = %s AND "IsDeleted" = FALSE;
        """

        final_json = json.dumps(final_result) if final_result is not None else None
        err_json = json.dumps(error_state) if error_state is not None else None
        steps_json = json.dumps(completed_steps) if completed_steps is not None else None

        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    query,
                    (
                        status,
                        current_step,
                        final_json,
                        err_json,
                        steps_json,
                        completed_at,
                        now,
                        str(workflow_id)
                    )
                )
                await conn.commit()

    async def get_workflow(self, workflow_id: uuid.UUID) -> Optional[Dict[str, Any]]:
        """
        Fetches an AiWorkflow by ID.
        """
        pool = await get_db_pool()
        query = """
        SELECT
            "Id", "ApplicationId", "Objective", "CurrentStep", "Status",
            "PlanJson", "CompletedStepsJson", "ErrorStateJson", "FinalResultJson",
            "StartedAt", "CompletedAt", "CreatedAt", "UpdatedAt"
        FROM "AiWorkflows"
        WHERE "Id" = %s AND "IsDeleted" = FALSE;
        """

        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(query, (str(workflow_id),))
                row = await cur.fetchone()
                return dict(row) if row else None

    async def create_step(
        self,
        step_id: uuid.UUID,
        workflow_id: uuid.UUID,
        agent_name: str,
        step_name: str,
        step_order: int,
        status: str = "PENDING",
        input_data: Optional[Dict[str, Any]] = None
    ) -> uuid.UUID:
        """
        Creates an individual AiWorkflowStep record.
        """
        pool = await get_db_pool()
        now = datetime.now(timezone.utc)
        input_json = json.dumps(input_data) if input_data else None

        query = """
        INSERT INTO "AiWorkflowSteps" (
            "Id", "WorkflowId", "AgentName", "StepName", "StepOrder",
            "Status", "InputJson", "OutputJson", "ValidationResultJson",
            "RetryCount", "StartedAt", "CreatedAt", "UpdatedAt", "IsDeleted"
        ) VALUES (
            %s, %s, %s, %s, %s,
            %s, %s, %s, %s,
            %s, %s, %s, %s, %s
        )
        RETURNING "Id";
        """

        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    query,
                    (
                        str(step_id),
                        str(workflow_id),
                        agent_name,
                        step_name,
                        step_order,
                        status,
                        input_json,
                        None,
                        None,
                        0,
                        now if status == "IN_PROGRESS" else None,
                        now,
                        now,
                        False
                    )
                )
                await conn.commit()
                return step_id

    async def update_step(
        self,
        step_id: uuid.UUID,
        status: str,
        output_data: Optional[Dict[str, Any]] = None,
        validation_data: Optional[Dict[str, Any]] = None,
        started_at: Optional[datetime] = None
    ):
        """
        Updates step execution status and payload.
        """
        pool = await get_db_pool()
        now = datetime.now(timezone.utc)
        completed_at = now if status in ("COMPLETED", "FAILED", "SKIPPED") else None
        output_json = json.dumps(output_data) if output_data is not None else None
        val_json = json.dumps(validation_data) if validation_data is not None else None

        query = """
        UPDATE "AiWorkflowSteps"
        SET
            "Status" = %s,
            "OutputJson" = COALESCE(%s, "OutputJson"),
            "ValidationResultJson" = COALESCE(%s, "ValidationResultJson"),
            "StartedAt" = COALESCE(%s, "StartedAt"),
            "CompletedAt" = COALESCE(%s, "CompletedAt"),
            "UpdatedAt" = %s
        WHERE "Id" = %s AND "IsDeleted" = FALSE;
        """

        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    query,
                    (
                        status,
                        output_json,
                        val_json,
                        started_at,
                        completed_at,
                        now,
                        str(step_id)
                    )
                )
                await conn.commit()

    async def get_steps(self, workflow_id: uuid.UUID) -> List[Dict[str, Any]]:
        """
        Returns all steps for a given workflow ordered by StepOrder.
        """
        pool = await get_db_pool()
        query = """
        SELECT
            "Id", "WorkflowId", "AgentName", "StepName", "StepOrder",
            "Status", "InputJson", "OutputJson", "ValidationResultJson",
            "ApprovalStatus", "ApprovedByUserId", "ApprovedAt", "ApprovalNotes",
            "RetryCount", "StartedAt", "CompletedAt", "CreatedAt", "UpdatedAt"
        FROM "AiWorkflowSteps"
        WHERE "WorkflowId" = %s AND "IsDeleted" = FALSE
        ORDER BY "StepOrder" ASC;
        """

        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(query, (str(workflow_id),))
                rows = await cur.fetchall()
                return [dict(r) for r in rows]
