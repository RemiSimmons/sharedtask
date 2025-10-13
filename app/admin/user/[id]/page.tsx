"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import AppHeader from "@/components/app-header"
import { isAdminUser } from "@/lib/admin"
import Link from "next/link"

interface UserDetails {
  id: string
  name: string
  email: string
  emailVerified: boolean
  createdAt: string
  tier: string
  tierLabel: string
  projectCount: number
  projectLimit: number
  taskCount: number
  storageUsed: number
  storageLimit: number
  daysSinceJoined: number
  subscription: any
  trial: any
}

interface Project {
  id: string
  name: string
  task_label: string
  created_at: string
  task_count: number
}

export default function AdminUserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<UserDetails | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

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
      loadUserDetails()
    }
  }, [status, params.id, session, router])

  const loadUserDetails = async () => {
    try {
      setIsLoading(true)
      
      // Fetch user details
      const userRes = await fetch(`/api/admin/user/${params.id}`)
      if (!userRes.ok) throw new Error('Failed to load user')
      const userData = await userRes.json()
      setUser(userData.user)

      // Fetch user's projects
      const projectsRes = await fetch(`/api/admin/user/${params.id}/projects`)
      if (!projectsRes.ok) throw new Error('Failed to load projects')
      const projectsData = await projectsRes.json()
      setProjects(projectsData.projects || [])
      
    } catch (error) {
      console.error('Error loading user details:', error)
      setError('Failed to load user details')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            <div className="card-beautiful p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading user details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            <div className="card-beautiful p-12 text-center">
              <p className="text-red-600">{error || 'User not found'}</p>
              <button
                onClick={() => router.push('/admin')}
                className="mt-4 btn-primary"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getTierBadgeClass = () => {
    switch (user.tierLabel) {
      case 'Team': return 'bg-green-100 text-green-800 border-green-300'
      case 'Pro': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'Basic': return 'bg-blue-100 text-blue-800 border-blue-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Back Button */}
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to User Dashboard
          </button>

          {/* User Header */}
          <div className="card-beautiful p-8">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center text-3xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-lg text-gray-600">{user.email}</p>
                <div className="flex flex-wrap gap-3 mt-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getTierBadgeClass()}`}>
                    {user.tier === 'free' && '🟤'}
                    {user.tier === 'basic' && '🔵'}
                    {user.tier === 'pro' && '🟣'}
                    {user.tier === 'team' && '🟢'}
                    <span className="ml-1">{user.tierLabel} Plan</span>
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    user.emailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.emailVerified ? '✓ Verified' : '⚠ Unverified'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">
                    Member for {user.daysSinceJoined} days
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card-beautiful p-6 text-center">
              <div className="text-4xl font-bold text-blue-600">{user.projectCount}</div>
              <div className="text-sm text-gray-600 mt-2">Projects</div>
              <div className="text-xs text-gray-500">
                of {user.projectLimit === -1 ? '∞' : user.projectLimit} limit
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 bg-blue-600 rounded-full"
                  style={{ 
                    width: user.projectLimit === -1 ? '0%' : `${Math.min((user.projectCount / user.projectLimit) * 100, 100)}%` 
                  }}
                />
              </div>
            </div>
            
            <div className="card-beautiful p-6 text-center">
              <div className="text-4xl font-bold text-purple-600">{user.taskCount}</div>
              <div className="text-sm text-gray-600 mt-2">Total Tasks</div>
              <div className="text-xs text-gray-500">Across all projects</div>
            </div>
            
            <div className="card-beautiful p-6 text-center">
              <div className="text-4xl font-bold text-green-600">{user.storageUsed} MB</div>
              <div className="text-sm text-gray-600 mt-2">Storage Used</div>
              <div className="text-xs text-gray-500">of {user.storageLimit} MB</div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 bg-green-600 rounded-full"
                  style={{ width: `${Math.min((user.storageUsed / user.storageLimit) * 100, 100)}%` }}
                />
              </div>
            </div>
            
            <div className="card-beautiful p-6 text-center">
              <div className="text-4xl font-bold text-orange-600">
                {user.subscription ? 'Paid' : user.trial ? 'Trial' : 'Free'}
              </div>
              <div className="text-sm text-gray-600 mt-2">Account Type</div>
              <div className="text-xs text-gray-500">
                {user.subscription?.status || user.trial?.status || 'active'}
              </div>
            </div>
          </div>

          {/* Subscription/Trial Info */}
          {(user.subscription || user.trial) && (
            <div className="card-beautiful p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Billing Information</h2>
              {user.subscription && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-semibold capitalize">{user.subscription.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-semibold capitalize">{user.subscription.plan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Interval:</span>
                    <span className="font-semibold capitalize">{user.subscription.interval}</span>
                  </div>
                  {user.subscription.current_period_end && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Renews:</span>
                      <span className="font-semibold">
                        {new Date(user.subscription.current_period_end).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
              {user.trial && !user.subscription && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trial Status:</span>
                    <span className="font-semibold capitalize">{user.trial.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trial Plan:</span>
                    <span className="font-semibold capitalize">{user.trial.plan}</span>
                  </div>
                  {user.trial.ends_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ends:</span>
                      <span className="font-semibold">
                        {new Date(user.trial.ends_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* User's Projects */}
          <div className="card-beautiful p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">User Projects ({projects.length})</h2>
              <button
                onClick={loadUserDetails}
                className="btn-secondary px-4 py-2"
              >
                🔄 Refresh
              </button>
            </div>
            
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-gray-600">This user has no projects yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-900 mb-2">{project.name}</h3>
                    <p className="text-sm text-gray-600 mb-1">{project.task_label}</p>
                    <p className="text-xs text-gray-500 mb-4">
                      {project.task_count} task{project.task_count !== 1 ? 's' : ''}
                    </p>
                    <div className="flex gap-2">
                      <Link 
                        href={`/admin/project/${project.id}`}
                        className="flex-1 btn-primary text-center text-sm py-2"
                      >
                        ⚙️ Manage
                      </Link>
                      <Link 
                        href={`/project/${project.id}`}
                        className="flex-1 btn-secondary text-center text-sm py-2"
                      >
                        👁️ View
                      </Link>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      Created {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

