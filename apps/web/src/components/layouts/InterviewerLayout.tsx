import { DashboardLayout, type NavItem } from './DashboardLayout'
import {
  LayoutDashboard,
  CalendarCheck,
  Clock,
  History
} from 'lucide-react'

const interviewerNav: NavItem[] = [
  { label: 'Dashboard', href: '/interviewer/dashboard', icon: LayoutDashboard },
  { label: 'Assigned Interviews', href: '/interviewer/interviews', icon: CalendarCheck },
  { label: 'My Availability', href: '/interviewer/availability', icon: Clock },
  { label: 'Evaluation History', href: '/interviewer/history', icon: History },
]

export function InterviewerLayout() {
  return (
    <DashboardLayout
      navItems={interviewerNav}
      roleTitle="Interviewer Desk"
      roleColor="text-emerald-400"
    />
  )
}
