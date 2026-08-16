import { DashboardLayout, type NavItem } from './DashboardLayout'
import {
  LayoutDashboard,
  Building2,
  FolderTree,
  Briefcase,
  Users,
  FileSpreadsheet,
  Bot,
  Calendar,
  BarChart3,
  Activity
} from 'lucide-react'

const recruiterNav: NavItem[] = [
  { label: 'Dashboard', href: '/recruiter/dashboard', icon: LayoutDashboard },
  { label: 'Company Profile', href: '/recruiter/companies', icon: Building2 },
  { label: 'Departments', href: '/recruiter/departments', icon: FolderTree },
  { label: 'Job Postings', href: '/recruiter/jobs', icon: Briefcase },
  { label: 'Applications', href: '/recruiter/applications', icon: FileSpreadsheet },
  { label: 'AI Evaluations', href: '/recruiter/ai-evaluations', icon: Bot },
  { label: 'Interview Scheduling', href: '/recruiter/scheduling', icon: Calendar },
  { label: 'Interviews', href: '/recruiter/interviews', icon: Users },
  { label: 'AI Workflow Monitor', href: '/recruiter/ai-workflows', icon: Activity },
  { label: 'Pipeline Analytics', href: '/recruiter/analytics', icon: BarChart3 },
]

export function RecruiterLayout() {
  return (
    <DashboardLayout
      navItems={recruiterNav}
      roleTitle="Recruiter Workspace"
      roleColor="text-purple-400"
    />
  )
}
