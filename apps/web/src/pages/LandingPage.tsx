import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  Search,
  ArrowRight,
  ShieldCheck,
  Bot,
  CalendarCheck2,
  FileCheck2,
  Cpu,
  Layers,
  ChevronRight
} from 'lucide-react'

export function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-16 md:pt-24 px-6 overflow-hidden">
        {/* Glow effect background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[250px] bg-purple-600/15 blur-[100px] rounded-full pointer-events-none -z-10"></div>

        <div className="mx-auto max-w-5xl text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-400 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" /> Next-Gen AI Recruitment Lifecycle Engine
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            Intelligent Tech Hiring with{' '}
            <span className="gradient-text">Human-in-the-Loop</span> AI.
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-400">
            From deterministic resume-job matching and Pydantic-verified scoring to personalized interview question generation and automated calendar scheduling.
          </p>

          {/* Search bar */}
          <div className="mx-auto max-w-2xl">
            <div className="glass-panel p-2 rounded-2xl flex flex-col sm:flex-row items-center gap-2 shadow-2xl border border-slate-700/60">
              <div className="relative flex-1 w-full flex items-center pl-3">
                <Search className="h-5 w-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search technical jobs (e.g. Senior Backend, AI Engineer)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
              <Link
                to={`/jobs${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`}
                className="w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 shrink-0"
              >
                Search Jobs <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Metrics ticker */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 border-t border-slate-800/80">
            <div className="p-4 rounded-xl glass-card">
              <div className="text-2xl sm:text-3xl font-bold text-white">6</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Autonomous AI Agents</div>
            </div>
            <div className="p-4 rounded-xl glass-card">
              <div className="text-2xl sm:text-3xl font-bold text-blue-400">100%</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Deterministic Validation</div>
            </div>
            <div className="p-4 rounded-xl glass-card">
              <div className="text-2xl sm:text-3xl font-bold text-purple-400">Zero</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Double-Bookings</div>
            </div>
            <div className="p-4 rounded-xl glass-card">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-400">Human</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Approval Enforced</div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Agents Architecture Showcase */}
      <section id="ai-agents" className="mx-auto max-w-7xl px-6">
        <div className="text-center space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400">
            <Cpu className="h-3.5 w-3.5" /> LangGraph Orchestration
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Six Specialized Agents Working in Harmony
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm">
            State-persisted, schema-validated agents ensuring high quality recommendations without hallucinated decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: FileCheck2,
              color: 'text-blue-400',
              bg: 'bg-blue-500/10',
              title: '1. Job Analysis Agent',
              desc: 'Extracts critical technical skills, experience requirements, soft skills, and competency frameworks from job specs.'
            },
            {
              icon: Bot,
              color: 'text-indigo-400',
              bg: 'bg-indigo-500/10',
              title: '2. Resume Analysis Agent',
              desc: 'Extracts skills, project portfolios, certifications, and career trajectory from candidate CVs with deterministic structuring.'
            },
            {
              icon: Layers,
              color: 'text-purple-400',
              bg: 'bg-purple-500/10',
              title: '3. Evaluation & Ranking Agent',
              desc: 'Calculates quantitative fit scores, highlights strengths, risks, and provides explainable hiring recommendations.'
            },
            {
              icon: ShieldCheck,
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/10',
              title: '4. Validation Agent',
              desc: 'Enforces strict business rules, schema constraints, and prevents unauthorized automatic state mutations.'
            },
            {
              icon: Sparkles,
              color: 'text-pink-400',
              bg: 'bg-pink-500/10',
              title: '5. Interview Question Generator',
              desc: 'Generates tailored technical, behavioral, and architecture questions based on candidate gaps and project claims.'
            },
            {
              icon: CalendarCheck2,
              color: 'text-amber-400',
              bg: 'bg-amber-500/10',
              title: '6. Scheduling Agent',
              desc: 'Calculates non-conflicting time slots across candidate/interviewer calendars and syncs with Google Calendar.'
            }
          ].map((agent, i) => (
            <div key={i} className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition space-y-4">
              <div className={`h-12 w-12 rounded-xl ${agent.bg} ${agent.color} flex items-center justify-center`}>
                <agent.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">{agent.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{agent.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Role Access Call to Action */}
      <section className="mx-auto max-w-5xl px-6">
        <div className="glass-panel p-8 md:p-12 rounded-3xl border border-slate-800 text-center space-y-6 relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <h2 className="text-2xl sm:text-4xl font-bold text-white">
            Ready to experience next-generation tech recruitment?
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            Sign up as a Candidate to explore open technical roles or register as a Recruiter / Interviewer to orchestrate your hiring pipeline.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/sign-up"
              className="rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition shadow-lg shadow-blue-600/30 flex items-center gap-2"
            >
              Get Started Now <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              to="/jobs"
              className="rounded-xl bg-slate-800 hover:bg-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 transition"
            >
              Browse Open Positions
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
