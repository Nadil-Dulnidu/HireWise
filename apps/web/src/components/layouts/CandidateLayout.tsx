import { DashboardLayout, type NavItem } from './DashboardLayout'
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  User,
  Calendar,
  Clock
} from 'lucide-react'

const candidateNav: NavItem[] = [
  { label: 'Dashboard', href: '/candidate/dashboard', icon: LayoutDashboard },
  { label: 'Explore Jobs', href: '/candidate/jobs', icon: Briefcase },
  { label: 'My Applications', href: '/candidate/applications', icon: FileText },
  { label: 'My Resume', href: '/candidate/resume', icon: FileText },
  { label: 'Interviews', href: '/candidate/interviews', icon: Calendar },
  { label: 'Availability', href: '/candidate/availability', icon: Clock },
  { label: 'Profile', href: '/candidate/profile', icon: User },
]

export function CandidateLayout() {
  return (
    <DashboardLayout
      navItems={candidateNav}
      roleTitle="Candidate Portal"
      roleColor="text-blue-600"
    />
  )
}
