import React, { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
  Sparkles,
  Bell,
  Menu,
  ChevronRight
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: string | number
}

interface DashboardLayoutProps {
  navItems: NavItem[]
  roleTitle: string
  roleColor: string
}

export function DashboardLayout({ navItems, roleTitle, roleColor }: DashboardLayoutProps) {
  const location = useLocation()
  const { profile } = useCurrentUser()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0b0f19] text-slate-100">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } transition-all duration-300 ease-in-out glass-panel flex flex-col border-r border-slate-800/80 z-40`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/60">
          <Link to="/" className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-white leading-tight">
                  Hire<span className="text-blue-500">Wise</span>
                </span>
                <span className={`text-[10px] font-semibold tracking-wider uppercase ${roleColor}`}>
                  {roleTitle}
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                {sidebarOpen && (
                  <span className="truncate flex-1">{item.label}</span>
                )}
                {sidebarOpen && item.badge && (
                  <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Card at bottom of sidebar */}
        <div className="p-3 border-t border-slate-800/60">
          <div className="flex items-center gap-3 rounded-xl bg-slate-900/60 p-2 border border-slate-800/60">
            <UserButton afterSignOutUrl="/" />
            {sidebarOpen && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate text-xs font-semibold text-white">
                  {profile?.fullName || 'User'}
                </span>
                <span className="truncate text-[10px] text-slate-400">
                  {profile?.email}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-800/80 px-6 glass-panel z-30">
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span className="font-medium text-slate-200">{roleTitle}</span>
            <ChevronRight className="h-4 w-4 text-slate-600" />
            <span className="text-slate-400 capitalize">
              {location.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Overview'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Real-time Status Badge */}
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              API & AI Live
            </div>

            {/* Notification Bell Button */}
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500"></span>
            </button>
          </div>
        </header>

        {/* Workspace Canvas */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#0b0f19]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
