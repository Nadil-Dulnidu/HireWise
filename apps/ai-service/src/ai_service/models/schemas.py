from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
import uuid
from datetime import datetime

class QuestionCategory(str, Enum):
    TECHNICAL = "TECHNICAL"
    BEHAVIORAL = "BEHAVIORAL"
    PROBLEM_SOLVING = "PROBLEM_SOLVING"
    PROJECT_BASED = "PROJECT_BASED"

class DifficultyLevel(str, Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"

class RecommendationType(str, Enum):
    STRONG_HIRE = "STRONG_HIRE"
    HIRE = "HIRE"
    NO_HIRE = "NO_HIRE"
    STRONG_NO_HIRE = "STRONG_NO_HIRE"

# Agent 1: Job Description Analysis Schema
class JobAnalysis(BaseModel):
    title: str
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    min_years_experience: int = 0
    education_level: str = ""
    technical_domains: List[str] = Field(default_factory=list)
    key_responsibilities: List[str] = Field(default_factory=list)

# Agent 2: Resume Analysis Schema
class ResumeAnalysis(BaseModel):
    candidate_name: Optional[str] = None
    extracted_skills: List[str] = Field(default_factory=list)
    years_of_experience: float = 0.0
    education_history: List[str] = Field(default_factory=list)
    project_highlights: List[str] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    executive_summary: str = ""

# Agent 3: Candidate Evaluation & Ranking Schema
class CandidateEvaluation(BaseModel):
    overall_match_score: int = Field(ge=0, le=100, description="0-100 fit score")
    skill_match_percentage: int = Field(ge=0, le=100)
    experience_match_percentage: int = Field(ge=0, le=100)
    strengths: List[str] = Field(default_factory=list)
    identified_gaps: List[str] = Field(default_factory=list)
    recommendation: RecommendationType
    recommendation_reasoning: str

# Agent 4: Validation Result Schema
class ValidationResult(BaseModel):
    is_valid: bool
    validation_errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    confidence_score: float = 1.0

# Agent 5: Generated Interview Question Schema
class GeneratedQuestion(BaseModel):
    category: QuestionCategory
    question: str
    rationale: str
    expected_answer_rubric: str
    difficulty: DifficultyLevel

class InterviewQuestionsPayload(BaseModel):
    questions: List[GeneratedQuestion] = Field(default_factory=list)

class GenerateQuestionsRequest(BaseModel):
    job_analysis: JobAnalysis
    resume_analysis: ResumeAnalysis
    candidate_evaluation: Optional[CandidateEvaluation] = None
    count_per_category: int = 2

# Agent 6: Scheduling Recommendation Schema
class AvailabilitySlotInput(BaseModel):
    id: Optional[str] = None
    user_id: str
    role: str = "INTERVIEWER" # INTERVIEWER or CANDIDATE
    start_time: datetime
    end_time: datetime
    timezone: str = "UTC"

class RecommendedSlot(BaseModel):
    start_time: datetime
    end_time: datetime
    interviewer_id: str
    candidate_id: str
    conflict_detected: bool = False
    score: float = 1.0

class SchedulingRecommendation(BaseModel):
    recommended_slots: List[RecommendedSlot] = Field(default_factory=list)
    conflicts: List[str] = Field(default_factory=list)
    reasoning: str = ""

class SchedulingRequest(BaseModel):
    candidate_id: str
    interviewer_id: str
    candidate_slots: List[AvailabilitySlotInput] = Field(default_factory=list)
    interviewer_slots: List[AvailabilitySlotInput] = Field(default_factory=list)
    duration_minutes: int = 45
    timezone: str = "UTC"

# Workflow Request / Response Schemas
class EvaluateApplicationRequest(BaseModel):
    application_id: uuid.UUID
    job_title: str
    job_description: str
    job_requirements: str
    candidate_resume_url: str

class WorkflowResponse(BaseModel):
    workflow_id: uuid.UUID
    application_id: uuid.UUID
    status: str
    current_step: str
    created_at: datetime
