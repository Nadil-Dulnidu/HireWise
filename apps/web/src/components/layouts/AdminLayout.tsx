import { DashboardLayout, type NavItem } from './DashboardLayout'
import {
  LayoutDashboard,
  Users,
  Building2,
  ShieldAlert,
  Sliders,
  BarChart2
} from 'lucide-react'

const adminNav: NavItem[] = [
  { label: 'System Overview', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'User & Approvals', href: '/admin/users', icon: Users },
  { label: 'Companies', href: '/admin/companies', icon: Building2 },
  { label: 'Audit Trail', href: '/admin/audit-logs', icon: ShieldAlert },
  { label: 'Platform Analytics', href: '/admin/analytics', icon: BarChart2 },
  { label: 'Settings', href: '/admin/settings', icon: Sliders },
]

export function AdminLayout() {
  return (
    <DashboardLayout
      navItems={adminNav}
      roleTitle="Platform Admin"
      roleColor="text-amber-600"
    />
  )
}
