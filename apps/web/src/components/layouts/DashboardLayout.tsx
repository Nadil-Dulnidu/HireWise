import React, { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { NotificationDropdown } from '@/components/common/NotificationDropdown'
import { notificationsApi } from '@/lib/api/notifications-api'
import { useQuery } from '@tanstack/react-query'
import {
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

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount()
  })

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } transition-all duration-300 ease-in-out bg-white flex flex-col border-r border-slate-200 z-40 shadow-xs`}
      >
        {/* Brand Header */}
        <div
          className={`flex h-16 items-center border-b border-slate-200 transition-all ${
            sidebarOpen ? 'justify-between px-4' : 'justify-center px-2'
          }`}
        >
          {sidebarOpen ? (
            <>
              <Link to="/" className="flex items-center gap-2.5 overflow-hidden group">
                <img
                  src="/main-logo.png"
                  alt="HireWise Logo"
                  className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-base font-bold tracking-tight text-slate-900 leading-tight">
                    Hire<span className="text-blue-600">Wise</span>
                  </span>
                  <span className={`text-[10px] font-semibold tracking-wider uppercase truncate ${roleColor}`}>
                    {roleTitle}
                  </span>
                </div>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                title="Collapse sidebar"
              >
                <Menu className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="group flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all p-1"
              title="Expand sidebar"
            >
              <img
                src="/main-logo.png"
                alt="HireWise"
                className="h-6 w-6 object-contain"
              />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className={`flex-1 overflow-y-auto space-y-1 ${sidebarOpen ? 'p-3' : 'py-3 px-2'}`}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center rounded-xl text-sm font-medium transition-all ${
                  sidebarOpen
                    ? 'gap-3 px-3 py-2.5 w-full'
                    : 'justify-center h-10 w-10 mx-auto'
                } ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/80 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {sidebarOpen && (
                  <span className="truncate flex-1">{item.label}</span>
                )}
                {sidebarOpen && item.badge && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Card at bottom of sidebar */}
        <div className={`border-t border-slate-200 ${sidebarOpen ? 'p-3' : 'py-3 px-2'}`}>
          <div
            className={`flex items-center rounded-xl bg-slate-50 border border-slate-200/80 ${
              sidebarOpen ? 'gap-3 p-2.5' : 'justify-center h-10 w-10 mx-auto p-0'
            }`}
          >
            <UserButton afterSignOutUrl="/" />
            {sidebarOpen && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate text-xs font-semibold text-slate-900">
                  {profile?.fullName || 'User'}
                </span>
                <span className="truncate text-[10px] text-slate-500">
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
        <header className="flex h-16 items-center border-b border-slate-200 px-6 md:px-8 bg-white z-30 shadow-xs">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-sm text-slate-500">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition -ml-2 mr-1"
                  title="Expand sidebar"
                >
                  <Menu className="h-4 w-4" />
                </button>
              )}
              <span className="font-medium text-slate-700">{roleTitle}</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
              <span className="text-slate-900 font-semibold capitalize">
                {location.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Overview'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Notification Bell Button & Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white shadow-xs">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                <NotificationDropdown
                  isOpen={notificationsOpen}
                  onClose={() => setNotificationsOpen(false)}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Workspace Canvas */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
