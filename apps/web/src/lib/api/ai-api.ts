import { apiClient } from "../api-client";
import type { ApiResponse } from "@/types/auth";

export type RecommendationType =
  | "STRONG_HIRE"
  | "HIRE"
  | "NO_HIRE"
  | "STRONG_NO_HIRE";
export type DifficultyLevel = "EASY" | "MEDIUM" | "HARD";
export type QuestionCategory =
  | "TECHNICAL"
  | "BEHAVIORAL"
  | "PROBLEM_SOLVING"
  | "PROJECT_BASED";

export interface GeneratedQuestion {
  category: QuestionCategory;
  question: string;
  rationale: string;
  expected_answer_rubric: string;
  difficulty: DifficultyLevel;
}

export interface CandidateEvaluation {
  overall_match_score: number;
  skill_match_percentage: number;
  experience_match_percentage: number;
  strengths: string[];
  identified_gaps: string[];
  recommendation: RecommendationType;
  recommendation_reasoning: string;
}

export interface JobAnalysis {
  title: string;
  required_skills: string[];
  preferred_skills: string[];
  min_years_experience: number;
  education_level?: string;
  technical_domains: string[];
  key_responsibilities: string[];
}

export interface ResumeAnalysis {
  candidate_name?: string;
  extracted_skills: string[];
  years_of_experience: number;
  education_history: string[];
  project_highlights: string[];
  certifications: string[];
  executive_summary?: string;
}

export interface StepResponse {
  id: string;
  workflow_id: string;
  agent_name: string;
  step_name: string;
  step_order: number;
  status: string;
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  validation_result?: Record<string, any>;
  retry_count: number;
  started_at?: string;
  completed_at?: string;
}

export interface WorkflowDetail {
  workflow_id: string;
  application_id: string;
  objective: string;
  status: string;
  current_step: string;
  plan?: Array<Record<string, any>>;
  completed_steps?: string[];
  final_result?: {
    job_analysis?: JobAnalysis;
    resume_analysis?: ResumeAnalysis;
    evaluation?: CandidateEvaluation;
    candidate_evaluation?: CandidateEvaluation;
    validation?: {
      is_valid: boolean;
      validation_errors: string[];
      warnings: string[];
      confidence_score: number;
    };
    validation_result?: {
      is_valid: boolean;
      validation_errors: string[];
      warnings: string[];
      confidence_score: number;
    };
    questions?: { questions: GeneratedQuestion[] } | GeneratedQuestion[];
    interview_questions?: { questions: GeneratedQuestion[] } | GeneratedQuestion[];
    scheduling?: Record<string, any>;
    scheduling_recommendation?: Record<string, any>;
    [key: string]: any;
  };
  steps: StepResponse[];
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface ApplicationWorkflowResponse {
  applicationId: string;
  jobTitle: string;
  candidateName: string;
  workflow: WorkflowDetail;
}

export interface AiEvaluationSummary {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  resumeUrl?: string;
  status: string;
  aiWorkflowId?: string;
  appliedAt: string;
}

export const aiApi = {
  getAiEvaluations: async (params?: {
    jobId?: string;
    statusFilter?: string;
  }): Promise<AiEvaluationSummary[]> => {
    const res = await apiClient.get<ApiResponse<AiEvaluationSummary[]>>(
      "/ai/evaluations",
      { params },
    );
    return res.data.data || [];
  },

  getApplicationWorkflow: async (
    applicationId: string,
  ): Promise<ApplicationWorkflowResponse> => {
    const res = await apiClient.get<ApiResponse<ApplicationWorkflowResponse>>(
      `/ai/applications/${applicationId}/workflow`,
    );
    return res.data.data!;
  },

  getWorkflowDetails: async (workflowId: string): Promise<WorkflowDetail> => {
    const res = await apiClient.get<ApiResponse<WorkflowDetail>>(
      `/ai/workflows/${workflowId}`,
    );
    return res.data.data!;
  },

  getWorkflowSteps: async (workflowId: string): Promise<StepResponse[]> => {
    const res = await apiClient.get<ApiResponse<StepResponse[]>>(
      `/ai/workflows/${workflowId}/steps`,
    );
    return res.data.data || [];
  },

  triggerEvaluation: async (
    applicationId: string,
  ): Promise<{ applicationId: string; status: string; message: string }> => {
    const res = await apiClient.post<
      ApiResponse<{ applicationId: string; status: string; message: string }>
    >(`/ai/applications/${applicationId}/evaluate`);
    return res.data.data!;
  },
};
