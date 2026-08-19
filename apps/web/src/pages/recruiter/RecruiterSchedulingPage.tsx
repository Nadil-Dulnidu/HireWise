import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { applicationsApi } from '@/lib/api/applications-api'
import { interviewsApi } from '@/lib/api/interviews-api'
import { availabilityApi } from '@/lib/api/availability-api'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getInterviewers } from '@/lib/api/users-api'
import {
  Calendar,
  Clock,
  Video,
  User,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Plus,
  UserPlus
} from 'lucide-react'
import type { ApiResponse, PagedResult } from '@/types/auth'
import {
  type CreateInterviewRequest,
  getDayLabel,
  formatTimeDisplay,
  normalizeDayOfWeek
} from '@/types/interviews'

export function RecruiterSchedulingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { profile } = useCurrentUser()

  const [selectedAppId, setSelectedAppId] = useState<string>('')
  const [selectedInterviewerId, setSelectedInterviewerId] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [startTime, setStartTime] = useState<string>('14:00')
  const [endTime, setEndTime] = useState<string>('15:00')
  const [meetingLink, setMeetingLink] = useState<string>('https://meet.google.com/hwr-tech-rnd')
  const [notes, setNotes] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Fetch eligible applications (INTERVIEW_APPROVED or all company applications)
  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ['approvedApplications'],
    queryFn: () => applicationsApi.getCompanyApplications({ pageSize: 50 })
  })

  // Fetch company interviewers
  const { data: interviewersData = [], isLoading: interviewersLoading } = useQuery({
    queryKey: ['companyInterviewers', profile?.companyId],
    queryFn: async () => {
      try {
        const interviewersList = await getInterviewers(profile?.companyId)
        if (interviewersList && interviewersList.length > 0) {
          return interviewersList
        }
      } catch (err) {
        console.warn('Direct interviewers fetch fallback to /users:', err)
      }

      const res = await apiClient.get<ApiResponse<PagedResult<any>>>('/users', {
        params: { role: 'INTERVIEWER', pageSize: 50 }
      })
      return res.data.data?.items || []
    }
  })

  // Fetch selected interviewer availability
  const { data: interviewerAvailability = [], isLoading: availabilityLoading } = useQuery({
    queryKey: ['interviewerAvailability', selectedInterviewerId],
    queryFn: () => availabilityApi.getInterviewerAvailability(selectedInterviewerId),
    enabled: !!selectedInterviewerId
  })

  // Check if selected time falls outside the interviewer's configured slots
  const isOutsideAvailability = (() => {
    if (!startDate || !startTime || !endTime || interviewerAvailability.length === 0) {
      return false
    }

    const chosenDate = new Date(`${startDate}T${startTime}:00Z`)
    const chosenDayOfWeek = chosenDate.getUTCDay()
    const reqStart = `${startTime}:00`
    const reqEnd = `${endTime}:00`

    const isMatch = interviewerAvailability.some((slot) => {
      if (slot.specificDate) {
        return slot.specificDate === startDate && slot.startTime <= reqStart && slot.endTime >= reqEnd
      }
      return normalizeDayOfWeek(slot.dayOfWeek) === chosenDayOfWeek && slot.startTime <= reqStart && slot.endTime >= reqEnd
    })

    return !isMatch
  })()

  const handleApplySlot = (slot: any) => {
    const sParts = (slot.startTime || '10:00').split(':')
    const eParts = (slot.endTime || '16:00').split(':')
    const sTime = `${sParts[0]}:${sParts[1]}`
    
    // Set 1-hour session by default within slot range
    const startH = parseInt(sParts[0], 10)
    const endH = parseInt(eParts[0], 10)
    let eTime = `${String(Math.min(startH + 1, endH)).padStart(2, '0')}:${sParts[1]}`
    if (sTime >= eTime) {
      eTime = `${eParts[0]}:${eParts[1]}`
    }

    setStartTime(sTime)
    setEndTime(eTime)

    if (slot.specificDate) {
      setStartDate(slot.specificDate)
    } else {
      const targetDay = normalizeDayOfWeek(slot.dayOfWeek)
      const now = new Date()
      let daysToAdd = (targetDay - now.getUTCDay() + 7) % 7
      if (daysToAdd === 0) daysToAdd = 7
      const nextDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysToAdd))
      setStartDate(nextDate.toISOString().split('T')[0])
    }
  }

  const createInterviewMutation = useMutation({
    mutationFn: (data: CreateInterviewRequest) => interviewsApi.createInterview(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiterInterviews'] })
      queryClient.invalidateQueries({ queryKey: ['companyApplications'] })
      navigate('/recruiter/interviews')
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error || err.response?.data?.message || 'Failed to schedule interview.')
    }
  })

  const applications = appsData?.items || []
  const interviewers = interviewersData || []

  // Filter applications that are in interview eligible state (not already scheduled/completed/rejected)
  const eligibleApps = applications.filter(
    (a) => a.status === 'INTERVIEW_APPROVED' || a.status === 'AI_RECOMMENDED' || a.status === 'RECRUITER_REVIEW'
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAppId) {
      setErrorMsg('Please select an approved candidate application.')
      return
    }
    if (!selectedInterviewerId) {
      setErrorMsg('Please select an interviewer from your company.')
      return
    }
    if (!startDate) {
      setErrorMsg('Please select a date.')
      return
    }

    const startDateTime = new Date(`${startDate}T${startTime}:00Z`).toISOString()
    const endDateTime = new Date(`${startDate}T${endTime}:00Z`).toISOString()

    createInterviewMutation.mutate({
      applicationId: selectedAppId,
      interviewerId: selectedInterviewerId,
      scheduledStartTime: startDateTime,
      scheduledEndTime: endDateTime,
      meetingLink: meetingLink.trim(),
      notes: notes.trim()
    })
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Link */}
      <Link
        to="/recruiter/interviews"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Interviews
      </Link>

      {/* Header */}
      <div className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Calendar className="h-7 w-7 text-purple-400" /> Schedule Technical Interview
        </h1>
        <p className="text-sm text-slate-400">
          Match an approved candidate with an assigned technical evaluator, cross-check their availability, and dispatch calendar invites.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {errorMsg}
        </div>
      )}

      {/* 2-Column: Form & Live Availability Checker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-5">
            <h3 className="text-base font-bold text-white">Interview Configuration</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Application Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Candidate Application
                </label>
                {appsLoading ? (
                  <div className="p-3 text-xs text-slate-400 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-400" /> Loading applications...
                  </div>
                ) : (
                  <select
                    value={selectedAppId}
                    onChange={(e) => setSelectedAppId(e.target.value)}
                    className="w-full rounded-xl bg-slate-950/80 border border-slate-800 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                    required
                  >
                    <option value="">-- Select an Approved Application --</option>
                    {(eligibleApps.length > 0 ? eligibleApps : applications).map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.candidateName} — {app.jobTitle} ({app.status.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Interviewer Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Assigned Interviewer
                  </label>
                  <Link
                    to="/recruiter/team"
                    className="text-[11px] text-purple-400 hover:text-purple-300 inline-flex items-center gap-1"
                  >
                    <UserPlus className="h-3 w-3" /> Manage Staff
                  </Link>
                </div>
                {interviewersLoading ? (
                  <div className="p-3 text-xs text-slate-400 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-400" /> Loading interviewers...
                  </div>
                ) : interviewers.length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                    <span>No active interviewers assigned to your organization yet.</span>
                    <Link
                      to="/recruiter/team"
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 text-[11px] font-medium transition"
                    >
                      Invite Interviewer
                    </Link>
                  </div>
                ) : (
                  <select
                    value={selectedInterviewerId}
                    onChange={(e) => setSelectedInterviewerId(e.target.value)}
                    className="w-full rounded-xl bg-slate-950/80 border border-slate-800 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                    required
                  >
                    <option value="">-- Select Company Interviewer ({interviewers.length} available) --</option>
                    {interviewers.map((user: any) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName || `${user.firstName} ${user.lastName}`} ({user.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Date & Time */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Interview Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl bg-slate-950/80 border border-slate-800 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Start Time (UTC)</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-xl bg-slate-950/80 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">End Time (UTC)</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-xl bg-slate-950/80 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              {/* Outside Availability Live Warning */}
              {isOutsideAvailability && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-semibold block">Outside Interviewer's Published Hours</span>
                    <span className="text-[11px] text-amber-300/80">
                      The selected time window ({startTime} – {endTime} UTC on {startDate}) does not match this interviewer's availability schedule. Click one of the slots on the right to apply.
                    </span>
                  </div>
                </div>
              )}

              {/* Meeting Link */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Video Conference URL
                </label>
                <div className="relative">
                  <Video className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="url"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://meet.google.com/xyz-abcd-efg"
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Preparation Instructions & Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Focus on backend system design and concurrency handling..."
                  className="w-full rounded-xl bg-slate-950/80 border border-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={createInterviewMutation.isPending || isOutsideAvailability}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-semibold text-white transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-purple-950 mt-2"
              >
                {createInterviewMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Confirm & Dispatch Schedule
              </button>
            </form>
          </div>
        </div>

        {/* Live Availability Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-400" /> Interviewer Availability Slots
            </h3>

            {!selectedInterviewerId ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                <User className="h-6 w-6 text-slate-500 mx-auto mb-2" />
                <p>Select an interviewer on the left to view their weekly recurring slots.</p>
              </div>
            ) : availabilityLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-5 w-5 text-purple-400 animate-spin mx-auto" />
              </div>
            ) : interviewerAvailability.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 space-y-1 bg-slate-950/40 rounded-xl border border-slate-800">
                <AlertCircle className="h-5 w-5 text-amber-400 mx-auto mb-1" />
                <p className="font-semibold text-slate-300">No custom slots published</p>
                <p className="text-[11px] text-slate-500">
                  This interviewer has not yet configured specific availability slots. Standard business hours may apply.
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <p className="text-[11px] text-slate-400 mb-2">
                  Click <strong>Apply</strong> on any slot below to automatically set the interview date & time.
                </p>
                {interviewerAvailability.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between hover:border-purple-500/40 transition group"
                  >
                    <div>
                      <div className="font-semibold text-purple-300">
                        {getDayLabel(slot.dayOfWeek, false)}
                      </div>
                      <div className="text-white font-medium text-[11px] mt-0.5">
                        {formatTimeDisplay(slot.startTime)} – {formatTimeDisplay(slot.endTime)}
                        <span className="text-[10px] text-slate-500 ml-1.5">({slot.timezone})</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplySlot(slot)}
                      className="px-2.5 py-1 rounded-lg bg-purple-600/20 group-hover:bg-purple-600 text-purple-300 group-hover:text-white border border-purple-500/30 text-[11px] font-medium transition"
                    >
                      Apply
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
