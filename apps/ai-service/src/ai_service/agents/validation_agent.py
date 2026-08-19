from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel

from ai_service.core.logging import logger
from ai_service.models.schemas import (
    JobAnalysis,
    ResumeAnalysis,
    CandidateEvaluation,
    InterviewQuestionsPayload,
    SchedulingRecommendation,
    ValidationResult
)

class ValidationAgent:
    """
    Agent 4: Deterministic validation of agent artifacts against schema constraints and business rules.
    Provides strict guardrails against hallucinations, out-of-bound scores, and incomplete outputs.
    """

    def __init__(self):
        self.name = "ValidationAgent"

    def validate(
        self,
        artifact: Union[BaseModel, Dict[str, Any]],
        artifact_type: Optional[str] = None
    ) -> ValidationResult:
        logger.info(f"[{self.name}] Running deterministic validation...")

        errors: List[str] = []
        warnings: List[str] = []

        # Convert dictionary to schema if necessary
        if isinstance(artifact, dict):
            if artifact_type == "JobAnalysis" or "required_skills" in artifact:
                try:
                    artifact = JobAnalysis(**artifact)
                except Exception as e:
                    errors.append(f"JobAnalysis schema validation failed: {e}")
            elif artifact_type == "ResumeAnalysis" or "extracted_skills" in artifact:
                try:
                    artifact = ResumeAnalysis(**artifact)
                except Exception as e:
                    errors.append(f"ResumeAnalysis schema validation failed: {e}")
            elif artifact_type == "CandidateEvaluation" or "overall_match_score" in artifact:
                try:
                    artifact = CandidateEvaluation(**artifact)
                except Exception as e:
                    errors.append(f"CandidateEvaluation schema validation failed: {e}")
            elif artifact_type == "InterviewQuestionsPayload" or "questions" in artifact:
                try:
                    artifact = InterviewQuestionsPayload(**artifact)
                except Exception as e:
                    errors.append(f"InterviewQuestionsPayload schema validation failed: {e}")
            elif artifact_type == "SchedulingRecommendation" or "recommended_slots" in artifact:
                try:
                    artifact = SchedulingRecommendation(**artifact)
                except Exception as e:
                    errors.append(f"SchedulingRecommendation schema validation failed: {e}")

        # If schema parsing failed, return invalid result immediately
        if errors:
            return ValidationResult(
                is_valid=False,
                validation_errors=errors,
                warnings=warnings,
                confidence_score=0.0
            )

        # Domain Rule Checks per artifact type
        if isinstance(artifact, JobAnalysis):
            self._validate_job_analysis(artifact, errors, warnings)
        elif isinstance(artifact, ResumeAnalysis):
            self._validate_resume_analysis(artifact, errors, warnings)
        elif isinstance(artifact, CandidateEvaluation):
            self._validate_candidate_evaluation(artifact, errors, warnings)
        elif isinstance(artifact, InterviewQuestionsPayload):
            self._validate_questions(artifact, errors, warnings)
        elif isinstance(artifact, SchedulingRecommendation):
            self._validate_scheduling(artifact, errors, warnings)
        else:
            warnings.append(f"Unknown artifact type: {type(artifact).__name__}")

        is_valid = len(errors) == 0
        confidence = 1.0 if is_valid and len(warnings) == 0 else (0.8 if is_valid else 0.0)

        logger.info(f"[{self.name}] Validation result: is_valid={is_valid}, {len(errors)} error(s), {len(warnings)} warning(s)")

        return ValidationResult(
            is_valid=is_valid,
            validation_errors=errors,
            warnings=warnings,
            confidence_score=confidence
        )

    def _validate_job_analysis(self, ja: JobAnalysis, errors: List[str], warnings: List[str]):
        if not ja.title or not ja.title.strip():
            errors.append("Job title is required and cannot be blank.")
        if len(ja.required_skills) == 0:
            warnings.append("No required skills were extracted for the job posting.")
        if ja.min_years_experience < 0 or ja.min_years_experience > 40:
            errors.append(f"Invalid min_years_experience: {ja.min_years_experience}. Must be between 0 and 40.")

    def _validate_resume_analysis(self, ra: ResumeAnalysis, errors: List[str], warnings: List[str]):
        if len(ra.extracted_skills) == 0:
            warnings.append("No extracted skills found in candidate resume.")
        if ra.years_of_experience < 0 or ra.years_of_experience > 50:
            errors.append(f"Invalid years_of_experience: {ra.years_of_experience}. Must be between 0 and 50.")
        if not ra.executive_summary or len(ra.executive_summary.strip()) < 5:
            warnings.append("Executive summary is missing or brief.")

    def _validate_candidate_evaluation(self, ce: CandidateEvaluation, errors: List[str], warnings: List[str]):
        if not (0 <= ce.overall_match_score <= 100):
            errors.append(f"Invalid overall_match_score: {ce.overall_match_score}. Must be in [0, 100].")
        if not (0 <= ce.skill_match_percentage <= 100):
            errors.append(f"Invalid skill_match_percentage: {ce.skill_match_percentage}. Must be in [0, 100].")
        if not (0 <= ce.experience_match_percentage <= 100):
            errors.append(f"Invalid experience_match_percentage: {ce.experience_match_percentage}. Must be in [0, 100].")

        # Business Rule: Score / Recommendation consistency check
        if ce.overall_match_score >= 85 and ce.recommendation.value == "STRONG_NO_HIRE":
            errors.append("Contradiction: Score >= 85% cannot have STRONG_NO_HIRE recommendation.")
        if ce.overall_match_score < 40 and ce.recommendation.value == "STRONG_HIRE":
            errors.append("Contradiction: Score < 40% cannot have STRONG_HIRE recommendation.")

        if not ce.recommendation_reasoning or len(ce.recommendation_reasoning.strip()) < 10:
            warnings.append("Recommendation reasoning is brief or low detail.")

    def _validate_questions(self, qp: InterviewQuestionsPayload, errors: List[str], warnings: List[str]):
        if len(qp.questions) == 0:
            errors.append("Generated interview questions list cannot be empty.")
        for idx, q in enumerate(qp.questions):
            if not q.question or len(q.question.strip()) < 5:
                errors.append(f"Question #{idx+1} has invalid or empty question text.")
            if not q.expected_answer_rubric or len(q.expected_answer_rubric.strip()) < 5:
                warnings.append(f"Question #{idx+1} has brief or missing answer rubric.")

    def _validate_scheduling(self, sr: SchedulingRecommendation, errors: List[str], warnings: List[str]):
        for idx, slot in enumerate(sr.recommended_slots):
            if slot.end_time <= slot.start_time:
                errors.append(f"Slot #{idx+1} has invalid end_time <= start_time.")
            if not slot.interviewer_id or not slot.candidate_id:
                errors.append(f"Slot #{idx+1} missing candidate_id or interviewer_id.")
