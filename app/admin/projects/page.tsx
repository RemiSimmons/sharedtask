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
  user_id?: string
  user?: {
    id: string
    name: string
    email: string
  }
  _count?: {
    tasks: number
  }
}

export default function AdminProjectsView() {
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
      if (!isAdminUser(session?.user)) {
        router.push('/')
        return
      }
      loadProjects()
    }
  }, [status, router, session])

  const loadProjects = async () => {
    try {
      setIsLoading(true)
      setError('')
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="card-beautiful p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading projects...</p>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">All Projects</h1>
              <p className="text-lg text-gray-600 mt-2">Platform-wide project overview</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/admin')}
                className="btn-secondary px-4 py-2"
              >
                👥 Users View
              </button>
              <button
                onClick={loadProjects}
                className="btn-secondary px-4 py-2"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* Projects Grid */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {projects.length === 0 ? (
            <div className="card-beautiful p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No User Projects</h3>
              <p className="text-gray-600">
                Projects are created by users through their accounts.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <div key={project.id} className="card-form p-6 hover-lift">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.name}</h3>
                      <p className="text-gray-600">{project.task_label}</p>
                      {project.user && (
                        <div className="mt-2 text-sm text-gray-500">
                          <p className="font-medium">Owner: {project.user.name}</p>
                          <p className="text-xs">{project.user.email}</p>
                        </div>
                      )}
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
                      Created {formatDate(project.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

