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
  Sparkles,
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
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
            <Users className="h-4 w-4" />
            <span>Organization Staffing</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Team & Technical Interviewers</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your company's recruitment staff, invite technical interviewers, and inspect interview allocations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('clerk-org')}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-medium text-white shadow-lg shadow-purple-500/20 hover:bg-purple-500 transition"
          >
            <UserPlus className="h-4 w-4" />
            Invite Interviewer
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Staff</span>
            <Users className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalMembers}</div>
          <p className="text-[11px] text-slate-500">Active organization members</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Interviewers</span>
            <UserCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{activeInterviewers}</div>
          <p className="text-[11px] text-slate-500">Engineers conducting technical rounds</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Assigned Interviews</span>
            <CalendarCheck className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalAssignedInterviews}</div>
          <p className="text-[11px] text-slate-500">Scheduled candidate sessions</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Submitted Feedback</span>
            <FileCheck2 className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalFeedbacksSubmitted}</div>
          <p className="text-[11px] text-slate-500">Completed scoring rubrics</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition ${
            activeTab === 'roster'
              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          Staff Roster & Performance
        </button>

        <button
          onClick={() => setActiveTab('clerk-org')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2 ${
            activeTab === 'clerk-org'
              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          Clerk Organization & Direct Invites
        </button>
      </div>

      {/* Content */}
      {activeTab === 'roster' ? (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search staff by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {isLoading ? (
            <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 text-slate-400 text-xs animate-pulse">
              Loading team directory...
            </div>
          ) : filteredTeam.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 space-y-3">
              <Users className="mx-auto h-8 w-8 text-slate-600" />
              <h3 className="text-sm font-semibold text-white">No Team Members Found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Invite interviewers from your engineering team using Clerk's direct email invitations.
              </p>
              <button
                onClick={() => setActiveTab('clerk-org')}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-medium text-white hover:bg-purple-500 transition mt-2"
              >
                <UserPlus className="h-4 w-4" />
                Invite First Interviewer
              </button>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Member</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-center">Assigned Sessions</th>
                    <th className="py-3.5 px-4 text-center">Feedbacks Filed</th>
                    <th className="py-3.5 px-4">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTeam.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                            {member.firstName ? member.firstName[0] : member.email[0]}
                          </div>
                          <div>
                            <div className="font-medium text-white">{member.fullName || 'Team Member'}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {member.role === 'RECRUITER' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[11px] font-medium">
                            <Shield className="h-3 w-3 text-purple-400" />
                            Recruiter (Org Admin)
                          </span>
                        ) : member.role === 'INTERVIEWER' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium">
                            <UserCheck className="h-3 w-3 text-emerald-400" />
                            Technical Interviewer
                          </span>
                        ) : (
                          <span className="text-slate-400">{member.role}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold uppercase">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          {member.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-semibold text-white">
                        {member.assignedInterviewsCount}
                      </td>

                      <td className="py-3.5 px-4 text-center font-semibold text-white">
                        {member.completedFeedbacksCount}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
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
          <div className="w-full max-w-4xl glass-panel p-6 rounded-2xl border border-slate-800 shadow-2xl">
            <OrganizationProfile
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'bg-transparent shadow-none border-none text-white',
                  navbar: 'border-r border-slate-800 bg-slate-950/40 text-white',
                  navbarButton: 'text-slate-300 hover:text-white text-xs',
                  navbarButtonActive: 'bg-purple-600/20 text-purple-400 font-semibold',
                  headerTitle: 'text-white font-bold',
                  headerSubtitle: 'text-slate-400 text-xs',
                  profileSectionTitleText: 'text-white font-semibold',
                  formButtonPrimary: 'bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl',
                  formFieldInput: 'bg-slate-950 border-slate-800 text-white rounded-xl focus:border-purple-500',
                  formFieldLabel: 'text-slate-300 text-xs',
                  badge: 'bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs'
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
