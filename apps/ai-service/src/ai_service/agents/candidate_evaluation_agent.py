from typing import List
from ai_service.agents.base import BaseAgent
from ai_service.models.schemas import (
    JobAnalysis,
    ResumeAnalysis,
    CandidateEvaluation,
    RecommendationType,
)
from ai_service.prompts.templates import (
    CANDIDATE_EVALUATION_SYSTEM_PROMPT,
    CANDIDATE_EVALUATION_USER_PROMPT,
)


class CandidateEvaluationAgent(BaseAgent):
    """
    Agent 3: Evaluates candidate resume against job analysis to generate fit scores, gap analysis, and recommendations.
    """

    def __init__(self):
        super().__init__(name="CandidateEvaluationAgent", schema=CandidateEvaluation)

    async def execute(
        self, job_analysis: JobAnalysis, resume_analysis: ResumeAnalysis
    ) -> CandidateEvaluation:
        self.logger.info(
            f"[{self.name}] Evaluating candidate against '{job_analysis.title}'..."
        )

        user_content = CANDIDATE_EVALUATION_USER_PROMPT.format(
            job_title=job_analysis.title,
            required_skills=", ".join(job_analysis.required_skills),
            preferred_skills=", ".join(job_analysis.preferred_skills),
            min_years_experience=job_analysis.min_years_experience,
            technical_domains=", ".join(job_analysis.technical_domains),
            extracted_skills=", ".join(resume_analysis.extracted_skills),
            years_of_experience=resume_analysis.years_of_experience,
            education_history=", ".join(resume_analysis.education_history),
            project_highlights="; ".join(resume_analysis.project_highlights),
            certifications=", ".join(resume_analysis.certifications),
            executive_summary=resume_analysis.executive_summary,
        )

        try:
            result = await self.invoke_structured_llm(
                system_prompt=CANDIDATE_EVALUATION_SYSTEM_PROMPT,
                user_prompt=user_content,
                agent_key="candidate_evaluation",
            )
            return result
        except Exception as ex:
            self.logger.warning(
                f"[{self.name}] LLM invocation failed, using deterministic scoring fallback: {ex}"
            )
            return self._deterministic_scoring(job_analysis, resume_analysis)

    def _deterministic_scoring(
        self, job: JobAnalysis, cand: ResumeAnalysis
    ) -> CandidateEvaluation:
        """
        Deterministic scoring algorithm computing skill overlap and experience ratios.
        """
        req_set = {s.lower().strip() for s in job.required_skills if s.strip()}
        cand_set = {s.lower().strip() for s in cand.extracted_skills if s.strip()}

        # 1. Skill Match
        if req_set:
            matched_skills = req_set.intersection(cand_set)
            skill_score = int((len(matched_skills) / len(req_set)) * 100)
            missing_skills = list(req_set - cand_set)
        else:
            skill_score = 80
            missing_skills = []

        # 2. Experience Match
        min_exp = max(job.min_years_experience, 1)
        exp_score = min(int((cand.years_of_experience / min_exp) * 100), 100)

        # 3. Overall Match Score (60% skills, 40% experience)
        overall_score = int((skill_score * 0.6) + (exp_score * 0.4))
        overall_score = max(0, min(overall_score, 100))

        # 4. Recommendation Determination
        if overall_score >= 85:
            recommendation = RecommendationType.STRONG_HIRE
        elif overall_score >= 70:
            recommendation = RecommendationType.HIRE
        elif overall_score >= 50:
            recommendation = RecommendationType.NO_HIRE
        else:
            recommendation = RecommendationType.STRONG_NO_HIRE

        strengths = [
            f"Proficiency in key technologies: {', '.join(list(cand_set)[:4])}",
            f"Possesses {cand.years_of_experience:.1f} years of relevant engineering background",
        ]

        gaps = []
        if missing_skills:
            gaps.append(
                f"Missing explicit required skill(s): {', '.join(missing_skills[:3])}"
            )
        if cand.years_of_experience < job.min_years_experience:
            gaps.append(
                f"Experience ({cand.years_of_experience:.1f} yrs) below role requirement ({job.min_years_experience} yrs)"
            )

        reasoning = (
            f"Candidate achieved a {overall_score}% holistic match with {skill_score}% skill alignment "
            f"and {exp_score}% experience alignment. Evaluation produced recommendation: {recommendation.value}."
        )

        return CandidateEvaluation(
            overall_match_score=overall_score,
            skill_match_percentage=skill_score,
            experience_match_percentage=exp_score,
            strengths=strengths,
            identified_gaps=gaps,
            recommendation=recommendation,
            recommendation_reasoning=reasoning,
        )
