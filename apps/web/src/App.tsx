import { Routes, Route, Navigate } from 'react-router-dom'
import { PublicLayout } from '@/components/layouts/PublicLayout'
import { CandidateLayout } from '@/components/layouts/CandidateLayout'
import { RecruiterLayout } from '@/components/layouts/RecruiterLayout'
import { InterviewerLayout } from '@/components/layouts/InterviewerLayout'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'

// Pages
import { LandingPage } from '@/pages/LandingPage'
import { PublicJobsPage } from '@/pages/jobs/PublicJobsPage'
import { SignInPage } from '@/pages/auth/SignInPage'
import { SignUpPage } from '@/pages/auth/SignUpPage'
import { UnauthorizedPage } from '@/pages/UnauthorizedPage'
import { CandidateDashboard } from '@/pages/candidate/CandidateDashboard'
import { RecruiterDashboard } from '@/pages/recruiter/RecruiterDashboard'
import { InterviewerDashboard } from '@/pages/interviewer/InterviewerDashboard'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'

export function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/jobs" element={<PublicJobsPage />} />
        <Route path="/jobs/:id" element={<PublicJobsPage />} />
      </Route>

      {/* Auth Pages */}
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Candidate Routes */}
      <Route element={<ProtectedRoute allowedRoles={['CANDIDATE', 'ADMIN']} />}>
        <Route path="/candidate" element={<CandidateLayout />}>
          <Route index element={<Navigate to="/candidate/dashboard" replace />} />
          <Route path="dashboard" element={<CandidateDashboard />} />
          <Route path="jobs" element={<PublicJobsPage />} />
          <Route path="jobs/:id" element={<PublicJobsPage />} />
          <Route path="applications" element={<CandidateDashboard />} />
          <Route path="resume" element={<CandidateDashboard />} />
          <Route path="interviews" element={<CandidateDashboard />} />
          <Route path="availability" element={<CandidateDashboard />} />
          <Route path="profile" element={<CandidateDashboard />} />
        </Route>
      </Route>

      {/* Recruiter Routes */}
      <Route element={<ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']} />}>
        <Route path="/recruiter" element={<RecruiterLayout />}>
          <Route index element={<Navigate to="/recruiter/dashboard" replace />} />
          <Route path="dashboard" element={<RecruiterDashboard />} />
          <Route path="companies" element={<RecruiterDashboard />} />
          <Route path="departments" element={<RecruiterDashboard />} />
          <Route path="jobs" element={<RecruiterDashboard />} />
          <Route path="jobs/new" element={<RecruiterDashboard />} />
          <Route path="applications" element={<RecruiterDashboard />} />
          <Route path="ai-evaluations" element={<RecruiterDashboard />} />
          <Route path="scheduling" element={<RecruiterDashboard />} />
          <Route path="interviews" element={<RecruiterDashboard />} />
          <Route path="ai-workflows" element={<RecruiterDashboard />} />
          <Route path="analytics" element={<RecruiterDashboard />} />
        </Route>
      </Route>

      {/* Interviewer Routes */}
      <Route element={<ProtectedRoute allowedRoles={['INTERVIEWER', 'ADMIN']} />}>
        <Route path="/interviewer" element={<InterviewerLayout />}>
          <Route index element={<Navigate to="/interviewer/dashboard" replace />} />
          <Route path="dashboard" element={<InterviewerDashboard />} />
          <Route path="interviews" element={<InterviewerDashboard />} />
          <Route path="availability" element={<InterviewerDashboard />} />
          <Route path="history" element={<InterviewerDashboard />} />
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
  )
}

export default App
