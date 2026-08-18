"""
Conditional Edge functions for LangGraph evaluation workflow.
"""
from ai_service.graph.state import EvaluationState

def check_job_analysis_edge(state: EvaluationState) -> str:
    """Routes to resume_analysis on success or error_node on failure."""
    if state.get("error"):
        return "error_node"
    return "resume_analysis"

def check_resume_analysis_edge(state: EvaluationState) -> str:
    """Routes to candidate_evaluation on success or error_node on failure."""
    if state.get("error"):
        return "error_node"
    return "candidate_evaluation"

def check_candidate_evaluation_edge(state: EvaluationState) -> str:
    """Routes to validation on success or error_node on failure."""
    if state.get("error"):
        return "error_node"
    return "validation"

def check_validation_edge(state: EvaluationState) -> str:
    """
    Evaluates whether the deterministic validation passed:
    - is_valid == True -> finalize
    - is_valid == False -> error_node
    """
    if state.get("is_valid") is True and not state.get("error"):
        return "finalize"
    return "error_node"
