"""
Conditional Edge functions for LangGraph multi-stage recruitment evaluation workflow.
Supports approval gates, branch switching, error recovery, clean pausing, and resumable entry points.
"""
from ai_service.graph.state import EvaluationState

def route_from_start(state: EvaluationState) -> str:
    """
    Dynamically routes from START based on current_step to support pausing and resuming across approval gates.
    """
    step = state.get("current_step", "JOB_ANALYSIS")
    if step == "QUESTION_GENERATION":
        return "question_generation"
    elif step == "SCHEDULING":
        return "scheduling_recommendation"
    elif step == "INTERVIEW_CREATION":
        return "interview_creation"
    elif step == "EVALUATION_APPROVAL_GATE":
        return "evaluation_approval_gate"
    elif step == "SCHEDULE_APPROVAL_GATE":
        return "schedule_approval_gate"
    return "job_analysis"

def check_job_analysis_edge(state: EvaluationState) -> str:
    if state.get("error"):
        return "error_node"
    return "resume_analysis"

def check_resume_analysis_edge(state: EvaluationState) -> str:
    if state.get("error"):
        return "error_node"
    return "candidate_evaluation"

def check_candidate_evaluation_edge(state: EvaluationState) -> str:
    if state.get("error"):
        return "error_node"
    return "validation"

def check_validation_edge(state: EvaluationState) -> str:
    if state.get("is_valid") is True and not state.get("error"):
        return "evaluation_approval_gate"
    return "error_node"

def check_evaluation_approval_edge(state: EvaluationState) -> str:
    if state.get("status") == "REJECTED" or state.get("evaluation_approved") is False:
        return "rejection_node"
    if state.get("status") == "AWAITING_APPROVAL":
        return "pause"
    if state.get("evaluation_approved") is True:
        return "question_generation"
    return "error_node"

def check_question_generation_edge(state: EvaluationState) -> str:
    if state.get("error"):
        return "error_node"
    return "scheduling_recommendation"

def check_scheduling_edge(state: EvaluationState) -> str:
    if state.get("error"):
        return "error_node"
    return "schedule_approval_gate"

def check_schedule_approval_edge(state: EvaluationState) -> str:
    if state.get("status") == "AWAITING_SCHEDULE_APPROVAL":
        return "pause"
    if state.get("schedule_approved") is True or state.get("selected_slot") is not None:
        return "interview_creation"
    return "error_node"
