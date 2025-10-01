"use client"

import AdminSystemMonitor from '@/components/admin-system-monitor'
import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import AppHeader from "@/components/app-header"
// Dynamic import for charts to reduce initial bundle size
import dynamic from 'next/dynamic'

// Lazy load the entire charts section
const ChartsSection = dynamic(() => import('@/components/admin-charts'), { 
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
})
import { deduplicateRequest } from '@/lib/request-deduplication'
import { ResponsiveContainer, AreaChart, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area, Bar } from 'recharts'

interface DashboardStats {
  users: {
    total: number
    verified: number
    newThisWeek: number
    newThisMonth: number
  }
  projects: {
    total: number
    active: number
    newThisWeek: number
    newThisMonth: number
  }
  tasks: {
    total: number
    completed: number
    claimed: number
    available: number
  }
  activity: {
    recentActivity: Array<{
      id: string
      type: 'user_signup' | 'project_created' | 'task_completed'
      description: string
      timestamp: string
      user?: string
    }>
  }
}

interface User {
  id: string
  name: string
  email: string
  email_verified: boolean
  created_at: string
  project_count: number
}

interface Project {
  id: string
  name: string
  user_name: string
  user_email: string
  task_count: number
  created_at: string
  last_activity: string
}

export default function WebsiteOperationsDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'monitoring' | 'audit' | 'users' | 'projects' | 'system'>('overview')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [monitoring, setMonitoring] = useState<any>(null)
  const [monitoringLoading, setMonitoringLoading] = useState(false)
  const [auditLogs, setAuditLogs] = useState<any>(null)
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditStats, setAuditStats] = useState<any>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/auth/signin')
      return
    }

    if (status === "authenticated") {
      // Check if user is admin
      if (session?.user?.email !== 'contact@remisimmons.com') {
        router.push('/admin') // Redirect non-admin users to regular admin page
        return
      }
      loadDashboardData()
    }
  }, [status, router, session])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      setError('')
      const [statsRes, usersRes, projectsRes] = await Promise.all([
        deduplicateRequest('admin-stats', () => fetch('/api/admin/dashboard/stats').then(r => r.json()), 30000),
        deduplicateRequest('admin-users', () => fetch('/api/admin/dashboard/users').then(r => r.json()), 30000),
        deduplicateRequest('admin-projects', () => fetch('/api/admin/dashboard/projects').then(r => r.json()), 30000)
      ])

      // Data is already parsed from deduplicateRequest
      const [statsData, usersData, projectsData] = [statsRes, usersRes, projectsRes]

      setStats(statsData)
      setUsers(usersData.users || [])
      setProjects(projectsData.projects || [])
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error loading dashboard:', error)
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  // Export functions
  const handleExportUsers = async () => {
    try {
      setIsExporting(true)
      const response = await fetch('/api/admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export_users' })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      console.error('Export error:', error)
      setError('Failed to export users')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportProjects = async () => {
    try {
      setIsExporting(true)
      const response = await fetch('/api/admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export_projects' })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `projects_export_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      console.error('Export error:', error)
      setError('Failed to export projects')
    } finally {
      setIsExporting(false)
    }
  }

  // Monitoring data loading
  const loadMonitoringData = async () => {
    try {
      setMonitoringLoading(true)
      setError('')
      const response = await fetch('/api/admin/monitoring')

      if (response.ok) {
        const data = await response.json()
        setMonitoring(data)
        setNotification({ type: 'success', message: 'System monitoring data loaded successfully!' })
        setTimeout(() => setNotification(null), 3000)
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Monitoring error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load monitoring data'
      setError(`Monitoring Error: ${errorMessage}`)
      setNotification({ type: 'error', message: errorMessage })
      setTimeout(() => setNotification(null), 5000)
    } finally {
      setMonitoringLoading(false)
    }
  }

  const loadAuditData = async () => {
    try {
      setAuditLoading(true)
      setError('')

      // Load audit logs
      const logsResponse = await fetch('/api/admin/audit-logs?limit=100')
      if (logsResponse.ok) {
        const logsData = await logsResponse.json()
        setAuditLogs(logsData)
      }

      // Load audit stats
      const statsResponse = await fetch('/api/admin/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_stats', timeframe: '24h' })
      })
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setAuditStats(statsData)
      }

      setNotification({ type: 'success', message: 'Audit data loaded successfully!' })
      setTimeout(() => setNotification(null), 3000)
    } catch (error) {
      console.error('Audit error:', error)
      setError(`Failed to fetch audit data: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setNotification({ type: 'error', message: 'Failed to load audit data' })
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setAuditLoading(false)
    }
  }

  // Analytics data loading
  const loadAnalyticsData = async () => {
    try {
      setAnalyticsLoading(true)
      setError('')
      const response = await fetch('/api/admin/analytics')

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
        setNotification({ type: 'success', message: 'Analytics data loaded successfully!' })
        setTimeout(() => setNotification(null), 3000)
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Analytics error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load analytics data'
      setError(`Analytics Error: ${errorMessage}`)
      setNotification({ type: 'error', message: errorMessage })
      setTimeout(() => setNotification(null), 5000)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  // User management functions
  const handleUserAction = async (action: string, userId: string, userName: string) => {
    try {
      setActionLoading(`${action}-${userId}`)
      const response = await fetch('/api/admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, params: { userId } })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setNotification({ type: 'success', message: result.message })
        setTimeout(() => setNotification(null), 5000)
        // Refresh user data
        loadDashboardData()
      } else {
        throw new Error(result.error || 'Action failed')
      }
    } catch (error) {
      console.error('User action error:', error)
      setNotification({ type: 'error', message: `Failed to ${action.replace('_', ' ')} ${userName}` })
      setTimeout(() => setNotification(null), 5000)
    } finally {
      setActionLoading(null)
    }
  }

  // DISABLED: Auto-refresh causing performance issues
  // Manual refresh only - user can click refresh button
  // useEffect(() => {
  //   if (activeTab === 'overview' && stats) {
  //     const interval = setInterval(() => {
  //       if (!document.hidden) {
  //         loadDashboardData()
  //       }
  //     }, 300000)
  //     return () => clearInterval(interval)
  //   }
  // }, [activeTab, stats])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="card-beautiful p-12">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-semibold text-gray-900">Loading Operations Dashboard</h2>
                  <p className="text-lg text-gray-600">Please wait...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="card-beautiful p-12">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Error Loading Dashboard</h2>
                <p className="text-lg text-gray-600">{error}</p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={loadDashboardData}
                    className="btn-primary px-6 py-3"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => setError('')}
                    className="btn-secondary px-6 py-3"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // CSV generation function
  const generateAnalyticsCSV = (analytics: any) => {
    const headers = [
      'Metric Type',
      'Date',
      'Value',
      'Category',
      'Additional Info'
    ]

    const rows: any[] = []

    // Platform metrics
    rows.push(['Platform Metrics', new Date().toISOString().split('T')[0], analytics.platformMetrics.totalUsers, 'Total Users', ''])
    rows.push(['Platform Metrics', new Date().toISOString().split('T')[0], analytics.platformMetrics.totalProjects, 'Total Projects', ''])
    rows.push(['Platform Metrics', new Date().toISOString().split('T')[0], analytics.platformMetrics.totalTasks, 'Total Tasks', ''])
    rows.push(['Platform Metrics', new Date().toISOString().split('T')[0], analytics.platformMetrics.completionRate, 'Completion Rate', '%'])

    // User growth data
    analytics.userGrowth.forEach((day: any) => {
      rows.push(['User Growth', day.date, day.total, 'Daily New Users', ''])
      rows.push(['User Growth', day.date, day.verified, 'Verified Users', ''])
      rows.push(['User Growth', day.date, day.cumulative, 'Cumulative Users', ''])
    })

    // Project growth data
    analytics.projectGrowth.forEach((day: any) => {
      rows.push(['Project Growth', day.date, day.projects, 'Projects Created', ''])
      rows.push(['Project Growth', day.date, day.activeUsers, 'Active Users', ''])
    })

    // Task activity data
    analytics.taskActivity.forEach((day: any) => {
      rows.push(['Task Activity', day.date, day.created, 'Tasks Created', ''])
      rows.push(['Task Activity', day.date, day.available, 'Tasks Available', ''])
      rows.push(['Task Activity', day.date, day.in_progress, 'Tasks In Progress', ''])
      rows.push(['Task Activity', day.date, day.completed, 'Tasks Completed', ''])
    })

    // User engagement
    rows.push(['User Engagement', new Date().toISOString().split('T')[0], analytics.userEngagement.activeUsersLast7Days, 'Active Users (7 days)', ''])
    rows.push(['User Engagement', new Date().toISOString().split('T')[0], analytics.userEngagement.projectsPerUser.average, 'Avg Projects per User', ''])
    rows.push(['User Engagement', new Date().toISOString().split('T')[0], analytics.userEngagement.tasksPerUser.average, 'Avg Tasks per User', ''])

    // Convert to CSV
    const csvContent = [headers, ...rows]
      .map(row => row.map((field: any) => `"${field}"`).join(','))
      .join('\n')

    return csvContent
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Notification */}
          {notification && (
            <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
              <div className="flex items-center gap-2">
                {notification.type === 'success' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span className="font-medium">{notification.message}</span>
                <button
                  onClick={() => setNotification(null)}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h1 className="text-4xl font-bold text-gray-900">Website Operations Dashboard</h1>
            </div>
            <p className="text-xl text-gray-600">
              Complete overview and management of your SharedTask platform
            </p>
            <div className="flex items-center justify-center gap-4 mt-4">
              <span className="text-sm text-gray-500">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
              <button
                onClick={loadDashboardData}
                disabled={isLoading}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
              >
                {isLoading ? 'Refreshing...' : '🔄 Refresh'}
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="card-beautiful p-2">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'analytics', label: 'Analytics', icon: '📈' },
                { id: 'monitoring', label: 'System Monitoring', icon: '🔍' },
                { id: 'audit', label: 'Audit Logging', icon: '📝' },
                { id: 'users', label: 'User Management', icon: '👥' },
                { id: 'projects', label: 'Project Management', icon: '📋' },
                { id: 'system', label: 'System Health', icon: '⚙️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any)
                    if (tab.id === 'analytics' && !analytics) {
                      loadAnalyticsData()
                    }
                    if (tab.id === 'monitoring' && !monitoring) {
                      loadMonitoringData()
                    }
                    if (tab.id === 'audit' && !auditLogs) {
                      loadAuditData()
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <span>{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-8">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card-beautiful p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.users.total.toLocaleString()}</p>
                      <p className="text-sm text-green-600">+{stats.users.newThisWeek} this week</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="card-beautiful p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Projects</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.projects.active.toLocaleString()}</p>
                      <p className="text-sm text-green-600">+{stats.projects.newThisWeek} this week</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="card-beautiful p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.tasks.total.toLocaleString()}</p>
                      <p className="text-sm text-blue-600">{stats.tasks.completed} completed</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="card-beautiful p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Verified Users</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.users.verified.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">{Math.round((stats.users.verified / stats.users.total) * 100)}% verified</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="card-beautiful p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h3>
                <div className="space-y-4">
                  {stats.activity.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === 'user_signup' ? 'bg-blue-100' :
                          activity.type === 'project_created' ? 'bg-green-100' :
                            'bg-purple-100'
                        }`}>
                        {activity.type === 'user_signup' && (
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                        )}
                        {activity.type === 'project_created' && (
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        )}
                        {activity.type === 'task_completed' && (
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">{activity.description}</p>
                        <p className="text-sm text-gray-600">{formatDateTime(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-8">
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading analytics data...</p>
                  </div>
                </div>
              ) : analytics ? (
                <>
                  {/* Platform Metrics Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <div className="card-beautiful p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Users</p>
                          <p className="text-3xl font-bold text-gray-900">{analytics.platformMetrics.totalUsers}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-2xl">👥</span>
                        </div>
                      </div>
                    </div>

                    <div className="card-beautiful p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Projects</p>
                          <p className="text-3xl font-bold text-gray-900">{analytics.platformMetrics.totalProjects}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-2xl">📋</span>
                        </div>
                      </div>
                    </div>

                    <div className="card-beautiful p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                          <p className="text-3xl font-bold text-gray-900">{analytics.platformMetrics.totalTasks}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-2xl">✅</span>
                        </div>
                      </div>
                    </div>

                    <div className="card-beautiful p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                          <p className="text-3xl font-bold text-gray-900">{analytics.platformMetrics.completionRate}%</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-2xl">🎯</span>
                        </div>
                      </div>
                    </div>

                    <div className="card-beautiful p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Avg Tasks/Project</p>
                          <p className="text-3xl font-bold text-gray-900">{analytics.platformMetrics.averageTasksPerProject}</p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-2xl">📊</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Charts Row 1: User Growth & Project Growth */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* User Growth Chart */}
                    <div className="card-beautiful p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6">User Growth (Last 30 Days)</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analytics.userGrowth}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis />
                            <Tooltip
                              labelFormatter={(value) => new Date(value).toLocaleDateString()}
                              formatter={(value, name) => [value, name === 'cumulative' ? 'Total Users' : name === 'verified' ? 'Verified' : 'Unverified']}
                            />
                            <Legend />
                            <Area type="monotone" dataKey="cumulative" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                            <Area type="monotone" dataKey="verified" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.8} />
                            <Area type="monotone" dataKey="unverified" stackId="2" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.8} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Project Growth Chart */}
                    <div className="card-beautiful p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6">Project Activity (Last 30 Days)</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.projectGrowth}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis />
                            <Tooltip
                              labelFormatter={(value) => new Date(value).toLocaleDateString()}
                              formatter={(value, name) => [value, name === 'projects' ? 'Projects Created' : 'Active Users']}
                            />
                            <Legend />
                            <Bar dataKey="projects" fill="#10B981" name="Projects" />
                            <Bar dataKey="activeUsers" fill="#3B82F6" name="Active Users" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Charts Row 2: Task Activity & User Engagement */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Task Activity Chart */}
                    <div className="card-beautiful p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6">Task Status Distribution (Last 7 Days)</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analytics.taskActivity}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis />
                            <Tooltip
                              labelFormatter={(value) => new Date(value).toLocaleDateString()}
                              formatter={(value, name) => [value, name === 'created' ? 'Total Created' : name === 'available' ? 'Available' : name === 'in_progress' ? 'In Progress' : 'Completed']}
                            />
                            <Legend />
                            <Area type="monotone" dataKey="available" stackId="1" stroke="#6B7280" fill="#6B7280" fillOpacity={0.8} />
                            <Area type="monotone" dataKey="in_progress" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.8} />
                            <Area type="monotone" dataKey="completed" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.8} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* User Engagement Metrics */}
                    <div className="card-beautiful p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6">User Engagement</h3>
                      <div className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-900">Active Users (Last 7 Days)</span>
                            <span className="text-2xl font-bold text-blue-600">{analytics.userEngagement.activeUsersLast7Days}</span>
                          </div>
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-green-900">Avg Projects per User</span>
                            <span className="text-2xl font-bold text-green-600">{analytics.userEngagement.projectsPerUser.average.toFixed(1)}</span>
                          </div>
                        </div>

                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-purple-900">Avg Tasks per User</span>
                            <span className="text-2xl font-bold text-purple-600">{analytics.userEngagement.tasksPerUser.average.toFixed(1)}</span>
                          </div>
                        </div>

                        <div className="bg-orange-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-orange-900">Most Active User</span>
                            <span className="text-2xl font-bold text-orange-600">{analytics.userEngagement.projectsPerUser.max} projects</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Export Analytics Button */}
                  <div className="card-beautiful p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">Export Analytics Report</h3>
                        <p className="text-gray-600 mt-1">Download comprehensive analytics data as CSV</p>
                      </div>
                      <button
                        onClick={() => {
                          const csvData = generateAnalyticsCSV(analytics)
                          const blob = new Blob([csvData], { type: 'text/csv' })
                          const url = window.URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `analytics_report_${new Date().toISOString().split('T')[0]}.csv`
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                          window.URL.revokeObjectURL(url)
                          setNotification({ type: 'success', message: 'Analytics report exported successfully!' })
                          setTimeout(() => setNotification(null), 3000)
                        }}
                        className="btn-primary px-6 py-3"
                      >
                        📊 Export Report
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="card-beautiful p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Analytics Data</h3>
                  <p className="text-gray-600 mb-4">Click the button below to load analytics data</p>
                  <button
                    onClick={loadAnalyticsData}
                    className="btn-primary px-6 py-3"
                  >
                    Load Analytics
                  </button>
                </div>
              )}
            </div>
          )}

          {/* System Monitoring Tab */}
          {activeTab === 'monitoring' && (
            <div className="space-y-8">
              <AdminSystemMonitor />
            </div>
          )}

          {/* Audit Logging Tab */}
          {activeTab === 'audit' && (
            <div className="space-y-8">
              {auditLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading audit data...</p>
                  </div>
                </div>
              ) : auditLogs && auditStats ? (
                <>
                  {/* Audit Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Actions (24h)</p>
                          <p className="text-2xl font-bold text-gray-900">{auditStats.totalActions}</p>
                        </div>
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm">📊</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Admin Users</p>
                          <p className="text-2xl font-bold text-gray-900">{Object.keys(auditStats.adminActivity).length}</p>
                        </div>
                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-sm">👤</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Action Types</p>
                          <p className="text-2xl font-bold text-gray-900">{Object.keys(auditStats.actionsByType).length}</p>
                        </div>
                        <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 text-sm">🔧</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                          <p className="text-2xl font-bold text-gray-900">{auditStats.recentActivity.length}</p>
                        </div>
                        <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-orange-600 text-sm">⚡</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Types Chart */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Action Types Distribution</h3>
                    </div>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Object.entries(auditStats.actionsByType).map(([action, count]) => ({ action, count }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="action" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3B82F6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Recent Audit Logs */}
                  <div className="bg-white rounded-lg shadow-sm border">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Recent Audit Logs</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadAuditData()}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                        >
                          🔄 Refresh
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/admin/audit-logs', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'export', format: 'csv' })
                              })
                              if (response.ok) {
                                const result = await response.json()
                                const blob = new Blob([result.data], { type: 'text/csv' })
                                const url = window.URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = result.filename
                                document.body.appendChild(a)
                                a.click()
                                document.body.removeChild(a)
                                window.URL.revokeObjectURL(url)
                                setNotification({ type: 'success', message: 'Audit logs exported successfully!' })
                                setTimeout(() => setNotification(null), 3000)
                              }
                            } catch (error) {
                              setNotification({ type: 'error', message: 'Failed to export audit logs' })
                              setTimeout(() => setNotification(null), 3000)
                            }
                          }}
                          className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                        >
                          📥 Export CSV
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {auditLogs.logs.slice(0, 50).map((log: any) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(log.timestamp).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {log.admin_email}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${log.action.includes('delete') ? 'bg-red-100 text-red-800' :
                                    log.action.includes('create') || log.action.includes('verify') ? 'bg-green-100 text-green-800' :
                                      log.action.includes('suspend') ? 'bg-yellow-100 text-yellow-800' :
                                        log.action.includes('export') ? 'bg-blue-100 text-blue-800' :
                                          'bg-gray-100 text-gray-800'
                                  }`}>
                                  {log.action.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {log.resource_type}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {log.target_user_email || log.resource_id || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${log.status === 'success' ? 'bg-green-100 text-green-800' :
                                    log.status === 'failed' ? 'bg-red-100 text-red-800' :
                                      'bg-yellow-100 text-yellow-800'
                                  }`}>
                                  {log.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {log.ip_address || 'unknown'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {auditLogs.logs.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-gray-500">No audit logs found</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Failed to load audit data</p>
                  <button
                    onClick={loadAuditData}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="card-beautiful p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">User Management</h3>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{users.length} total users</span>
                    <button
                      onClick={handleExportUsers}
                      disabled={isExporting}
                      className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isExporting ? 'Exporting...' : 'Export Users'}
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Projects</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Joined</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="font-medium text-gray-900">{user.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{user.email}</td>
                          <td className="py-3 px-4">
                            {(() => {
                              const isSuspended = (user as any).reset_token === 'SUSPENDED'
                              return (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isSuspended
                                    ? 'bg-red-100 text-red-800'
                                    : user.email_verified
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                  {isSuspended ? 'Suspended' : user.email_verified ? 'Verified' : 'Unverified'}
                                </span>
                              )
                            })()}
                          </td>
                          <td className="py-3 px-4 text-gray-600">{user.project_count}</td>
                          <td className="py-3 px-4 text-gray-600">{formatDate(user.created_at)}</td>
                          <td className="py-3 px-4">
                            {(() => {
                              const isSuspended = (user as any).reset_token === 'SUSPENDED'
                              const isCurrentAdmin = user.email === 'contact@remisimmons.com'

                              if (isCurrentAdmin) {
                                return (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
                                      Admin Account
                                    </span>
                                  </div>
                                )
                              }

                              return (
                                <div className="flex items-center gap-1">
                                  {!user.email_verified && !isSuspended && (
                                    <button
                                      onClick={() => handleUserAction('verify_user', user.id, user.name)}
                                      disabled={actionLoading === `verify_user-${user.id}`}
                                      className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 disabled:opacity-50"
                                      title="Verify User"
                                    >
                                      {actionLoading === `verify_user-${user.id}` ? '⏳' : '✅'}
                                    </button>
                                  )}

                                  {!isSuspended ? (
                                    <button
                                      onClick={() => handleUserAction('suspend_user', user.id, user.name)}
                                      disabled={actionLoading === `suspend_user-${user.id}`}
                                      className="text-orange-600 hover:text-orange-800 p-1 rounded hover:bg-orange-50 disabled:opacity-50"
                                      title="Suspend User"
                                    >
                                      {actionLoading === `suspend_user-${user.id}` ? '⏳' : '⏸️'}
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleUserAction('activate_user', user.id, user.name)}
                                      disabled={actionLoading === `activate_user-${user.id}`}
                                      className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 disabled:opacity-50"
                                      title="Activate User"
                                    >
                                      {actionLoading === `activate_user-${user.id}` ? '⏳' : '▶️'}
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleUserAction('reset_user_password', user.id, user.name)}
                                    disabled={actionLoading === `reset_user_password-${user.id}`}
                                    className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 disabled:opacity-50"
                                    title="Reset Password"
                                  >
                                    {actionLoading === `reset_user_password-${user.id}` ? '⏳' : '🔑'}
                                  </button>

                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Are you sure you want to permanently delete ${user.name}? This action cannot be undone and will delete all their projects and data.`)) {
                                        handleUserAction('delete_user', user.id, user.name)
                                      }
                                    }}
                                    disabled={actionLoading === `delete_user-${user.id}`}
                                    className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 disabled:opacity-50"
                                    title="Delete User (Permanent)"
                                  >
                                    {actionLoading === `delete_user-${user.id}` ? '⏳' : '🗑️'}
                                  </button>
                                </div>
                              )
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="card-beautiful p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Project Management</h3>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{projects.length} total projects</span>
                    <button
                      onClick={handleExportProjects}
                      disabled={isExporting}
                      className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isExporting ? 'Exporting...' : 'Export Projects'}
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Project</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Owner</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Tasks</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Created</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Last Activity</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((project) => (
                        <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                              </div>
                              <span className="font-medium text-gray-900">{project.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{project.user_name}</div>
                              <div className="text-sm text-gray-600">{project.user_email}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{project.task_count}</td>
                          <td className="py-3 px-4 text-gray-600">{formatDate(project.created_at)}</td>
                          <td className="py-3 px-4 text-gray-600">{formatDate(project.last_activity)}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button className="text-blue-600 hover:text-blue-800 text-sm">
                                View
                              </button>
                              <button className="text-gray-600 hover:text-gray-800 text-sm">
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* System Health Tab */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card-beautiful p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Connection</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Healthy
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Response Time</span>
                      <span className="text-gray-900 font-medium">45ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Active Connections</span>
                      <span className="text-gray-900 font-medium">12/100</span>
                    </div>
                  </div>
                </div>

                <div className="card-beautiful p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Service</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Resend API</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Daily Limit</span>
                      <span className="text-gray-900 font-medium">45/100</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Success Rate</span>
                      <span className="text-gray-900 font-medium">98.5%</span>
                    </div>
                  </div>
                </div>

                <div className="card-beautiful p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentication</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">NextAuth</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Running
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Active Sessions</span>
                      <span className="text-gray-900 font-medium">23</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Failed Logins (24h)</span>
                      <span className="text-gray-900 font-medium">3</span>
                    </div>
                  </div>
                </div>

                <div className="card-beautiful p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Database Size</span>
                      <span className="text-gray-900 font-medium">2.3 GB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Backup Status</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Current
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Last Backup</span>
                      <span className="text-gray-900 font-medium">2 hours ago</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Actions */}
              <div className="card-beautiful p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="btn-secondary p-4 text-left">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <div>
                        <div className="font-medium">Export Data</div>
                        <div className="text-sm text-gray-600">Download system data</div>
                      </div>
                    </div>
                  </button>

                  <button className="btn-secondary p-4 text-left">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <div>
                        <div className="font-medium">Clear Cache</div>
                        <div className="text-sm text-gray-600">Refresh system cache</div>
                      </div>
                    </div>
                  </button>

                  <button className="btn-secondary p-4 text-left">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <div>
                        <div className="font-medium">View Logs</div>
                        <div className="text-sm text-gray-600">Check system logs</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
