"""
Evaluation State definition for LangGraph recruitment multi-agent graph.
Supports multi-stage execution across screening, approval gates, question generation, and scheduling.
"""

from typing import TypedDict, Optional, Dict, Any, List


class EvaluationState(TypedDict, total=False):
    # Workflow & Application Identifiers
    workflow_id: str
    application_id: str
    step_ids: Dict[str, str]  # map step_name -> step_id

    # Input Parameters
    job_title: str
    job_description: str
    job_requirements: str
    candidate_resume_url: str
    resume_raw_text: Optional[str]

    # Candidate & Interviewer Context for Scheduling
    candidate_id: Optional[str]
    interviewer_id: Optional[str]
    candidate_slots: Optional[List[Dict[str, Any]]]
    interviewer_slots: Optional[List[Dict[str, Any]]]
    duration_minutes: Optional[int]
    timezone: Optional[str]

    # Stage 1: Screening Artifacts
    job_analysis: Optional[Dict[str, Any]]
    resume_analysis: Optional[Dict[str, Any]]
    candidate_evaluation: Optional[Dict[str, Any]]
    validation_result: Optional[Dict[str, Any]]

    # Stage 1: Recruiter Evaluation Approval Gate
    evaluation_approved: Optional[bool]
    evaluation_approval_notes: Optional[str]
    evaluation_approved_by: Optional[str]

    # Stage 2: Question Generation Artifacts
    interview_questions: Optional[Dict[str, Any]]

    # Stage 3: Interview Scheduling Artifacts
    scheduling_recommendation: Optional[Dict[str, Any]]

    # Stage 3: Schedule Approval Gate
    schedule_approved: Optional[bool]
    selected_slot: Optional[Dict[str, Any]]
    schedule_approved_by: Optional[str]
    schedule_approval_notes: Optional[str]

    # Final Results & State Controls
    interview_id: Optional[str]
    final_result: Optional[Dict[str, Any]]
    error: Optional[str]
    current_step: str
    status: str
    is_valid: bool
    retry_count: Optional[int]
