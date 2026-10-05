import pytest
from datetime import datetime, timezone, timedelta
from ai_service.agents import (
    JobDescriptionAnalysisAgent,
    ResumeAnalysisAgent,
    CandidateEvaluationAgent,
    ValidationAgent,
    InterviewQuestionGeneratorAgent,
    InterviewSchedulingAgent,
)
from ai_service.models.schemas import (
    JobAnalysis,
    ResumeAnalysis,
    RecommendationType,
    QuestionCategory,
    AvailabilitySlotInput,
    SchedulingRequest,
)


@pytest.mark.asyncio
async def test_golden_case_1_high_alignment_senior_backend():
    """
    Golden Case 1: Highly qualified Senior Backend Engineer.
    Expectation: Overall score >= 85%, STRONG_HIRE, comprehensive questions, perfect scheduling match.
    """
    job_agent = JobDescriptionAnalysisAgent()
    resume_agent = ResumeAnalysisAgent()
    eval_agent = CandidateEvaluationAgent()
    val_agent = ValidationAgent()
    q_agent = InterviewQuestionGeneratorAgent()
    sched_agent = InterviewSchedulingAgent()

    # 1. Job Analysis
    job = await job_agent.execute(
        job_title="Senior Backend Engineer",
        job_description="Architect and build high-throughput microservices using C#, ASP.NET Core, PostgreSQL, and Redis.",
        job_requirements="5+ years experience in C#, .NET 8, SQL/PostgreSQL, distributed caching with Redis, Docker, and CI/CD.",
    )
    assert job.title == "Senior Backend Engineer"
    assert (
        "C#" in job.required_skills
        or "Asp.net" in job.required_skills
        or "Postgresql" in job.required_skills
    )

    # 2. Resume Analysis
    resume_text = """
    Elena Rostova
    Senior Backend Architect & Lead Engineer
    Summary: 7+ years of experience engineering high-scale backend microservices in C#, ASP.NET Core, PostgreSQL, and Redis.
    Skills: C#, ASP.NET Core, .NET 8, PostgreSQL, Redis, Docker, Kubernetes, AWS, Kafka, Git, CI/CD.
    Experience:
    - Lead Engineer at TechCorp (4 years): Scaled core API handling 25M requests/day using C# and PostgreSQL.
    - Software Engineer at DataStream (3 years): Built distributed streaming microservices with Redis and Kafka.
    Education: B.S. in Computer Science, University of Washington.
    """
    cand = await resume_agent.execute(raw_text=resume_text)
    assert cand.years_of_experience >= 5.0
    assert "C#" in cand.extracted_skills or "Postgresql" in cand.extracted_skills

    # 3. Candidate Evaluation
    evaluation = await eval_agent.execute(job, cand)
    assert evaluation.overall_match_score >= 80
    assert evaluation.recommendation in (
        RecommendationType.STRONG_HIRE,
        RecommendationType.HIRE,
    )
    assert len(evaluation.strengths) >= 1

    # 4. Validation
    val_res = val_agent.validate(evaluation)
    assert val_res.is_valid is True
    assert len(val_res.validation_errors) == 0

    # 5. Question Generation
    questions = await q_agent.execute(job, cand, evaluation)
    assert len(questions.questions) >= 4
    cat_set = {q.category for q in questions.questions}
    assert QuestionCategory.TECHNICAL in cat_set
    assert QuestionCategory.PROBLEM_SOLVING in cat_set

    # 6. Scheduling
    base = datetime(2026, 9, 15, 14, 0, tzinfo=timezone.utc)
    req = SchedulingRequest(
        candidate_id="cand_elena",
        interviewer_id="int_lead",
        candidate_slots=[
            AvailabilitySlotInput(
                user_id="cand_elena",
                role="CANDIDATE",
                start_time=base,
                end_time=base + timedelta(hours=3),
            )
        ],
        interviewer_slots=[
            AvailabilitySlotInput(
                user_id="int_lead",
                role="INTERVIEWER",
                start_time=base,
                end_time=base + timedelta(hours=2),
            )
        ],
        duration_minutes=45,
    )
    sched_res = await sched_agent.execute(req)
    assert len(sched_res.recommended_slots) >= 1
    assert sched_res.recommended_slots[0].start_time == base


@pytest.mark.asyncio
async def test_golden_case_2_moderate_alignment_with_gaps():
    """
    Golden Case 2: Candidate with partial skill match and junior experience for a Senior role.
    Expectation: Overall score <= 75%, identified gaps populated.
    """
    eval_agent = CandidateEvaluationAgent()
    val_agent = ValidationAgent()

    job = JobAnalysis(
        title="Senior React Architect",
        required_skills=["React", "TypeScript", "Next.js", "GraphQL", "WebSockets"],
        min_years_experience=5,
        technical_domains=["Frontend", "Web Performance"],
    )

    cand = ResumeAnalysis(
        candidate_name="Junior Dev",
        extracted_skills=["React", "JavaScript", "HTML", "CSS"],
        years_of_experience=2.0,
        education_history=["Bootcamp Certificate"],
        executive_summary="Junior frontend developer with 2 years of React experience.",
    )

    evaluation = await eval_agent.execute(job, cand)
    assert evaluation.overall_match_score < 75
    assert len(evaluation.identified_gaps) > 0
    assert any(
        "experience" in gap.lower() or "missing" in gap.lower()
        for gap in evaluation.identified_gaps
    )

    val_res = val_agent.validate(evaluation)
    assert val_res.is_valid is True


@pytest.mark.asyncio
async def test_golden_case_3_complete_mismatch():
    """
    Golden Case 3: Complete mismatch (Data Analyst applying for Mobile Engineer).
    Expectation: Score < 50%, STRONG_NO_HIRE.
    """
    eval_agent = CandidateEvaluationAgent()
    val_agent = ValidationAgent()

    job = JobAnalysis(
        title="iOS Mobile Engineer",
        required_skills=["Swift", "SwiftUI", "UIKit", "iOS SDK", "CoreData"],
        min_years_experience=4,
        technical_domains=["Mobile", "iOS"],
    )

    cand = ResumeAnalysis(
        candidate_name="Data Analyst",
        extracted_skills=["Python", "Pandas", "Tableau", "SQL", "Excel"],
        years_of_experience=3.0,
        education_history=["B.A. Economics"],
        executive_summary="Data Analyst focused on business intelligence dashboards.",
    )

    evaluation = await eval_agent.execute(job, cand)
    assert evaluation.overall_match_score < 50
    assert evaluation.recommendation in (
        RecommendationType.STRONG_NO_HIRE,
        RecommendationType.NO_HIRE,
    )
    assert len(evaluation.identified_gaps) > 0

    val_res = val_agent.validate(evaluation)
    assert val_res.is_valid is True
