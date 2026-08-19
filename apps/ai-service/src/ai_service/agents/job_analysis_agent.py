from ai_service.agents.base import BaseAgent
from ai_service.models.schemas import JobAnalysis
from ai_service.prompts.templates import (
    JOB_ANALYSIS_SYSTEM_PROMPT,
    JOB_ANALYSIS_USER_PROMPT
)

class JobDescriptionAnalysisAgent(BaseAgent):
    """
    Agent 1: Analyzes job title, description, and requirements to extract structured technical specifications.
    """

    def __init__(self):
        super().__init__(name="JobDescriptionAnalysisAgent", schema=JobAnalysis)

    async def execute(
        self,
        job_title: str,
        job_description: str,
        job_requirements: str = ""
    ) -> JobAnalysis:
        self.logger.info(f"[{self.name}] Analyzing job posting: '{job_title}'")

        user_content = JOB_ANALYSIS_USER_PROMPT.format(
            job_title=job_title,
            job_description=job_description or "No description provided",
            job_requirements=job_requirements or "No requirements provided"
        )

        try:
            result = await self.invoke_structured_llm(
                system_prompt=JOB_ANALYSIS_SYSTEM_PROMPT,
                user_prompt=user_content
            )
            return result
        except Exception as ex:
            self.logger.warning(f"[{self.name}] LLM invocation failed, using deterministic fallback: {ex}")
            return self._deterministic_fallback(job_title, job_description, job_requirements)

    def _deterministic_fallback(
        self,
        job_title: str,
        job_description: str,
        job_requirements: str
    ) -> JobAnalysis:
        """
        Deterministic rule-based keyword extraction fallback if LLM is unreachable.
        """
        combined = f"{job_title} {job_description} {job_requirements}".lower()
        
        tech_keywords = [
            "react", "typescript", "c#", "asp.net", ".net", "dotnet", "python",
            "fastapi", "postgresql", "sql", "docker", "kubernetes", "gcp", "aws",
            "azure", "langchain", "langgraph", "graphql", "redis", "kafka", "ci/cd"
        ]
        
        extracted_required = [kw.capitalize() for kw in tech_keywords if kw in combined]
        if not extracted_required:
            extracted_required = ["Software Development", "Problem Solving"]

        return JobAnalysis(
            title=job_title,
            required_skills=extracted_required[:5],
            preferred_skills=extracted_required[5:8],
            min_years_experience=3 if "senior" in job_title.lower() else (5 if "lead" in job_title.lower() else 1),
            education_level="Bachelor's in Computer Science or equivalent experience",
            technical_domains=["Backend", "Frontend", "Cloud"] if "full stack" in job_title.lower() else ["Software Engineering"],
            key_responsibilities=[
                "Architect and develop scalable features",
                "Collaborate with cross-functional engineering teams",
                "Ensure robust code quality and automated testing"
            ]
        )
