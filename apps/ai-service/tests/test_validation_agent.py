import pytest
from datetime import datetime, timezone, timedelta
from ai_service.agents.validation_agent import ValidationAgent
from ai_service.models.schemas import (
    JobAnalysis,
    ResumeAnalysis,
    CandidateEvaluation,
    RecommendationType,
    InterviewQuestionsPayload,
    GeneratedQuestion,
    QuestionCategory,
    DifficultyLevel,
    SchedulingRecommendation,
    RecommendedSlot
)

def test_validation_out_of_bound_scores():
    val = ValidationAgent()
    raw_dict = {
        "overall_match_score": 150,  # out of bound
        "skill_match_percentage": 50,
        "experience_match_percentage": 50,
        "strengths": ["Good worker"],
        "identified_gaps": [],
        "recommendation": "HIRE",
        "recommendation_reasoning": "Good match."
    }
    result = val.validate(raw_dict, artifact_type="CandidateEvaluation")
    assert result.is_valid is False
    assert any("CandidateEvaluation schema validation failed" in err or "overall_match_score" in err for err in result.validation_errors)

def test_validation_score_recommendation_contradiction():
    val = ValidationAgent()
    ce = CandidateEvaluation(
        overall_match_score=95,
        skill_match_percentage=95,
        experience_match_percentage=95,
        strengths=["Outstanding"],
        identified_gaps=[],
        recommendation=RecommendationType.STRONG_NO_HIRE,  # Contradiction!
        recommendation_reasoning="Score 95 but rejected."
    )
    result = val.validate(ce)
    assert result.is_valid is False
    assert any("Contradiction" in err for err in result.validation_errors)

def test_validation_empty_questions_payload():
    val = ValidationAgent()
    payload = InterviewQuestionsPayload(questions=[])
    result = val.validate(payload)
    assert result.is_valid is False
    assert any("cannot be empty" in err for err in result.validation_errors)

def test_validation_malformed_scheduling_slots():
    val = ValidationAgent()
    t = datetime(2026, 9, 1, 10, 0, tzinfo=timezone.utc)
    sr = SchedulingRecommendation(
        recommended_slots=[
            RecommendedSlot(
                start_time=t,
                end_time=t - timedelta(minutes=30),  # end_time before start_time!
                interviewer_id="user_1",
                candidate_id="user_2"
            )
        ],
        reasoning="Test"
    )
    result = val.validate(sr)
    assert result.is_valid is False
    assert any("invalid end_time <= start_time" in err for err in result.validation_errors)
