import { Outlet, Link } from 'react-router-dom'
import { useUser, UserButton } from '@clerk/clerk-react'
import { Sparkles, Briefcase, ArrowRight } from 'lucide-react'

export function PublicLayout() {
  const { isSignedIn } = useUser()

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Hire<span className="text-blue-500">Wise</span>
              </span>
              <span className="block text-[10px] text-slate-400 font-medium tracking-wider uppercase">AI Recruitment</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <Link to="/jobs" className="hover:text-white transition-colors flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-400" /> Browse Jobs
            </Link>
            <a href="#features" className="hover:text-white transition-colors">Platform Features</a>
            <a href="#ai-agents" className="hover:text-white transition-colors">AI Architecture</a>
          </nav>

          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <div className="flex items-center gap-4">
                <Link
                  to="/candidate/dashboard"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition shadow-lg shadow-blue-600/25 flex items-center gap-1.5"
                >
                  Dashboard <ArrowRight className="h-4 w-4" />
                </Link>
                <UserButton afterSignOutUrl="/" />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/sign-in"
                  className="text-sm font-medium text-slate-300 hover:text-white transition px-3 py-2"
                >
                  Sign In
                </Link>
                <Link
                  to="/sign-up"
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition shadow-md shadow-blue-500/20"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-8 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} HireWise AI Platform. University Final Project.</p>
          <div className="flex items-center gap-6 text-slate-400">
            <span>React + Vite</span>
            <span>•</span>
            <span>ASP.NET Core 8</span>
            <span>•</span>
            <span>FastAPI + LangGraph</span>
            <span>•</span>
            <span>PostgreSQL</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
