import { CreateOrganization } from '@clerk/clerk-react'
import { Building2, Sparkles, Users, CheckCircle2 } from 'lucide-react'

export function OnboardingPage() {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Information & Value Props */}
        <div className="lg:col-span-5 space-y-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-500/20">
            <Building2 className="h-6 w-6" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              Recruiter Workspace Setup
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Create your Company Workspace</h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Name your organization to create a dedicated multi-tenant hiring portal. You'll be able to publish jobs, configure autonomous AI evaluation workflows, and invite your engineering team.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-emerald-500/10 p-1 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Instant Company Portal</h4>
                <p className="text-[11px] text-slate-400">No waiting for admin approvals — get hiring immediately.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-purple-500/10 p-1 text-purple-400">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Direct Interviewer Invites</h4>
                <p className="text-[11px] text-slate-400">Invite engineers & hiring managers directly to your team.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-blue-500/10 p-1 text-blue-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Autonomous AI Screening</h4>
                <p className="text-[11px] text-slate-400">Automated resume parsing, rubrics, and question generation.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Clerk CreateOrganization Component */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-md">
            <CreateOrganization
              routing="path"
              path="/recruiter/onboarding"
              afterCreateOrganizationUrl="/recruiter/dashboard"
              appearance={{
                elements: {
                  card: 'glass-panel border border-slate-800 shadow-2xl rounded-2xl bg-slate-900/90 text-white',
                  headerTitle: 'text-white font-bold text-xl',
                  headerSubtitle: 'text-slate-400 text-xs',
                  formButtonPrimary: 'bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition',
                  formFieldInput: 'bg-slate-950 border-slate-800 text-white rounded-xl focus:border-purple-500',
                  formFieldLabel: 'text-slate-300 text-xs font-medium',
                  footerActionLink: 'text-purple-400 hover:text-purple-300 font-medium text-xs'
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
