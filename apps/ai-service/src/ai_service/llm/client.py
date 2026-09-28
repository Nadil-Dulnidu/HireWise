import os
import re
from typing import Type, TypeVar, Optional, Any, List
from pydantic import BaseModel
from ai_service.core.config import settings
from ai_service.core.logging import logger
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
    RecommendedSlot,
)

T = TypeVar("T", bound=BaseModel)


def is_vertex_configured() -> bool:
    """Checks if Google Cloud Vertex AI infrastructure / ADC / Service Account is configured."""
    if settings.USE_VERTEX_AI:
        return True
    if settings.VERTEX_PROJECT_ID or settings.GOOGLE_CLOUD_PROJECT:
        return True
    if settings.GOOGLE_APPLICATION_CREDENTIALS_JSON or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON"):
        return True
    cred_file = settings.GOOGLE_APPLICATION_CREDENTIALS or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if cred_file:
        if cred_file.strip().startswith("{") or os.path.exists(cred_file):
            return True
    # Standard ADC paths (Linux container / Unix)
    default_adc = os.path.expanduser("~/.config/gcloud/application_default_credentials.json")
    if os.path.exists(default_adc):
        return True
    return False


def is_google_api_configured() -> bool:
    """Checks if a valid Google Gemini API key or Vertex AI / ADC configuration is set."""
    if bool(settings.GOOGLE_API_KEY and len(settings.GOOGLE_API_KEY.strip()) > 5):
        return True
    return is_vertex_configured()


def get_llm(
    model: Optional[str] = None,
    temperature: float = 0.1,
    max_tokens: Optional[int] = None,
):
    """
    Initializes and returns LangChain ChatVertexAI or ChatGoogleGenerativeAI instance.
    Supports Vertex AI (via Service Account JSON key or Application Default Credentials)
    and Google AI Studio API key.
    Model is configured via .env, while temperature and token limits are specified per-agent.
    """
    if not is_google_api_configured():
        logger.info(
            "Neither Google API Key nor Vertex AI ADC configured. Using Mock LLM simulation for local execution."
        )
        return None

    target_model = model or settings.GEMINI_MODEL
    target_temperature = temperature
    target_max_tokens = max_tokens

    # 1. Prefer Vertex AI / Service Account / ADC when USE_VERTEX_AI is True or API Key is absent
    if is_vertex_configured() and (settings.USE_VERTEX_AI or not settings.GOOGLE_API_KEY):
        try:
            from langchain_google_vertexai import ChatVertexAI
            import google.auth
            import json

            project = settings.VERTEX_PROJECT_ID or settings.GOOGLE_CLOUD_PROJECT or os.environ.get("GOOGLE_CLOUD_PROJECT")
            location = settings.VERTEX_LOCATION or "us-central1"
            raw_json = settings.GOOGLE_APPLICATION_CREDENTIALS_JSON or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON")
            cred_file = settings.GOOGLE_APPLICATION_CREDENTIALS or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")

            # Check if GOOGLE_APPLICATION_CREDENTIALS was passed directly as a raw JSON string
            if not raw_json and cred_file and cred_file.strip().startswith("{"):
                raw_json = cred_file
                cred_file = None

            credentials = None
            if raw_json:
                try:
                    data = json.loads(raw_json)
                    credentials, auth_proj = google.auth.load_credentials_from_dict(data)
                    if not project and auth_proj:
                        project = auth_proj
                    logger.info("Loaded Google credentials from JSON string")
                except Exception as ex:
                    logger.warning(f"Failed to load credentials from JSON string: {ex}")
            elif cred_file and os.path.exists(cred_file):
                try:
                    credentials, auth_proj = google.auth.load_credentials_from_file(cred_file)
                    if not project and auth_proj:
                        project = auth_proj
                    logger.info(f"Loaded Google credentials from: {cred_file}")
                except Exception as ex:
                    logger.warning(f"Failed to load credentials from {cred_file}: {ex}")
            else:
                try:
                    credentials, auth_proj = google.auth.default()
                    if not project and auth_proj:
                        project = auth_proj
                    logger.info(f"Discovered Application Default Credentials (project: {project})")
                except Exception as ex:
                    logger.debug(f"Default ADC auto-detection returned: {ex}")

            kwargs: dict[str, Any] = {
                "model_name": target_model,
                "temperature": target_temperature,
                "location": location,
            }
            if project:
                kwargs["project"] = project
            if credentials:
                kwargs["credentials"] = credentials
            if target_max_tokens:
                kwargs["max_output_tokens"] = target_max_tokens

            logger.info(f"Initialized ChatVertexAI with model '{target_model}', project '{project}', location '{location}'")
            return ChatVertexAI(**kwargs)
        except Exception as ex:
            logger.error(f"Failed to initialize ChatVertexAI: {ex}. Falling back to API Key if available.")

    # 2. Google AI Studio / Gemini API Key
    if settings.GOOGLE_API_KEY and len(settings.GOOGLE_API_KEY.strip()) > 5:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI

            kwargs = {
                "model": target_model,
                "google_api_key": settings.GOOGLE_API_KEY,
                "temperature": target_temperature,
                "convert_system_message_to_human": True,
            }
            if target_max_tokens:
                kwargs["max_output_tokens"] = target_max_tokens

            logger.info(f"Initialized ChatGoogleGenerativeAI with model '{target_model}'")
            return ChatGoogleGenerativeAI(**kwargs)
        except Exception as ex:
            logger.error(f"Failed to initialize ChatGoogleGenerativeAI: {ex}")

    logger.warning("No live LLM provider could be initialized. Falling back to Mock LLM simulation.")
    return None


class MockStructuredLLM:
    """
    Simulates structured agent responses when Google API Key is not configured.
    Dynamically extracts context from prompts to ensure realistic, deterministic test runs.
    """

    def __init__(self, schema_cls: Type[T]):
        self.schema_cls = schema_cls

    async def ainvoke(self, messages: Any) -> T:
        msg_str = ""
        if isinstance(messages, list):
            for m in messages:
                content = getattr(m, "content", str(m))
                msg_str += f"\n{content}"
        else:
            msg_str = str(messages)

        logger.info(
            f"MockStructuredLLM generating structured response for {self.schema_cls.__name__}"
        )

        if self.schema_cls == JobAnalysis:
            # Extract job title if present in prompt
            title_match = re.search(r"Job Title:\s*(.+)", msg_str, re.IGNORECASE)
            job_title = (
                title_match.group(1).strip() if title_match else "Software Engineer"
            )

            tech_keywords = [
                "react",
                "typescript",
                "javascript",
                "c#",
                "asp.net",
                ".net",
                "dotnet",
                "python",
                "fastapi",
                "postgresql",
                "sql",
                "redis",
                "docker",
                "kubernetes",
                "aws",
                "gcp",
                "azure",
                "go",
                "kafka",
                "graphql",
                "microservices",
            ]
            found_skills = [
                kw.capitalize() for kw in tech_keywords if kw in msg_str.lower()
            ]
            if not found_skills:
                found_skills = ["Software Engineering", "Problem Solving"]

            min_exp = (
                5
                if "senior" in job_title.lower() or "lead" in job_title.lower()
                else (4 if "architect" in job_title.lower() else 2)
            )

            return JobAnalysis(
                title=job_title,
                required_skills=found_skills[:4],
                preferred_skills=found_skills[4:7],
                min_years_experience=min_exp,
                education_level="Bachelor's in Computer Science or equivalent",
                technical_domains=["Backend", "Cloud", "Distributed Systems"]
                if "backend" in job_title.lower()
                else ["Full Stack"],
                key_responsibilities=[
                    "Design and implement robust production microservices",
                    "Collaborate with product and engineering teams to ship features",
                    "Maintain automated testing pipelines and code quality",
                ],
            )

        if self.schema_cls == ResumeAnalysis:
            # Extract candidate name or skills
            name_match = re.search(r"([A-Z][a-z]+ [A-Z][a-z]+)", msg_str)
            name = name_match.group(1) if name_match else "Applicant"

            tech_keywords = [
                "react",
                "typescript",
                "javascript",
                "c#",
                "asp.net",
                ".net",
                "dotnet",
                "python",
                "fastapi",
                "postgresql",
                "sql",
                "redis",
                "docker",
                "kubernetes",
                "aws",
                "gcp",
                "azure",
                "go",
                "kafka",
                "graphql",
                "microservices",
            ]
            found_skills = [
                kw.capitalize() for kw in tech_keywords if kw in msg_str.lower()
            ]
            if not found_skills:
                found_skills = ["Software Engineering", "Full Stack Development"]

            exp_match = re.search(r"(\d+)\+?\s*years?", msg_str, re.IGNORECASE)
            years = float(exp_match.group(1)) if exp_match else 4.0

            return ResumeAnalysis(
                candidate_name=name,
                extracted_skills=found_skills,
                years_of_experience=years,
                education_history=["B.S. in Computer Science"],
                project_highlights=[
                    "Engineered core backend APIs handling high-throughput production workloads",
                    "Implemented CI/CD automation and containerized deployments",
                ],
                certifications=["Cloud Developer Certificate"],
                executive_summary=f"Experienced engineer with {years} years of background across modern software architectures.",
            )

        if self.schema_cls == CandidateEvaluation:
            # Perform dynamic assessment based on prompt text
            req_match = re.search(r"Required Skills:\s*(.+)", msg_str, re.IGNORECASE)
            cand_skills_match = re.search(
                r"Extracted Skills:\s*(.+)", msg_str, re.IGNORECASE
            )
            req_exp_match = re.search(
                r"Min Experience:\s*(\d+)", msg_str, re.IGNORECASE
            )
            cand_exp_match = re.search(
                r"Years of Experience:\s*([\d\.]+)", msg_str, re.IGNORECASE
            )

            req_skills = [
                s.strip().lower()
                for s in (req_match.group(1).split(",") if req_match else [])
                if s.strip()
            ]
            cand_skills = [
                s.strip().lower()
                for s in (
                    cand_skills_match.group(1).split(",") if cand_skills_match else []
                )
                if s.strip()
            ]
            min_exp = float(req_exp_match.group(1)) if req_exp_match else 3.0
            cand_exp = float(cand_exp_match.group(1)) if cand_exp_match else 3.0

            if req_skills:
                matches = set(req_skills).intersection(set(cand_skills))
                skill_score = int((len(matches) / len(req_skills)) * 100)
                missing = list(set(req_skills) - set(cand_skills))
            else:
                skill_score = 80
                missing = []

            exp_score = min(int((cand_exp / max(min_exp, 1.0)) * 100), 100)
            overall_score = max(0, min(int(skill_score * 0.6 + exp_score * 0.4), 100))

            if overall_score >= 80:
                rec = RecommendationType.STRONG_HIRE
            elif overall_score >= 65:
                rec = RecommendationType.HIRE
            elif overall_score >= 45:
                rec = RecommendationType.NO_HIRE
            else:
                rec = RecommendationType.STRONG_NO_HIRE

            gaps = [f"Missing required skill: {m}" for m in missing[:3]]
            if cand_exp < min_exp:
                gaps.append(
                    f"Experience ({cand_exp} yrs) below requirement ({min_exp} yrs)"
                )

            return CandidateEvaluation(
                overall_match_score=overall_score,
                skill_match_percentage=skill_score,
                experience_match_percentage=exp_score,
                strengths=[
                    f"Strong alignment in key technologies: {', '.join(cand_skills[:3]) if cand_skills else 'general engineering'}",
                    f"Relevant professional background ({cand_exp:.1f} years)",
                ],
                identified_gaps=gaps,
                recommendation=rec,
                recommendation_reasoning=f"Evaluated match at {overall_score}% with {skill_score}% skill overlap and {exp_score}% experience overlap. Recommended: {rec.value}.",
            )

        if self.schema_cls == InterviewQuestionsPayload:
            from ai_service.agents.question_generator_agent import (
                InterviewQuestionGeneratorAgent,
            )

            q_agent = InterviewQuestionGeneratorAgent()
            ja = JobAnalysis(
                title="Software Engineer", required_skills=["C#", "PostgreSQL", "React"]
            )
            ra = ResumeAnalysis(extracted_skills=["C#", "PostgreSQL", "React"])
            return q_agent._deterministic_fallback(ja, ra)

        # Generic default instance
        return self.schema_cls.model_construct()


def get_structured_llm(
    schema_cls: Type[T],
    model: Optional[str] = None,
    temperature: float = 0.1,
    max_tokens: Optional[int] = None,
):
    """
    Returns an async callable that outputs an instance of schema_cls.
    Accepts agent-specific temperature and token limits.
    """
    llm = get_llm(model=model, temperature=temperature, max_tokens=max_tokens)
    if llm is None:
        return MockStructuredLLM(schema_cls)

    return llm.with_structured_output(schema_cls)
