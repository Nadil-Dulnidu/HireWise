"""
LangGraph StateGraph builder for HireWise multi-agent evaluation, approval, and scheduling pipeline.
"""

from langgraph.graph import StateGraph, START, END
from ai_service.graph.state import EvaluationState
from ai_service.graph.nodes import (
    job_analysis_node,
    resume_analysis_node,
    candidate_evaluation_node,
    validation_node,
    evaluation_approval_gate_node,
    question_generation_node,
    scheduling_recommendation_node,
    schedule_approval_gate_node,
    interview_creation_node,
    rejection_node,
    error_node,
)
from ai_service.graph.edges import (
    route_from_start,
    check_job_analysis_edge,
    check_resume_analysis_edge,
    check_candidate_evaluation_edge,
    check_validation_edge,
    check_evaluation_approval_edge,
    check_question_generation_edge,
    check_scheduling_edge,
    check_schedule_approval_edge,
)


def build_evaluation_graph():
    """
    Constructs and compiles the complete multi-stage recruitment StateGraph with resumable entry points.
    """
    workflow = StateGraph(EvaluationState)

    # 1. Register all agent and gate nodes
    workflow.add_node("job_analysis", job_analysis_node)
    workflow.add_node("resume_analysis", resume_analysis_node)
    workflow.add_node("candidate_evaluation", candidate_evaluation_node)
    workflow.add_node("validation", validation_node)
    workflow.add_node("evaluation_approval_gate", evaluation_approval_gate_node)
    workflow.add_node("question_generation", question_generation_node)
    workflow.add_node("scheduling_recommendation", scheduling_recommendation_node)
    workflow.add_node("schedule_approval_gate", schedule_approval_gate_node)
    workflow.add_node("interview_creation", interview_creation_node)
    workflow.add_node("rejection_node", rejection_node)
    workflow.add_node("error_node", error_node)

    # 2. Dynamic Entry Point Routing
    workflow.add_conditional_edges(
        START,
        route_from_start,
        {
            "job_analysis": "job_analysis",
            "question_generation": "question_generation",
            "scheduling_recommendation": "scheduling_recommendation",
            "evaluation_approval_gate": "evaluation_approval_gate",
            "schedule_approval_gate": "schedule_approval_gate",
            "interview_creation": "interview_creation",
        },
    )

    # Stage 1: Screening & Evaluation
    workflow.add_conditional_edges(
        "job_analysis",
        check_job_analysis_edge,
        {"resume_analysis": "resume_analysis", "error_node": "error_node"},
    )

    workflow.add_conditional_edges(
        "resume_analysis",
        check_resume_analysis_edge,
        {"candidate_evaluation": "candidate_evaluation", "error_node": "error_node"},
    )

    workflow.add_conditional_edges(
        "candidate_evaluation",
        check_candidate_evaluation_edge,
        {"validation": "validation", "error_node": "error_node"},
    )

    workflow.add_conditional_edges(
        "validation",
        check_validation_edge,
        {
            "evaluation_approval_gate": "evaluation_approval_gate",
            "error_node": "error_node",
        },
    )

    # Gate 1: Human Evaluation Review Gate
    workflow.add_conditional_edges(
        "evaluation_approval_gate",
        check_evaluation_approval_edge,
        {
            "question_generation": "question_generation",
            "rejection_node": "rejection_node",
            "pause": END,
            "error_node": "error_node",
        },
    )

    # Stage 2: Question Generation & Scheduling
    workflow.add_conditional_edges(
        "question_generation",
        check_question_generation_edge,
        {
            "scheduling_recommendation": "scheduling_recommendation",
            "error_node": "error_node",
        },
    )

    workflow.add_conditional_edges(
        "scheduling_recommendation",
        check_scheduling_edge,
        {
            "schedule_approval_gate": "schedule_approval_gate",
            "error_node": "error_node",
        },
    )

    # Gate 2: Schedule Confirmation Gate
    workflow.add_conditional_edges(
        "schedule_approval_gate",
        check_schedule_approval_edge,
        {
            "interview_creation": "interview_creation",
            "pause": END,
            "error_node": "error_node",
        },
    )

    # Terminal edges
    workflow.add_edge("interview_creation", END)
    workflow.add_edge("rejection_node", END)
    workflow.add_edge("error_node", END)

    return workflow.compile()
