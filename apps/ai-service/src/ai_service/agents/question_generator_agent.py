from typing import Optional, List
from ai_service.agents.base import BaseAgent
from ai_service.models.schemas import (
    JobAnalysis,
    ResumeAnalysis,
    CandidateEvaluation,
    GeneratedQuestion,
    InterviewQuestionsPayload,
    QuestionCategory,
    DifficultyLevel
)
from ai_service.prompts.templates import (
    QUESTION_GENERATOR_SYSTEM_PROMPT,
    QUESTION_GENERATOR_USER_PROMPT
)

class InterviewQuestionGeneratorAgent(BaseAgent):
    """
    Agent 5: Generates targeted technical, behavioral, problem-solving, and project-based interview questions
    tailored to a candidate's specific background and role requirements.
    """

    def __init__(self):
        super().__init__(name="InterviewQuestionGeneratorAgent", schema=InterviewQuestionsPayload)

    async def execute(
        self,
        job_analysis: JobAnalysis,
        resume_analysis: ResumeAnalysis,
        candidate_evaluation: Optional[CandidateEvaluation] = None,
        count_per_category: int = 2
    ) -> InterviewQuestionsPayload:
        self.logger.info(f"[{self.name}] Generating interview questions for candidate '{resume_analysis.candidate_name or 'Applicant'}'...")

        strengths_str = ", ".join(candidate_evaluation.strengths) if candidate_evaluation else "Solid technical foundation"
        gaps_str = ", ".join(candidate_evaluation.identified_gaps) if candidate_evaluation else "None identified"

        user_content = QUESTION_GENERATOR_USER_PROMPT.format(
            job_title=job_analysis.title,
            required_skills=", ".join(job_analysis.required_skills),
            technical_domains=", ".join(job_analysis.technical_domains),
            extracted_skills=", ".join(resume_analysis.extracted_skills),
            years_of_experience=resume_analysis.years_of_experience,
            strengths=strengths_str,
            identified_gaps=gaps_str,
            project_highlights="; ".join(resume_analysis.project_highlights),
            executive_summary=resume_analysis.executive_summary,
            question_count=count_per_category * 4
        )

        try:
            result = await self.invoke_structured_llm(
                system_prompt=QUESTION_GENERATOR_SYSTEM_PROMPT,
                user_prompt=user_content,
                agent_key="question_generator"
            )
            return result
        except Exception as ex:
            self.logger.warning(f"[{self.name}] LLM invocation failed, using deterministic question templates: {ex}")
            return self._deterministic_fallback(job_analysis, resume_analysis)

    def _deterministic_fallback(
        self,
        job: JobAnalysis,
        cand: ResumeAnalysis
    ) -> InterviewQuestionsPayload:
        """
        Deterministic high-quality fallback questions categorized across all 4 categories.
        """
        top_skills = job.required_skills[:2] or ["Software Architecture", "API Design"]
        primary_skill = top_skills[0] if top_skills else "distributed systems"
        secondary_skill = top_skills[1] if len(top_skills) > 1 else "database optimization"

        questions: List[GeneratedQuestion] = [
            # 1. Technical Questions
            GeneratedQuestion(
                category=QuestionCategory.TECHNICAL,
                question=f"Can you explain how you handle concurrency, state management, and error resilience when working with {primary_skill}?",
                rationale=f"Assesses technical depth in core required skill: {primary_skill}.",
                expected_answer_rubric="Look for clear explanations of thread safety, idempotency, async patterns, and error boundaries.",
                difficulty=DifficultyLevel.MEDIUM
            ),
            GeneratedQuestion(
                category=QuestionCategory.TECHNICAL,
                question=f"How do you approach performance tuning, indexing, and caching when scaling {secondary_skill} in high-throughput applications?",
                rationale=f"Evaluates production scalability understanding in {secondary_skill}.",
                expected_answer_rubric="Strong candidates discuss query execution plans, Redis caching strategies, connection pooling, and latency metrics.",
                difficulty=DifficultyLevel.HARD
            ),

            # 2. Problem Solving Questions
            GeneratedQuestion(
                category=QuestionCategory.PROBLEM_SOLVING,
                question="Walk us through how you would architect an event-driven notification service that processes 10,000 notifications per minute with zero message loss.",
                rationale="Evaluates architectural system design and distributed failure recovery.",
                expected_answer_rubric="Expect discussion of message queues (Kafka/RabbitMQ), consumer backpressure, dead-letter queues, and database transactions.",
                difficulty=DifficultyLevel.HARD
            ),
            GeneratedQuestion(
                category=QuestionCategory.PROBLEM_SOLVING,
                question="Describe an instance where a production service was experiencing intermittent timeouts. How did you isolate and resolve the root cause?",
                rationale="Tests real-world debugging methodology and observability usage.",
                expected_answer_rubric="Candidate should articulate structured debugging: log correlation IDs, APM traces, database locks, and post-mortem fixes.",
                difficulty=DifficultyLevel.MEDIUM
            ),

            # 3. Behavioral Questions
            GeneratedQuestion(
                category=QuestionCategory.BEHAVIORAL,
                question="Tell me about a time you had a technical disagreement with a colleague on architectural direction. How did you resolve it?",
                rationale="Assesses communication, empathy, and constructive debate skills.",
                expected_answer_rubric="Look for data-driven resolution, objective benchmarking/POCs, and commitment to the team's shared goals.",
                difficulty=DifficultyLevel.MEDIUM
            ),
            GeneratedQuestion(
                category=QuestionCategory.BEHAVIORAL,
                question="How do you balance delivering business features quickly against managing technical debt and code refactoring?",
                rationale="Measures engineering maturity and pragmatic tradeoff assessment.",
                expected_answer_rubric="Candidate should explain pragmatic prioritization, creating technical debt tickets, and incremental refactoring.",
                difficulty=DifficultyLevel.EASY
            ),

            # 4. Project-Based Questions
            GeneratedQuestion(
                category=QuestionCategory.PROJECT_BASED,
                question="Looking at your recent project work, what was the most challenging technical hurdle you overcame, and what would you do differently in retrospect?",
                rationale="Evaluates technical ownership and continuous learning from past projects.",
                expected_answer_rubric="Clear breakdown of problem context, design iterations, metrics of success, and reflective self-critique.",
                difficulty=DifficultyLevel.MEDIUM
            ),
            GeneratedQuestion(
                category=QuestionCategory.PROJECT_BASED,
                question="How did you structure automated testing, CI/CD, and monitoring for the applications you built in your previous position?",
                rationale="Tests engineering rigor and modern DevOps practices.",
                expected_answer_rubric="Candidate should discuss unit/integration test coverage, deployment pipelines, and alerting alerts.",
                difficulty=DifficultyLevel.EASY
            )
        ]

        return InterviewQuestionsPayload(questions=questions)
