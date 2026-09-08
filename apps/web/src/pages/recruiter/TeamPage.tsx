import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { OrganizationProfile } from '@clerk/clerk-react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getTeamMembers } from '@/lib/api/users-api'
import {
  Users,
  UserCheck,
  Mail,
  CalendarCheck,
  FileCheck2,
  Building2,
  Shield,
  Search,
  UserPlus
} from 'lucide-react'

export function TeamPage() {
  const [activeTab, setActiveTab] = useState<'roster' | 'clerk-org'>('roster')
  const [searchTerm, setSearchTerm] = useState('')
  const { profile } = useCurrentUser()

  const { data: team = [], isLoading } = useQuery({
    queryKey: ['team-members', profile?.companyId],
    queryFn: () => getTeamMembers(profile?.companyId),
    enabled: true
  })

  const totalMembers = team.length
  const activeInterviewers = team.filter((m) => m.role === 'INTERVIEWER').length
  const totalAssignedInterviews = team.reduce((acc, m) => acc + m.assignedInterviewsCount, 0)
  const totalFeedbacksSubmitted = team.reduce((acc, m) => acc + m.completedFeedbacksCount, 0)

  const filteredTeam = team.filter((m) => {
    const term = searchTerm.toLowerCase()
    return (
      m.fullName.toLowerCase().includes(term) ||
      m.email.toLowerCase().includes(term) ||
      m.role.toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
            <Users className="h-4 w-4 text-blue-600" />
            <span>Organization Staffing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Team & Technical Interviewers
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Manage your company's recruitment staff, invite technical interviewers, and inspect interview allocations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('clerk-org')}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <UserPlus className="h-4 w-4" />
            Invite Interviewer
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Total Staff</span>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalMembers}</div>
          <p className="text-[11px] text-slate-400">Active organization members</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Interviewers</span>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{activeInterviewers}</div>
          <p className="text-[11px] text-slate-400">Engineers conducting technical rounds</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Assigned Interviews</span>
            <CalendarCheck className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalAssignedInterviews}</div>
          <p className="text-[11px] text-slate-400">Scheduled candidate sessions</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Submitted Feedback</span>
            <FileCheck2 className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalFeedbacksSubmitted}</div>
          <p className="text-[11px] text-slate-400">Completed scoring rubrics</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'roster'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Staff Roster & Performance
        </button>

        <button
          onClick={() => setActiveTab('clerk-org')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
            activeTab === 'clerk-org'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="h-3.5 w-3.5 text-blue-600" />
          Clerk Organization & Direct Invites
        </button>
      </div>

      {/* Content */}
      {activeTab === 'roster' ? (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-xs"
            />
          </div>

          {isLoading ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 text-xs animate-pulse shadow-sm">
              Loading team directory...
            </div>
          ) : filteredTeam.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3 shadow-sm">
              <Users className="mx-auto h-8 w-8 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900">No Team Members Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Invite interviewers from your engineering team using Clerk's direct email invitations.
              </p>
              <button
                onClick={() => setActiveTab('clerk-org')}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition mt-2 shadow-sm"
              >
                <UserPlus className="h-4 w-4" />
                Invite First Interviewer
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider font-semibold text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Member</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-center">Assigned Sessions</th>
                    <th className="py-3.5 px-4 text-center">Feedbacks Filed</th>
                    <th className="py-3.5 px-4">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeam.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                            {member.firstName ? member.firstName[0] : member.email[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{member.fullName || 'Team Member'}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Mail className="h-3 w-3 text-slate-400" />
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {member.role === 'RECRUITER' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold">
                            <Shield className="h-3 w-3 text-blue-600" />
                            Recruiter (Org Admin)
                          </span>
                        ) : member.role === 'INTERVIEWER' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                            <UserCheck className="h-3 w-3 text-emerald-600" />
                            Technical Interviewer
                          </span>
                        ) : (
                          <span className="text-slate-600 font-medium">{member.role}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold uppercase">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {member.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                        {member.assignedInterviewsCount}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                        {member.completedFeedbacksCount}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="w-full max-w-4xl bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <OrganizationProfile
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'bg-white shadow-none border-none text-slate-900',
                  navbar: 'border-r border-slate-200 bg-slate-50 text-slate-900',
                  navbarButton: 'text-slate-600 hover:text-slate-900 text-xs font-medium',
                  navbarButtonActive: 'bg-blue-50 text-blue-700 font-bold',
                  headerTitle: 'text-slate-900 font-bold',
                  headerSubtitle: 'text-slate-500 text-xs',
                  profileSectionTitleText: 'text-slate-900 font-semibold',
                  formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition',
                  formFieldInput: 'bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:border-blue-600 focus:bg-white',
                  formFieldLabel: 'text-slate-700 text-xs font-medium',
                  badge: 'bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold'
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
