import { Routes, Route, Navigate } from 'react-router-dom'
import { PublicLayout } from '@/components/layouts/PublicLayout'
import { CandidateLayout } from '@/components/layouts/CandidateLayout'
import { RecruiterLayout } from '@/components/layouts/RecruiterLayout'
import { InterviewerLayout } from '@/components/layouts/InterviewerLayout'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { ToastContainer } from '@/components/common/ToastContainer'

// Public & Auth Pages
import { LandingPage } from '@/pages/LandingPage'
import { PublicJobsPage } from '@/pages/jobs/PublicJobsPage'
import { JobDetailPage } from '@/pages/jobs/JobDetailPage'
import { SignInPage } from '@/pages/auth/SignInPage'
import { SignUpPage } from '@/pages/auth/SignUpPage'
import { AuthRedirectPage } from '@/pages/auth/AuthRedirectPage'
import { UnauthorizedPage } from '@/pages/UnauthorizedPage'

// Candidate Pages
import { CandidateDashboard } from '@/pages/candidate/CandidateDashboard'
import { CandidateApplicationsPage } from '@/pages/candidate/CandidateApplicationsPage'
import { CandidateApplicationDetailPage } from '@/pages/candidate/CandidateApplicationDetailPage'
import { CandidateResumePage } from '@/pages/candidate/CandidateResumePage'
import { CandidateProfilePage } from '@/pages/candidate/CandidateProfilePage'
import { CandidateInterviewsPage } from '@/pages/candidate/CandidateInterviewsPage'
import { CandidateInterviewDetailPage } from '@/pages/candidate/CandidateInterviewDetailPage'
import { CandidateAvailabilityPage } from '@/pages/candidate/CandidateAvailabilityPage'

// Recruiter Pages
import { OnboardingPage } from '@/pages/recruiter/OnboardingPage'
import { RecruiterDashboard } from '@/pages/recruiter/RecruiterDashboard'
import { TeamPage } from '@/pages/recruiter/TeamPage'
import { RecruiterJobsPage } from '@/pages/recruiter/RecruiterJobsPage'
import { CreateEditJobPage } from '@/pages/recruiter/CreateEditJobPage'
import { RecruiterCompanyPage } from '@/pages/recruiter/RecruiterCompanyPage'
import { RecruiterApplicationsPage } from '@/pages/recruiter/RecruiterApplicationsPage'
import { RecruiterApplicationDetailPage } from '@/pages/recruiter/RecruiterApplicationDetailPage'
import { RecruiterInterviewsPage } from '@/pages/recruiter/RecruiterInterviewsPage'
import { RecruiterInterviewDetailPage } from '@/pages/recruiter/RecruiterInterviewDetailPage'
import { RecruiterSchedulingPage } from '@/pages/recruiter/RecruiterSchedulingPage'
import { RecruiterAiEvaluationsPage } from '@/pages/recruiter/RecruiterAiEvaluationsPage'
import { RecruiterAiWorkflowsPage } from '@/pages/recruiter/RecruiterAiWorkflowsPage'

// Interviewer & Admin Pages
import { InterviewerDashboard } from '@/pages/interviewer/InterviewerDashboard'
import { InterviewerInterviewsPage } from '@/pages/interviewer/InterviewerInterviewsPage'
import { InterviewerInterviewDetailPage } from '@/pages/interviewer/InterviewerInterviewDetailPage'
import { InterviewerAvailabilityPage } from '@/pages/interviewer/InterviewerAvailabilityPage'
import { InterviewerHistoryPage } from '@/pages/interviewer/InterviewerHistoryPage'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'

export function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
        {/* Public Pages */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/jobs" element={<PublicJobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
        </Route>

        {/* Auth Pages */}
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route path="/auth-redirect" element={<AuthRedirectPage />} />
        <Route path="/dashboard" element={<AuthRedirectPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Recruiter Onboarding (Standalone) */}
        <Route element={<ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']} allowOnboarding={true} />}>
          <Route path="/recruiter/onboarding/*" element={<OnboardingPage />} />
        </Route>

        {/* Candidate Routes */}
        <Route element={<ProtectedRoute allowedRoles={['CANDIDATE', 'ADMIN']} />}>
          <Route path="/candidate" element={<CandidateLayout />}>
            <Route index element={<Navigate to="/candidate/dashboard" replace />} />
            <Route path="dashboard" element={<CandidateDashboard />} />
            <Route path="jobs" element={<PublicJobsPage />} />
            <Route path="jobs/:id" element={<JobDetailPage />} />
            <Route path="applications" element={<CandidateApplicationsPage />} />
            <Route path="applications/:id" element={<CandidateApplicationDetailPage />} />
            <Route path="resume" element={<CandidateResumePage />} />
            <Route path="interviews" element={<CandidateInterviewsPage />} />
            <Route path="interviews/:id" element={<CandidateInterviewDetailPage />} />
            <Route path="availability" element={<CandidateAvailabilityPage />} />
            <Route path="profile" element={<CandidateProfilePage />} />
          </Route>
        </Route>

        {/* Recruiter Workspace Routes */}
        <Route element={<ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']} />}>
          <Route path="/recruiter" element={<RecruiterLayout />}>
            <Route index element={<Navigate to="/recruiter/dashboard" replace />} />
            <Route path="dashboard" element={<RecruiterDashboard />} />
            <Route path="companies" element={<RecruiterCompanyPage />} />
            <Route path="departments" element={<RecruiterCompanyPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="jobs" element={<RecruiterJobsPage />} />
            <Route path="jobs/new" element={<CreateEditJobPage />} />
            <Route path="jobs/:id/edit" element={<CreateEditJobPage />} />
            <Route path="applications" element={<RecruiterApplicationsPage />} />
            <Route path="applications/:id" element={<RecruiterApplicationDetailPage />} />
            <Route path="ai-evaluations" element={<RecruiterAiEvaluationsPage />} />
            <Route path="scheduling" element={<RecruiterSchedulingPage />} />
            <Route path="interviews" element={<RecruiterInterviewsPage />} />
            <Route path="interviews/:id" element={<RecruiterInterviewDetailPage />} />
            <Route path="ai-workflows" element={<RecruiterAiWorkflowsPage />} />
            <Route path="analytics" element={<RecruiterDashboard />} />
          </Route>
        </Route>

        {/* Interviewer Routes */}
        <Route element={<ProtectedRoute allowedRoles={['INTERVIEWER', 'ADMIN']} />}>
          <Route path="/interviewer" element={<InterviewerLayout />}>
            <Route index element={<Navigate to="/interviewer/dashboard" replace />} />
            <Route path="dashboard" element={<InterviewerDashboard />} />
            <Route path="interviews" element={<InterviewerInterviewsPage />} />
            <Route path="interviews/:id" element={<InterviewerInterviewDetailPage />} />
            <Route path="availability" element={<InterviewerAvailabilityPage />} />
            <Route path="history" element={<InterviewerHistoryPage />} />
          </Route>
        </Route>

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminDashboard />} />
            <Route path="companies" element={<AdminDashboard />} />
            <Route path="audit-logs" element={<AdminDashboard />} />
            <Route path="analytics" element={<AdminDashboard />} />
            <Route path="settings" element={<AdminDashboard />} />
          </Route>
        </Route>

        {/* Catch-all 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
