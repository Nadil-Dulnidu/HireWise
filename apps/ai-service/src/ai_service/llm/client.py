"""
Google Gemini LLM Client wrapper with structured output binding.
Supports both live Google Gemini API and graceful mock fallback for local testing.
"""
from typing import Type, TypeVar, Optional, Any
from pydantic import BaseModel
from ai_service.core.config import settings
from ai_service.core.logging import logger
from ai_service.models.schemas import (
    JobAnalysis,
    ResumeAnalysis,
    CandidateEvaluation,
    RecommendationType
)

T = TypeVar("T", bound=BaseModel)

def is_google_api_configured() -> bool:
    """Checks if a valid Google Gemini API key or Vertex configuration is set."""
    return bool(settings.GOOGLE_API_KEY and len(settings.GOOGLE_API_KEY.strip()) > 5)

def get_llm(temperature: float = 0.1):
    """
    Initializes and returns LangChain ChatGoogleGenerativeAI instance.
    """
    if not is_google_api_configured():
        logger.info("Google API Key not configured. Using Mock LLM fallback for local execution.")
        return None

    from langchain_google_genai import ChatGoogleGenerativeAI
    
    return ChatGoogleGenerativeAI(
        model=settings.GEMINI_MODEL,
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=temperature,
        convert_system_message_to_human=True
    )

class MockStructuredLLM:
    """
    Simulates structured agent responses when Google API Key is not yet configured.
    Ensures complete LangGraph state machine runs deterministically in dev/test.
    """
    def __init__(self, schema_cls: Type[T]):
        self.schema_cls = schema_cls

    async def ainvoke(self, messages: Any) -> T:
        msg_str = str(messages)
        logger.info(f"MockStructuredLLM simulating output for schema: {self.schema_cls.__name__}")

        if self.schema_cls == JobAnalysis:
            return JobAnalysis(
                title="Software Engineer",
                required_skills=["C#", ".NET Core", "PostgreSQL", "React", "TypeScript"],
                preferred_skills=["Docker", "Kubernetes", "LangGraph", "GCP"],
                min_years_experience=3,
                education_level="Bachelor's in Computer Science or equivalent",
                technical_domains=["Full Stack", "Cloud Backend", "Web Architecture"],
                key_responsibilities=[
                    "Design and implement scalable microservices",
                    "Build responsive React frontend interfaces",
                    "Maintain CI/CD pipelines and deployment infrastructure"
                ]
            )

        if self.schema_cls == ResumeAnalysis:
            return ResumeAnalysis(
                candidate_name="Alex Morgan",
                extracted_skills=["C#", ".NET 8", "PostgreSQL", "React", "TypeScript", "Docker", "REST APIs"],
                years_of_experience=4.5,
                education_history=["B.S. in Computer Science - State University"],
                project_highlights=[
                    "Led migration of monolith API to .NET 8 microservices",
                    "Built real-time dashboard using React, TypeScript, and WebSockets"
                ],
                certifications=["AWS Certified Developer", "Azure Fundamentals"],
                executive_summary="Experienced Full Stack .NET & React Engineer with strong background in distributed systems, PostgreSQL database design, and cloud deployments."
            )

        if self.schema_cls == CandidateEvaluation:
            return CandidateEvaluation(
                overall_match_score=88,
                skill_match_percentage=90,
                experience_match_percentage=85,
                strengths=[
                    "Extensive practical experience in .NET 8 and React/TypeScript stack",
                    "Strong background in PostgreSQL and microservices architecture",
                    "Proven leadership in system modernization"
                ],
                identified_gaps=[
                    "Limited explicit Kubernetes production experience"
                ],
                recommendation=RecommendationType.STRONG_HIRE,
                recommendation_reasoning="Candidate meets all primary technical skill requirements and exceeds minimum years of experience. Demonstrated solid full-stack proficiency with excellent architecture alignment."
            )

        # Generic default instance
        return self.schema_cls.model_construct()

def get_structured_llm(schema_cls: Type[T]):
    """
    Returns an async callable that outputs an instance of schema_cls.
    """
    llm = get_llm()
    if llm is None:
        return MockStructuredLLM(schema_cls)
    
    return llm.with_structured_output(schema_cls)
