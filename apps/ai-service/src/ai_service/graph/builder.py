"""
LangGraph StateGraph builder for HireWise multi-agent evaluation pipeline.
"""
from langgraph.graph import StateGraph, START, END
from ai_service.graph.state import EvaluationState
from ai_service.graph.nodes import (
    job_analysis_node,
    resume_analysis_node,
    candidate_evaluation_node,
    validation_node,
    finalize_node,
    error_node
)
from ai_service.graph.edges import (
    check_job_analysis_edge,
    check_resume_analysis_edge,
    check_candidate_evaluation_edge,
    check_validation_edge
)

def build_evaluation_graph():
    """
    Constructs and compiles the evaluation StateGraph.
    """
    workflow = StateGraph(EvaluationState)

    # 1. Add agent nodes
    workflow.add_node("job_analysis", job_analysis_node)
    workflow.add_node("resume_analysis", resume_analysis_node)
    workflow.add_node("candidate_evaluation", candidate_evaluation_node)
    workflow.add_node("validation", validation_node)
    workflow.add_node("finalize", finalize_node)
    workflow.add_node("error_node", error_node)

    # 2. Add edges & entry point
    workflow.add_edge(START, "job_analysis")
    
    workflow.add_conditional_edges(
        "job_analysis",
        check_job_analysis_edge,
        {
            "resume_analysis": "resume_analysis",
            "error_node": "error_node"
        }
    )

    workflow.add_conditional_edges(
        "resume_analysis",
        check_resume_analysis_edge,
        {
            "candidate_evaluation": "candidate_evaluation",
            "error_node": "error_node"
        }
    )

    workflow.add_conditional_edges(
        "candidate_evaluation",
        check_candidate_evaluation_edge,
        {
            "validation": "validation",
            "error_node": "error_node"
        }
    )

    workflow.add_conditional_edges(
        "validation",
        check_validation_edge,
        {
            "finalize": "finalize",
            "error_node": "error_node"
        }
    )

    workflow.add_edge("finalize", END)
    workflow.add_edge("error_node", END)

    return workflow.compile()
