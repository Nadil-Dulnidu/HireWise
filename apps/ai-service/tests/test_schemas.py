import pytest
from ai_service.models.schemas import (
    JobAnalysis,
    ResumeAnalysis,
    CandidateEvaluation,
    RecommendationType,
    ValidationResult,
)


def test_job_analysis_schema():
    ja = JobAnalysis(
        title="Full Stack Developer",
        required_skills=["React", "C#", "SQL"],
        preferred_skills=["Docker"],
        min_years_experience=3,
        education_level="Bachelor's",
        technical_domains=["Web", "Backend"],
        key_responsibilities=["Build web apps", "Write unit tests"],
    )
    assert ja.title == "Full Stack Developer"
    assert len(ja.required_skills) == 3
    assert ja.min_years_experience == 3


def test_resume_analysis_schema():
    ra = ResumeAnalysis(
        candidate_name="Jane Doe",
        extracted_skills=["Python", "FastAPI", "PostgreSQL"],
        years_of_experience=5.0,
        education_history=["B.S. CS"],
        project_highlights=["Built microservices API"],
        certifications=["GCP Cloud Architect"],
        executive_summary="Senior backend engineer.",
    )
    assert ra.candidate_name == "Jane Doe"
    assert ra.years_of_experience == 5.0


def test_candidate_evaluation_schema():
    ce = CandidateEvaluation(
        overall_match_score=92,
        skill_match_percentage=95,
        experience_match_percentage=90,
        strengths=["Strong backend background"],
        identified_gaps=[],
        recommendation=RecommendationType.STRONG_HIRE,
        recommendation_reasoning="Excellent skill and experience alignment.",
    )
    assert ce.overall_match_score == 92
    assert ce.recommendation == RecommendationType.STRONG_HIRE


def test_validation_result_schema():
    vr = ValidationResult(
        is_valid=True,
        validation_errors=[],
        warnings=["Minor gap in cloud certification"],
        confidence_score=1.0,
    )
    assert vr.is_valid is True
    assert len(vr.validation_errors) == 0
