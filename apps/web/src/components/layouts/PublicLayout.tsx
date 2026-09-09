import { Outlet, Link } from 'react-router-dom'
import { useUser, UserButton } from '@clerk/clerk-react'
import { Briefcase, ArrowRight, ShieldCheck, Cpu } from 'lucide-react'

export function PublicLayout() {
  const { isSignedIn } = useUser()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-3.5">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/main-logo.png"
              alt="HireWise Logo"
              className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">
              Hire<span className="text-blue-600">Wise</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link to="/jobs" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
              Browse Jobs
            </Link>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">
              How It Works
            </a>
            <a href="#ai-agents" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-slate-400" />
              AI Agents
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <div className="flex items-center gap-4">
                <Link
                  to="/auth-redirect"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition shadow-sm flex items-center gap-1.5"
                >
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </Link>
                <UserButton afterSignOutUrl="/" />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/sign-in"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition px-3 py-2"
                >
                  Sign In
                </Link>
                <Link
                  to="/sign-up"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition shadow-sm flex items-center gap-1.5"
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

      {/* Professional Multi-Column Footer */}
      <footer className="border-t border-slate-200 bg-white text-sm text-slate-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand column */}
            <div className="md:col-span-1 space-y-4">
              <Link to="/" className="flex items-center gap-2.5">
                <img
                  src="/main-logo.png"
                  alt="HireWise"
                  className="h-8 w-auto object-contain"
                />
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  Hire<span className="text-blue-600">Wise</span>
                </span>
              </Link>
              <p className="text-xs text-slate-500 leading-relaxed">
                Autonomous multi-agent technical recruitment platform with deterministic evaluation, structured rubric validation, and complete hiring manager control.
              </p>
            </div>

            {/* Platform links */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">Platform</h4>
              <ul className="space-y-2 text-xs">
                <li><Link to="/jobs" className="hover:text-blue-600 transition">Browse Opportunities</Link></li>
                <li><a href="#how-it-works" className="hover:text-blue-600 transition">How It Works</a></li>
                <li><a href="#ai-agents" className="hover:text-blue-600 transition">Autonomous AI Agents</a></li>
              </ul>
            </div>

            {/* Role Solutions */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">Solutions</h4>
              <ul className="space-y-2 text-xs">
                <li><Link to="/sign-up" className="hover:text-blue-600 transition">For Engineering Leaders</Link></li>
                <li><Link to="/sign-up" className="hover:text-blue-600 transition">For Talent Acquisition</Link></li>
                <li><Link to="/sign-up" className="hover:text-blue-600 transition">For Technical Interviewers</Link></li>
                <li><Link to="/sign-up" className="hover:text-blue-600 transition">Enterprise Compliance</Link></li>
              </ul>
            </div>

            {/* Security & Architecture */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">Architecture & Trust</h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-1.5 text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Deterministic Rubric Validation
                </li>
                <li className="flex items-center gap-1.5 text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Pydantic Strict Schema Enforcement
                </li>
                <li className="flex items-center gap-1.5 text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Human-in-the-Loop Authorization
                </li>
                <li className="flex items-center gap-1.5 text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Conflict-Free Calendar Synchronization
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} HireWise Technologies. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms of Service</span>
              <span>•</span>
              <span>Security</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
