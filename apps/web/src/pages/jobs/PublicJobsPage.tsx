import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  Search,
  MapPin,
  DollarSign,
  Building,
  Clock,
  Filter,
  ArrowRight
} from 'lucide-react'

export function PublicJobsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('ALL')

  const sampleJobs = [
    {
      id: '1',
      title: 'Senior Full Stack Engineer (React + .NET)',
      company: 'CloudScale Technologies',
      location: 'San Francisco, CA / Remote',
      type: 'FULL_TIME',
      level: 'SENIOR',
      salary: '$140k - $180k',
      posted: '2 days ago',
      tags: ['React', 'TypeScript', 'C#', '.NET 8', 'PostgreSQL']
    },
    {
      id: '2',
      title: 'Staff Machine Learning Engineer',
      company: 'NeuralPulse AI',
      location: 'New York, NY / Hybrid',
      type: 'FULL_TIME',
      level: 'LEAD',
      salary: '$180k - $230k',
      posted: '3 days ago',
      tags: ['Python', 'LangGraph', 'PyTorch', 'FastAPI', 'GCP Vertex']
    },
    {
      id: '3',
      title: 'Distributed Systems Backend Architect',
      company: 'FinTech Grid',
      location: 'Austin, TX / Remote',
      type: 'FULL_TIME',
      level: 'SENIOR',
      salary: '$160k - $210k',
      posted: 'Just now',
      tags: ['Go', 'C#', 'Microservices', 'Kafka', 'PostgreSQL']
    },
    {
      id: '4',
      title: 'Frontend UI/UX Engineer',
      company: 'Veloce Labs',
      location: 'Remote',
      type: 'CONTRACT',
      level: 'MID',
      salary: '$100k - $130k',
      posted: '5 days ago',
      tags: ['React 19', 'TailwindCSS', 'shadcn/ui', 'TypeScript']
    }
  ]

  const filteredJobs = sampleJobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesType = selectedType === 'ALL' || job.type === selectedType
    return matchesSearch && matchesType
  })

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
          <Briefcase className="h-3.5 w-3.5" /> Technical Careers
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Explore Technical Openings
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Discover verified engineering roles evaluated with intelligent AI matching and direct recruiter scheduling.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full flex items-center pl-3">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by title, company, or technology tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Contract Types</option>
            <option value="FULL_TIME">Full-time</option>
            <option value="CONTRACT">Contract</option>
            <option value="PART_TIME">Part-time</option>
            <option value="INTERNSHIP">Internship</option>
          </select>
        </div>
      </div>

      {/* Job Cards */}
      <div className="space-y-4">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-white hover:text-blue-400 transition">
                    {job.title}
                  </h3>
                  <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20">
                    {job.level}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-slate-300 font-medium">
                    <Building className="h-3.5 w-3.5 text-slate-500" /> {job.company}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" /> {job.location}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <DollarSign className="h-3.5 w-3.5" /> {job.salary}
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock className="h-3.5 w-3.5" /> {job.posted}
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {job.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg bg-slate-900/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 border border-slate-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0">
              <Link
                to={`/candidate/jobs/${job.id}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs font-semibold text-white transition shadow-md shadow-blue-600/20"
              >
                Apply with AI Match <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
