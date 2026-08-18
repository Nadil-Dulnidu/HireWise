"""
Evaluation State definition for LangGraph recruitment multi-agent graph.
"""
from typing import TypedDict, Optional, Dict, Any, List

class EvaluationState(TypedDict, total=False):
    # Workflow & Application Context
    workflow_id: str
    application_id: str
    step_ids: Dict[str, str] # map step_name -> step_id
    
    # Input Parameters
    job_title: str
    job_description: str
    job_requirements: str
    candidate_resume_url: str
    resume_raw_text: Optional[str]
    
    # Agent Artifacts
    job_analysis: Optional[Dict[str, Any]]
    resume_analysis: Optional[Dict[str, Any]]
    candidate_evaluation: Optional[Dict[str, Any]]
    validation_result: Optional[Dict[str, Any]]
    
    # Final Result / Error
    final_result: Optional[Dict[str, Any]]
    error: Optional[str]
    current_step: str
    is_valid: bool
