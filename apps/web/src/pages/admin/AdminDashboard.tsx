import {
  Users,
  Building2,
  Activity,
  UserCheck,
  CheckCircle,
  XCircle
} from 'lucide-react'

export function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Platform Administration
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Root Access • Manage company tenants, approve recruiter roles, and audit security events.
        </p>
      </div>

      {/* System KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending Role Approvals', value: '3', icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Active Companies', value: '12', icon: Building2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Total Platform Users', value: '148', icon: UserCheck, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'System Health', value: '99.9%', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map((kpi, i) => (
          <div key={i} className="glass-card p-5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">{kpi.label}</p>
              <h3 className="text-2xl font-bold text-white mt-1">{kpi.value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.color}`}>
              <kpi.icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      {/* User Approvals Queue */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-400" /> Pending Recruiter & Interviewer Access Requests
          </h3>
          <span className="text-xs text-amber-400 font-medium bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            3 Pending Verification
          </span>
        </div>

        <div className="space-y-3">
          {[
            { name: 'Jordan Vance', email: 'jordan@cloudscale.io', requestedRole: 'RECRUITER', company: 'CloudScale Inc', date: '2 hours ago' },
            { name: 'Samantha Wu', email: 'samantha.wu@neuralpulse.ai', requestedRole: 'INTERVIEWER', company: 'NeuralPulse AI', date: '5 hours ago' },
            { name: 'Marcus Bell', email: 'm.bell@fintechgrid.com', requestedRole: 'RECRUITER', company: 'FinTech Grid', date: 'Yesterday' }
          ].map((req, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white">{req.name}</span>
                  <span className="text-xs text-slate-400">({req.email})</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${req.requestedRole === 'RECRUITER'
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                    {req.requestedRole}
                  </span>
                </div>
                <p className="text-xs text-slate-400">Target Company: {req.company} • Requested {req.date}</p>
              </div>

              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition shadow-sm">
                  <CheckCircle className="h-3.5 w-3.5" /> Approve Role
                </button>
                <button className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-red-950 hover:text-red-400 px-3 py-1.5 text-xs font-medium text-slate-400 transition">
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
