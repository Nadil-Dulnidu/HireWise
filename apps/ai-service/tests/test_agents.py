import pytest
from datetime import datetime, timezone, timedelta
from ai_service.agents import (
    JobDescriptionAnalysisAgent,
    ResumeAnalysisAgent,
    CandidateEvaluationAgent,
    ValidationAgent,
    InterviewQuestionGeneratorAgent,
    InterviewSchedulingAgent
)
from ai_service.models.schemas import (
    JobAnalysis,
    ResumeAnalysis,
    CandidateEvaluation,
    RecommendationType,
    ValidationResult,
    InterviewQuestionsPayload,
    QuestionCategory,
    DifficultyLevel,
    AvailabilitySlotInput,
    SchedulingRecommendation,
    SchedulingRequest
)

@pytest.mark.asyncio
async def test_job_analysis_agent():
    agent = JobDescriptionAnalysisAgent()
    res = await agent.execute(
        job_title="Senior Full Stack Engineer",
        job_description="We are seeking a senior engineer to build scalable web apps with React and ASP.NET Core.",
        job_requirements="5+ years experience, React, TypeScript, C#, PostgreSQL, Docker, Kubernetes."
    )
    assert isinstance(res, JobAnalysis)
    assert res.title == "Senior Full Stack Engineer"
    assert len(res.required_skills) > 0
    assert res.min_years_experience >= 3

@pytest.mark.asyncio
async def test_resume_analysis_agent():
    agent = ResumeAnalysisAgent()
    resume_text = """
    Alex Johnson
    Senior Software Engineer with 6 years of experience in React, TypeScript, C#, .NET 8, and PostgreSQL.
    Education: B.S. in Computer Science from MIT.
    Projects: Built real-time hiring platform with microservices.
    """
    res = await agent.execute(raw_text=resume_text)
    assert isinstance(res, ResumeAnalysis)
    assert len(res.extracted_skills) > 0
    assert res.years_of_experience > 0

@pytest.mark.asyncio
async def test_candidate_evaluation_agent():
    eval_agent = CandidateEvaluationAgent()
    job = JobAnalysis(
        title="Full Stack Engineer",
        required_skills=["React", "TypeScript", "C#", "PostgreSQL"],
        preferred_skills=["Docker"],
        min_years_experience=4,
        technical_domains=["Web", "Backend"]
    )
    cand = ResumeAnalysis(
        candidate_name="Alex Johnson",
        extracted_skills=["React", "TypeScript", "C#", "PostgreSQL", "Docker"],
        years_of_experience=5.0,
        education_history=["B.S. CS"],
        project_highlights=["Built SaaS platform"],
        executive_summary="Experienced Full Stack Developer."
    )
    res = await eval_agent.execute(job, cand)
    assert isinstance(res, CandidateEvaluation)
    assert 0 <= res.overall_match_score <= 100
    assert 0 <= res.skill_match_percentage <= 100
    assert res.recommendation in (RecommendationType.STRONG_HIRE, RecommendationType.HIRE)
    assert len(res.strengths) > 0
    assert len(res.recommendation_reasoning) > 0

def test_validation_agent():
    val_agent = ValidationAgent()
    ce = CandidateEvaluation(
        overall_match_score=90,
        skill_match_percentage=95,
        experience_match_percentage=85,
        strengths=["Strong React experience"],
        identified_gaps=[],
        recommendation=RecommendationType.STRONG_HIRE,
        recommendation_reasoning="Candidate satisfies all technical requirements."
    )
    result = val_agent.validate(ce)
    assert isinstance(result, ValidationResult)
    assert result.is_valid is True
    assert len(result.validation_errors) == 0

@pytest.mark.asyncio
async def test_interview_question_generator_agent():
    q_agent = InterviewQuestionGeneratorAgent()
    job = JobAnalysis(
        title="Backend Engineer",
        required_skills=["Go", "PostgreSQL", "Kubernetes"],
        min_years_experience=3
    )
    cand = ResumeAnalysis(
        candidate_name="Sam Smith",
        extracted_skills=["Go", "PostgreSQL", "Docker"],
        years_of_experience=4.0
    )
    eval_res = CandidateEvaluation(
        overall_match_score=85,
        skill_match_percentage=80,
        experience_match_percentage=100,
        strengths=["Strong backend Go development"],
        identified_gaps=["No explicit Kubernetes experience"],
        recommendation=RecommendationType.STRONG_HIRE,
        recommendation_reasoning="Solid match."
    )

    res = await q_agent.execute(job, cand, eval_res)
    assert isinstance(res, InterviewQuestionsPayload)
    assert len(res.questions) >= 4

    categories = {q.category for q in res.questions}
    assert QuestionCategory.TECHNICAL in categories
    assert QuestionCategory.PROBLEM_SOLVING in categories
    assert QuestionCategory.BEHAVIORAL in categories

@pytest.mark.asyncio
async def test_interview_scheduling_agent():
    sched_agent = InterviewSchedulingAgent()

    base_time = datetime(2026, 9, 1, 10, 0, 0, tzinfo=timezone.utc)
    candidate_slots = [
        AvailabilitySlotInput(
            user_id="cand_123",
            role="CANDIDATE",
            start_time=base_time,
            end_time=base_time + timedelta(hours=3),
            timezone="UTC"
        )
    ]
    interviewer_slots = [
        AvailabilitySlotInput(
            user_id="int_456",
            role="INTERVIEWER",
            start_time=base_time + timedelta(hours=1),
            end_time=base_time + timedelta(hours=4),
            timezone="UTC"
        )
    ]

    req = SchedulingRequest(
        candidate_id="cand_123",
        interviewer_id="int_456",
        candidate_slots=candidate_slots,
        interviewer_slots=interviewer_slots,
        duration_minutes=45,
        timezone="UTC"
    )

    res = await sched_agent.execute(req)
    assert isinstance(res, SchedulingRecommendation)
    assert len(res.recommended_slots) > 0
    assert len(res.conflicts) == 0
    assert "mutual interview window" in res.reasoning
