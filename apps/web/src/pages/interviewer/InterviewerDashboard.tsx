import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Link } from 'react-router-dom'
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  FileQuestion
} from 'lucide-react'

export function InterviewerDashboard() {
  const { profile } = useCurrentUser()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Interviewer Desk
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Welcome, <span className="text-white font-medium">{profile?.fullName || 'Interviewer'}</span> • Assigned Company: {profile?.companyName || 'HireWise Global'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Upcoming Interviews</p>
            <h3 className="text-2xl font-bold text-white mt-1">2</h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CalendarCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Pending Feedback</p>
            <h3 className="text-2xl font-bold text-amber-400 mt-1">1</h3>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Completed Reviews</p>
            <h3 className="text-2xl font-bold text-blue-400 mt-1">14</h3>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Assigned Interviews List */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-emerald-400" /> Upcoming Scheduled Technical Rounds
          </h3>
        </div>

        <div className="space-y-3">
          {[
            {
              candidate: 'Sarah Jenkins',
              role: 'Senior Frontend Architect',
              time: 'Today, 3:00 PM - 4:00 PM',
              meet: 'https://meet.google.com/xyz-abcd-efg',
              questionsReady: true
            },
            {
              candidate: 'Michael Chang',
              role: 'Distributed Systems Engineer',
              time: 'Tomorrow, 10:00 AM - 11:00 AM',
              meet: 'https://meet.google.com/uvw-pqrs-tuv',
              questionsReady: true
            }
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white">{item.candidate}</span>
                  <span className="text-xs text-slate-400">({item.role})</span>
                </div>
                <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> {item.time}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={item.meet}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition shadow-sm"
                >
                  Join Google Meet
                </a>
                <Link
                  to="/interviewer/interviews"
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition flex items-center gap-1.5"
                >
                  <FileQuestion className="h-3.5 w-3.5 text-purple-400" /> AI Questions
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
