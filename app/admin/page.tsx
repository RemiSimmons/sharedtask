"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import AppHeader from "@/components/app-header"
import { isAdminUser } from "@/lib/admin"

interface Project {
  id: string
  name: string
  task_label: string
  created_at: string
  _count?: {
    tasks: number
  }
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/auth/signin')
      return
    }

    if (status === "authenticated") {
      // Debug: Log user info
      console.log('Admin page access attempt:', {
        email: session?.user?.email,
        isAdmin: isAdminUser(session?.user),
        user: session?.user
      })
      
      // Check if user has admin access
      if (!isAdminUser(session?.user)) {
        console.log('Non-admin user redirected from admin page:', session?.user?.email)
        router.push('/')
        return
      }
      loadProjects()
    }
  }, [status, router, session])

  const loadProjects = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/projects')
      
      if (!response.ok) {
        throw new Error('Failed to load projects')
      }

      const data = await response.json()
      setProjects(data.projects)
    } catch (error) {
      console.error('Error loading projects:', error)
      setError('Failed to load projects')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
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
    )
  }

  if (status === "unauthenticated") {
    return null // Will redirect
  }

  // Redirect non-admin users
  if (status === "authenticated" && !isAdminUser(session?.user)) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* App Header */}
      <AppHeader />

      <div className="p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-center mb-4">
              <h1 className="header-main">Admin Dashboard</h1>
            </div>
            <p className="text-lg text-gray-600">
              {session?.user?.name ? `Welcome back, ${session.user.name}!` : 'Welcome back!'} Manage all your projects in one place.
            </p>
          </div>

        {/* Create New Project */}
        <div className="card-beautiful p-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900">Create New Project</h2>
          </div>
          <p className="text-lg text-gray-700 mb-6">
            Start organizing tasks with your team
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/?create=true')}
              className="btn-primary text-lg py-3 px-6"
            >
              🚀 Create Project
            </button>
            {/* Support Center button removed - users should use /support for tickets */}
            {/* Old admin email composer was replaced with proper user-facing support system */}
            {/* Operations Dashboard - Only for main admin */}
            {session?.user?.email === 'admin@sharedtask.ai' && (
              <button
                onClick={() => router.push('/admin/operations')}
                className="btn-secondary text-lg py-3 px-6 border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                📊 Operations Dashboard
              </button>
            )}
          </div>
        </div>

        {/* Projects List */}
        <div className="card-beautiful p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <svg className="section-icon text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h2 className="header-section mb-0">Your Projects</h2>
            </div>
            <button
              onClick={loadProjects}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg 
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {projects.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Projects Yet</h3>
              <p className="text-gray-600 mb-6">Create your first project to get started!</p>
              <button
                onClick={() => router.push('/?create=true')}
                className="btn-primary"
              >
                🚀 Create Your First Project
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <div key={project.id} className="card-form p-6 hover-lift">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.name}</h3>
                      <p className="text-gray-600">{project.task_label}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Link 
                      href={`/admin/project/${project.id}`}
                      className="flex-1 btn-primary text-center py-2"
                    >
                      ⚙️ Manage
                    </Link>
                    <Link 
                      href={`/project/${project.id}`}
                      className="flex-1 btn-secondary text-center py-2"
                    >
                      👥 Share Link
                    </Link>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Created {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </div>
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