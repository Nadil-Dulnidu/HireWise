import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { interviewsApi } from "@/lib/api/interviews-api";
import {
  ArrowLeft,
  Video,
  FileText,
  FileQuestion,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Edit3,
} from "lucide-react";
import type {
  SubmitFeedbackRequest,
  RecommendationType,
} from "@/types/interviews";

export function InterviewerInterviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // Form State
  const [techRating, setTechRating] = useState<number>(4);
  const [problemSolvingRating, setProblemSolvingRating] = useState<number>(4);
  const [commRating, setCommRating] = useState<number>(4);
  const [cultureRating, setCultureRating] = useState<number>(4);
  const [recommendation, setRecommendation] =
    useState<RecommendationType>("HIRE");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [notes, setNotes] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    data: interview,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["interviewDetail", id],
    queryFn: () => interviewsApi.getInterviewById(id!),
    enabled: !!id,
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: (data: SubmitFeedbackRequest) =>
      interviewsApi.submitFeedback(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviewDetail", id] });
      setSuccessMsg("Feedback submitted successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccessMsg(null), 3500);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error || "Failed to submit feedback.");
    },
  });

  const updateFeedbackMutation = useMutation({
    mutationFn: (data: SubmitFeedbackRequest) =>
      interviewsApi.updateFeedback(interview!.feedback!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviewDetail", id] });
      setSuccessMsg("Feedback updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccessMsg(null), 3500);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error || "Failed to update feedback.");
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
        <p className="text-sm text-slate-500">Loading interview details...</p>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">
          Interview Not Found
        </h3>
        <Link
          to="/interviewer/interviews"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Interviews
        </Link>
      </div>
    );
  }

  const existingFeedback = interview.feedback;
  const calculatedOverall = (
    (techRating + problemSolvingRating + commRating + cultureRating) /
    4
  ).toFixed(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: SubmitFeedbackRequest = {
      technicalSkillsRating: techRating,
      problemSolvingRating: problemSolvingRating,
      communicationRating: commRating,
      culturalFitRating: cultureRating,
      recommendation,
      strengths: strengths.trim(),
      weaknesses: weaknesses.trim(),
      notes: notes.trim(),
    };

    if (existingFeedback) {
      updateFeedbackMutation.mutate(payload);
    } else {
      submitFeedbackMutation.mutate(payload);
    }
  };

  const handleStartEdit = () => {
    if (existingFeedback) {
      setTechRating(existingFeedback.technicalSkillsRating);
      setProblemSolvingRating(existingFeedback.problemSolvingRating);
      setCommRating(existingFeedback.communicationRating);
      setCultureRating(existingFeedback.culturalFitRating);
      setRecommendation(existingFeedback.recommendation);
      setStrengths(existingFeedback.strengths || "");
      setWeaknesses(existingFeedback.weaknesses || "");
      setNotes(existingFeedback.notes || "");
    }
    setIsEditing(true);
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        to="/interviewer/interviews"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition font-medium"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Assigned Interviews
      </Link>

      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Evaluation: {interview.candidateName}
            </h1>
            <p className="text-sm text-slate-500">
              Applying for{" "}
              <span className="text-slate-800 font-medium">
                {interview.jobTitle}
              </span>{" "}
              ({interview.companyName})
            </p>
          </div>

          <div className="flex items-center gap-3">
            {interview.meetingLink && (
              <a
                href={interview.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white transition shadow-sm"
              >
                <Video className="h-4 w-4" /> Join Google Meet
              </a>
            )}
            {interview.resumeSnapshotUrl && (
              <a
                href={interview.resumeSnapshotUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700 border border-slate-200 transition"
              >
                <FileText className="h-4 w-4 text-indigo-600" /> View Resume
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {errorMsg}
        </div>
      )}

      {/* 2-Column: Left = Candidate & Questions, Right = Feedback Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): AI Questions & Info */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI Questions Bank */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileQuestion className="h-4 w-4 text-indigo-600" /> AI Interview
              Prompts
            </h3>

            {interview.questions && interview.questions.length > 0 ? (
              <div className="space-y-3">
                {interview.questions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-indigo-700">
                        {q.category}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 text-[10px] font-medium">
                        {q.difficultyLevel}
                      </span>
                    </div>
                    <p className="text-slate-900 font-medium">{q.question}</p>
                    {q.expectedAnswer && (
                      <p className="text-slate-500 italic">
                        Expected: {q.expectedAnswer}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">
                  Suggested Competency Areas:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-500">
                  <li>System architecture & scalability tradeoffs</li>
                  <li>Coding proficiency & algorithm complexity</li>
                  <li>Cross-functional communication & collaboration</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Feedback Form or Feedback Card */}
        <div className="lg:col-span-7 space-y-6">
          {existingFeedback && !isEditing ? (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />{" "}
                  Submitted Evaluation
                </h3>
                <button
                  onClick={handleStartEdit}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 border border-slate-200 transition cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit Feedback
                </button>
              </div>

              {/* Overall Score Badge */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">
                    Overall Assessment Score
                  </p>
                  <h4 className="text-2xl font-black text-emerald-700 mt-0.5">
                    {existingFeedback.overallRating}{" "}
                    <span className="text-sm font-normal text-slate-400">
                      / 5.0
                    </span>
                  </h4>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Recommendation</p>
                  <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {existingFeedback.recommendation.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500">Technical Skills</span>
                  <p className="text-base font-bold text-slate-900 mt-1">
                    {existingFeedback.technicalSkillsRating} / 5
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500">Problem Solving</span>
                  <p className="text-base font-bold text-slate-900 mt-1">
                    {existingFeedback.problemSolvingRating} / 5
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500">Communication</span>
                  <p className="text-base font-bold text-slate-900 mt-1">
                    {existingFeedback.communicationRating} / 5
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500">Cultural Fit</span>
                  <p className="text-base font-bold text-slate-900 mt-1">
                    {existingFeedback.culturalFitRating} / 5
                  </p>
                </div>
              </div>

              {/* Text Fields */}
              {existingFeedback.strengths && (
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-emerald-700">
                    Key Strengths
                  </p>
                  <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 whitespace-pre-wrap">
                    {existingFeedback.strengths}
                  </p>
                </div>
              )}

              {existingFeedback.weaknesses && (
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-amber-700">
                    Areas for Improvement
                  </p>
                  <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 whitespace-pre-wrap">
                    {existingFeedback.weaknesses}
                  </p>
                </div>
              )}

              {existingFeedback.notes && (
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-slate-700">
                    Additional Notes
                  </p>
                  <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 whitespace-pre-wrap">
                    {existingFeedback.notes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Editable Feedback Form */
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" /> Structured
                  Interview Rubric
                </h3>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  Avg: {calculatedOverall} / 5
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 4 Ratings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 flex justify-between mb-1.5">
                      <span>Technical Skills</span>
                      <span className="text-emerald-700 font-bold">
                        {techRating} / 5
                      </span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={techRating}
                      onChange={(e) => setTechRating(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 flex justify-between mb-1.5">
                      <span>Problem Solving</span>
                      <span className="text-emerald-700 font-bold">
                        {problemSolvingRating} / 5
                      </span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={problemSolvingRating}
                      onChange={(e) =>
                        setProblemSolvingRating(Number(e.target.value))
                      }
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 flex justify-between mb-1.5">
                      <span>Communication</span>
                      <span className="text-emerald-700 font-bold">
                        {commRating} / 5
                      </span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={commRating}
                      onChange={(e) => setCommRating(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 flex justify-between mb-1.5">
                      <span>Cultural Fit</span>
                      <span className="text-emerald-700 font-bold">
                        {cultureRating} / 5
                      </span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={cultureRating}
                      onChange={(e) => setCultureRating(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Final Recommendation */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Hiring Recommendation
                  </label>
                  <select
                    value={recommendation}
                    onChange={(e) =>
                      setRecommendation(e.target.value as RecommendationType)
                    }
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 font-medium cursor-pointer"
                  >
                    <option value="STRONG_HIRE">Strong Hire</option>
                    <option value="HIRE">Hire</option>
                    <option value="NO_HIRE">No Hire</option>
                    <option value="STRONG_NO_HIRE">Strong No Hire</option>
                  </select>
                </div>

                {/* Strengths */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Key Strengths Observed
                  </label>
                  <textarea
                    rows={2}
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    placeholder="Candidate demonstrated mastery in distributed caches and concise explanations..."
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>

                {/* Weaknesses */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Areas for Growth / Weaknesses
                  </label>
                  <textarea
                    rows={2}
                    value={weaknesses}
                    onChange={(e) => setWeaknesses(e.target.value)}
                    placeholder="Could improve in explaining asynchronous error propagation edge cases..."
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Summary Notes for Recruiter
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Overall solid candidate, recommended to proceed with offer..."
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={
                      submitFeedbackMutation.isPending ||
                      updateFeedbackMutation.isPending
                    }
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {submitFeedbackMutation.isPending ||
                    updateFeedbackMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {existingFeedback ? "Save Changes" : "Submit Evaluation"}
                  </button>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm text-slate-700 border border-slate-200 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
