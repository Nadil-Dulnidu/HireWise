"""
Async Repository for persisting and querying AI Workflows and Steps in PostgreSQL.
Directly interfaces with EF Core managed 'AiWorkflows' and 'AiWorkflowSteps' tables.
"""

import json
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any, Tuple
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
        plan: Optional[List[Dict[str, Any]]] = None,
    ) -> uuid.UUID:
        """
        Creates a new AiWorkflow record with status IN_PROGRESS.
        """
        pool = await get_db_pool()
        now = datetime.now(timezone.utc)
        plan_json = (
            json.dumps(plan)
            if plan
            else json.dumps(
                [
                    {
                        "step": 1,
                        "name": "JOB_ANALYSIS",
                        "agent": "Job Description Analysis Agent",
                    },
                    {
                        "step": 2,
                        "name": "RESUME_ANALYSIS",
                        "agent": "Resume Analysis Agent",
                    },
                    {
                        "step": 3,
                        "name": "CANDIDATE_EVALUATION",
                        "agent": "Candidate Evaluation & Ranking Agent",
                    },
                    {
                        "step": 4,
                        "name": "VALIDATION",
                        "agent": "Deterministic Validation Agent",
                    },
                    {
                        "step": 5,
                        "name": "QUESTION_GENERATION",
                        "agent": "Interview Question Generator Agent",
                    },
                    {
                        "step": 6,
                        "name": "SCHEDULING",
                        "agent": "Interview Scheduling Agent",
                    },
                ]
            )
        )

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
                # 1. Clean up existing workflow and steps for this application if one exists (re-evaluation)
                await cur.execute(
                    """
                    DELETE FROM "AiWorkflowSteps"
                    WHERE "WorkflowId" IN (
                        SELECT "Id" FROM "AiWorkflows" WHERE "ApplicationId" = %s
                    );
                    """,
                    (str(application_id),),
                )
                await cur.execute(
                    'DELETE FROM "AiWorkflows" WHERE "ApplicationId" = %s;',
                    (str(application_id),),
                )

                # 2. Insert new workflow record
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
                        False,
                    ),
                )

                # 3. Keep Applications table in sync with the new workflow
                await cur.execute(
                    'UPDATE "Applications" SET "AiWorkflowId" = %s, "Status" = %s, "UpdatedAt" = %s WHERE "Id" = %s;',
                    (str(workflow_id), "AI_REVIEW", now, str(application_id)),
                )

                await conn.commit()
                logger.info(
                    f"Created AiWorkflow {workflow_id} for Application {application_id}"
                )
                return workflow_id

    async def update_workflow_status(
        self,
        workflow_id: uuid.UUID,
        status: str,
        current_step: str,
        final_result: Optional[Dict[str, Any]] = None,
        error_state: Optional[Dict[str, Any]] = None,
        completed_steps: Optional[List[str]] = None,
    ):
        """
        Updates workflow lifecycle state, progress, or completion result.
        """
        pool = await get_db_pool()
        now = datetime.now(timezone.utc)
        completed_at = (
            now
            if status
            in (
                "COMPLETED",
                "AWAITING_APPROVAL",
                "AWAITING_SCHEDULE_APPROVAL",
                "FAILED",
                "REJECTED",
            )
            else None
        )

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
        steps_json = (
            json.dumps(completed_steps) if completed_steps is not None else None
        )

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
                        str(workflow_id),
                    ),
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
        input_data: Optional[Dict[str, Any]] = None,
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
                        False,
                    ),
                )
                await conn.commit()
                return step_id

    async def update_step(
        self,
        step_id: uuid.UUID,
        status: str,
        output_data: Optional[Dict[str, Any]] = None,
        validation_data: Optional[Dict[str, Any]] = None,
        started_at: Optional[datetime] = None,
        retry_count: Optional[int] = None,
    ):
        """
        Updates step execution status, retry count, and payload.
        """
        pool = await get_db_pool()
        now = datetime.now(timezone.utc)
        completed_at = (
            now
            if status in ("COMPLETED", "FAILED", "SKIPPED", "AWAITING_APPROVAL")
            else None
        )
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
            "RetryCount" = COALESCE(%s, "RetryCount"),
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
                        retry_count,
                        now,
                        str(step_id),
                    ),
                )
                await conn.commit()

    async def update_step_approval(
        self,
        step_id: uuid.UUID,
        approval_status: str,
        approved_by_user_id: Optional[uuid.UUID] = None,
        approval_notes: Optional[str] = None,
    ):
        """
        Updates step human approval status, approver user ID, and notes.
        Validates that approved_by_user_id exists in Users table to prevent foreign key violations.
        """
        pool = await get_db_pool()
        now = datetime.now(timezone.utc)

        valid_user_id = None
        if approved_by_user_id:
            try:
                async with pool.connection() as check_conn:
                    async with check_conn.cursor() as check_cur:
                        await check_cur.execute(
                            'SELECT 1 FROM "Users" WHERE "Id" = %s AND "IsDeleted" = FALSE LIMIT 1;',
                            (str(approved_by_user_id),),
                        )
                        row = await check_cur.fetchone()
                        if row:
                            valid_user_id = str(approved_by_user_id)
                        else:
                            logger.warning(
                                f"ApprovedByUserId {approved_by_user_id} does not exist in Users table. Setting ApprovedByUserId to NULL to prevent FK violation."
                            )
            except Exception as e:
                logger.warning(f"Error checking user validity for ApprovedByUserId: {e}")

        query = """
        UPDATE "AiWorkflowSteps"
        SET
            "ApprovalStatus" = %s,
            "ApprovedByUserId" = %s,
            "ApprovedAt" = %s,
            "ApprovalNotes" = %s,
            "UpdatedAt" = %s
        WHERE "Id" = %s AND "IsDeleted" = FALSE;
        """

        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    query,
                    (
                        approval_status,
                        valid_user_id,
                        now,
                        approval_notes,
                        now,
                        str(step_id),
                    ),
                )
                await conn.commit()

    async def increment_step_retry(self, step_id: uuid.UUID) -> int:
        """
        Increments the RetryCount for a step and returns the new count.
        """
        pool = await get_db_pool()
        now = datetime.now(timezone.utc)

        query = """
        UPDATE "AiWorkflowSteps"
        SET
            "RetryCount" = "RetryCount" + 1,
            "UpdatedAt" = %s
        WHERE "Id" = %s AND "IsDeleted" = FALSE
        RETURNING "RetryCount";
        """

        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(query, (now, str(step_id)))
                row = await cur.fetchone()
                await conn.commit()
                return row[0] if row else 1

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

    async def get_availability_slots_for_application(
        self, application_id: uuid.UUID, days_ahead: int = 14
    ) -> Tuple[Optional[str], Optional[str], List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Retrieves candidate and company interviewer availability slots for an application,
        expanding recurring weekly slots into upcoming concrete ISO datetime windows.
        Returns: (candidate_id, first_interviewer_id, candidate_slots, interviewer_slots)
        """
        pool = await get_db_pool()
        now = datetime.now(timezone.utc)
        today = now.date()

        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                # 1. Lookup CandidateId and CompanyId for this application
                await cur.execute(
                    """
                    SELECT a."CandidateId", j."CompanyId"
                    FROM "Applications" a
                    JOIN "Jobs" j ON a."JobId" = j."Id"
                    WHERE a."Id" = %s AND a."IsDeleted" = FALSE;
                    """,
                    (str(application_id),),
                )
                app_row = await cur.fetchone()
                if not app_row:
                    return None, None, [], []

                candidate_id = str(app_row["CandidateId"])
                company_id = str(app_row["CompanyId"])

                # 2. Lookup interviewers for this company
                await cur.execute(
                    """
                    SELECT "Id"
                    FROM "Users"
                    WHERE "CompanyId" = %s AND "Role" = 'INTERVIEWER' AND "IsDeleted" = FALSE;
                    """,
                    (company_id,),
                )
                inv_rows = await cur.fetchall()
                interviewer_ids = [str(r["Id"]) for r in inv_rows]
                first_interviewer_id = interviewer_ids[0] if interviewer_ids else None

                # 3. Fetch candidate availability slot definitions
                await cur.execute(
                    """
                    SELECT "Id", "UserId", "DayOfWeek", "StartTime", "EndTime", "IsRecurring", "SpecificDate", "Timezone"
                    FROM "AvailabilitySlots"
                    WHERE "UserId" = %s AND "IsDeleted" = FALSE;
                    """,
                    (candidate_id,),
                )
                c_slot_rows = await cur.fetchall()

                # 4. Fetch interviewer availability slot definitions
                i_slot_rows = []
                if interviewer_ids:
                    await cur.execute(
                        """
                        SELECT "Id", "UserId", "DayOfWeek", "StartTime", "EndTime", "IsRecurring", "SpecificDate", "Timezone"
                        FROM "AvailabilitySlots"
                        WHERE "UserId" = ANY(%s) AND "IsDeleted" = FALSE;
                        """,
                        (interviewer_ids,),
                    )
                    i_slot_rows = await cur.fetchall()

        def _to_timedelta(val) -> timedelta:
            if isinstance(val, timedelta):
                return val
            if isinstance(val, str):
                parts = val.split(":")
                h = int(parts[0])
                m = int(parts[1]) if len(parts) > 1 else 0
                s = int(float(parts[2])) if len(parts) > 2 else 0
                return timedelta(hours=h, minutes=m, seconds=s)
            if hasattr(val, "hour") and hasattr(val, "minute"):
                return timedelta(hours=val.hour, minutes=val.minute, seconds=getattr(val, "second", 0))
            return timedelta(0)

        def _expand_slots(rows: List[Dict[str, Any]], role_name: str) -> List[Dict[str, Any]]:
            concrete: List[Dict[str, Any]] = []
            for day_offset in range(days_ahead):
                target_date = today + timedelta(days=day_offset)
                # .NET DayOfWeek enum: Sunday=0, Monday=1, ..., Saturday=6
                net_dow = (target_date.weekday() + 1) % 7

                for r in rows:
                    is_rec = r.get("IsRecurring")
                    r_dow = r.get("DayOfWeek")
                    spec_date = r.get("SpecificDate")

                    matches = False
                    if is_rec and r_dow == net_dow:
                        matches = True
                    elif not is_rec and spec_date == target_date:
                        matches = True

                    if matches:
                        s_td = _to_timedelta(r.get("StartTime"))
                        e_td = _to_timedelta(r.get("EndTime"))
                        start_dt = datetime.combine(target_date, datetime.min.time(), tzinfo=timezone.utc) + s_td
                        end_dt = datetime.combine(target_date, datetime.min.time(), tzinfo=timezone.utc) + e_td

                        # Ignore slots in the past (allow at least 1 hour in the future)
                        if end_dt > now + timedelta(hours=1):
                            concrete.append({
                                "id": str(r["Id"]),
                                "user_id": str(r["UserId"]),
                                "role": role_name,
                                "start_time": start_dt.isoformat(),
                                "end_time": end_dt.isoformat(),
                                "timezone": r.get("Timezone") or "UTC",
                            })
            return concrete

        candidate_slots = _expand_slots(c_slot_rows, "CANDIDATE")
        interviewer_slots = _expand_slots(i_slot_rows, "INTERVIEWER")

        logger.info(
            f"[AvailabilitySlots] Application {application_id}: loaded {len(candidate_slots)} candidate slots and {len(interviewer_slots)} interviewer slots."
        )

        return candidate_id, first_interviewer_id, candidate_slots, interviewer_slots

