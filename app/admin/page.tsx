"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import AppHeader from "@/components/app-header"
import { isAdminUser } from "@/lib/admin"
import AdminUserCard from "@/components/admin-user-card"

interface UserOverview {
  id: string
  name: string
  email: string
  emailVerified: boolean
  tier: string
  tierLabel: string
  tierColor: string
  projectCount: number
  projectLimit: number
  projectUsagePercent: number
  taskCount: number
  lastActivity: string
  isActive: boolean
  storageUsed: number
  storageLimit: number
}

interface Stats {
  total: number
  byTier: {
    free: number
    basic: number
    pro: number
    team: number
  }
  active: number
  inactive: number
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<UserOverview[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  
  // Filters
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/auth/signin')
      return
    }

    if (status === "authenticated") {
      if (!isAdminUser(session?.user)) {
        router.push('/')
        return
      }
      loadUserOverview()
    }
  }, [status, router, session, tierFilter, statusFilter, searchQuery])

  const loadUserOverview = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const params = new URLSearchParams({
        tier: tierFilter,
        status: statusFilter,
        search: searchQuery
      })
      
      const response = await fetch(`/api/admin/users-overview?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to load user overview')
      }

      const data = await response.json()
      setUsers(data.users)
      setStats(data.stats)
    } catch (error) {
      console.error('Error loading user overview:', error)
      setError('Failed to load user overview')
    } finally {
      setIsLoading(false)
    }
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
                  <h2 className="text-2xl font-semibold text-gray-900">Loading Dashboard</h2>
                  <p className="text-lg text-gray-600">Please wait...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-lg text-gray-600">
              User-centric platform management
            </p>
          </div>

          {/* Quick Actions */}
          <div className="card-beautiful p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/admin/operations')}
                className="btn-primary px-6 py-3"
              >
                📊 Operations Dashboard
              </button>
              <button
                onClick={() => router.push('/admin/support')}
                className="btn-secondary px-6 py-3 border-2 border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                💬 Support Tickets
              </button>
              <button
                onClick={() => router.push('/admin/projects')}
                className="btn-secondary px-6 py-3 border-2 border-green-600 text-green-600 hover:bg-green-50"
              >
                📁 All Projects
              </button>
            </div>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 text-center">
                <strong>Note:</strong> This is an operations admin account. Project creation is handled through user accounts.
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          {stats && (
            <div className="card-beautiful p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Platform Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-600">{stats.byTier.free}</div>
                  <div className="text-sm text-gray-600">🟤 Free</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats.byTier.basic}</div>
                  <div className="text-sm text-gray-600">🔵 Basic</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{stats.byTier.pro}</div>
                  <div className="text-sm text-gray-600">🟣 Pro</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{stats.byTier.team}</div>
                  <div className="text-sm text-gray-600">🟢 Team</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">{stats.active}</div>
                  <div className="text-sm text-gray-600">Active (7d)</div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="card-beautiful p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">👥 Users</h2>

              <div className="flex flex-wrap gap-3">
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />

                {/* Tier Filter */}
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Tiers</option>
                  <option value="free">🟤 Free</option>
                  <option value="basic">🔵 Basic</option>
                  <option value="pro">🟣 Pro</option>
                  <option value="team">🟢 Team</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active (7d)</option>
                  <option value="inactive">Inactive</option>
                </select>

                {/* Refresh */}
                <button
                  onClick={loadUserOverview}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  🔄
                </button>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* User Cards Grid */}
          {users.length === 0 ? (
            <div className="card-beautiful p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Users Found</h3>
              <p className="text-gray-600">No users match your current filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {users.map((user) => (
                <AdminUserCard key={user.id} user={user} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
