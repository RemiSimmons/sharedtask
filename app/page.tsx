"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { isAdminUser } from "@/lib/admin"
// Force rebuild - syntax errors fixed

function LandingPageContent() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [projectName, setProjectName] = useState("My Task Management Project")
  const [taskLabel, setTaskLabel] = useState("Task Name")
  const [allowMultipleTasks, setAllowMultipleTasks] = useState(false)
  const [allowMultipleContributors, setAllowMultipleContributors] = useState(false)
  const [maxContributors, setMaxContributors] = useState("")
  const [allowContributorsAddNames, setAllowContributorsAddNames] = useState(true)
  const [allowContributorsAddTasks, setAllowContributorsAddTasks] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showProjectLimitModal, setShowProjectLimitModal] = useState(false)
  const [projectLimitError, setProjectLimitError] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  // Check for create=true query parameter
  useEffect(() => {
    try {
      if (searchParams?.get('create') === 'true' && status === 'authenticated') {
        setShowCreateForm(true)
      }
    } catch (error) {
      console.log('Error reading search params:', error)
    }
  }, [searchParams, status])

  const handleCreateProjectClick = () => {
    if (status === "unauthenticated") {
      router.push('/auth/signup')
      return
    }
    setShowCreateForm(true)
  }

  const handleProjectLimitError = (errorData: any) => {
    setProjectLimitError(errorData)
    setShowProjectLimitModal(true)
    setIsCreating(false)
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/delete`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete project' }))
        throw new Error(errorData.message || 'Failed to delete project')
      }

      const result = await response.json()
      alert(result.message || 'Project deleted successfully!')
      
      // Close modal and redirect to account page to manage projects
      setShowProjectLimitModal(false)
      router.push('/account')
    } catch (error) {
      console.error('Error deleting project:', error)
      alert(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsCreating(true)

    try {
      // Create project in database
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName,
          taskLabel,
          allowMultipleTasks,
          allowMultipleContributors,
          maxContributorsPerTask: allowMultipleContributors ? parseInt(maxContributors) || null : null,
          allowContributorsAddNames,
          allowContributorsAddTasks,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Project creation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        
        // Handle specific error codes with better UX
        if (errorData.code === 'FREE_TIER_ACTIVE_PROJECT_LIMIT' || errorData.code === 'PROJECT_LIMIT_REACHED') {
          handleProjectLimitError(errorData)
          return
        }
        
        throw new Error(errorData.message || errorData.error || 'Failed to create project')
      }

      const project = await response.json()
      console.log('Project created successfully:', project)
      
      // Redirect to admin dashboard for the new project
      router.push(`/admin/project/${project.id}`)
    } catch (error) {
      console.error('Error creating project:', error)
      alert(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsCreating(false)
    }
  }

  // Render create form
  const renderCreateForm = () => (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-6 mb-12">
          <div className="flex flex-col items-center gap-4">
            <img 
              src="/shared-task-logo.svg" 
              alt="SharedTask Logo" 
              className="h-20 w-auto"
            />
          </div>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
            Create a new project to start organizing tasks with your team
          </p>
        </div>

        {/* Project Creation Form */}
        <div className="card-beautiful p-8 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <svg className="section-icon text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <h2 className="header-section mb-0">Create New Project</h2>
            </div>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleCreateProject} className="space-y-6">
            {/* Project Name */}
            <div>
              <label htmlFor="project-name" className="block text-lg font-semibold text-gray-900 mb-2">
                📋 Project Name
              </label>
              <input
                id="project-name"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="form-input"
                placeholder="Enter your project name"
                required
              />
              <p className="text-sm text-gray-600 mt-1">This will appear at the top of your task management page</p>
            </div>

            {/* Task Label */}
            <div>
              <label htmlFor="task-label" className="block text-lg font-semibold text-gray-900 mb-2">
                🏷️ Task Label
              </label>
              <input
                id="task-label"
                type="text"
                value={taskLabel}
                onChange={(e) => setTaskLabel(e.target.value)}
                className="form-input"
                placeholder="Task Name"
                required
              />
              <p className="text-sm text-gray-600 mt-1">This label will replace "Task Name" in your table headers</p>
            </div>

            {/* Assignment Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">⚙️ Assignment Settings</h3>
              
              {/* Multiple Tasks */}
              <div className="flex items-start space-x-3">
                <input
                  id="multiple-tasks"
                  type="checkbox"
                  checked={allowMultipleTasks}
                  onChange={(e) => setAllowMultipleTasks(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <label htmlFor="multiple-tasks" className="text-base font-medium text-gray-900">
                    👥 Let people claim multiple tasks
                  </label>
                  <p className="text-sm text-gray-600">One person can take several different tasks</p>
                </div>
              </div>

              {/* Team Tasks */}
              <div className="flex items-start space-x-3">
                <input
                  id="team-tasks"
                  type="checkbox"
                  checked={allowMultipleContributors}
                  onChange={(e) => setAllowMultipleContributors(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <label htmlFor="team-tasks" className="text-base font-medium text-gray-900">
                    🤝 Allow team tasks (multiple people per task)
                  </label>
                  <p className="text-sm text-gray-600">Multiple people can work together on one task</p>
                </div>
              </div>

              {/* Max Contributors */}
              {allowMultipleContributors && (
                <div className="ml-7">
                  <label htmlFor="max-contributors" className="block text-base font-medium text-gray-900 mb-2">
                    Maximum contributors per task
                  </label>
                  <input
                    id="max-contributors"
                    type="number"
                    min="2"
                    max="10"
                    value={maxContributors}
                    onChange={(e) => setMaxContributors(e.target.value)}
                    className="form-input max-w-xs"
                    placeholder="e.g., 3"
                  />
                </div>
              )}

              {/* Allow Contributors to Add Names */}
              <div className="flex items-start space-x-3">
                <input
                  id="allow-contributor-names"
                  type="checkbox"
                  checked={allowContributorsAddNames}
                  onChange={(e) => setAllowContributorsAddNames(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <label htmlFor="allow-contributor-names" className="text-base font-medium text-gray-900">
                    ✏️ Allow people to add their names when claiming tasks
                  </label>
                  <p className="text-sm text-gray-600">Contributors can enter their names when claiming tasks</p>
                </div>
              </div>

              {/* Allow Contributors to Add Tasks */}
              <div className="flex items-start space-x-3">
                <input
                  id="allow-contributor-tasks"
                  type="checkbox"
                  checked={allowContributorsAddTasks}
                  onChange={(e) => setAllowContributorsAddTasks(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <label htmlFor="allow-contributor-tasks" className="text-base font-medium text-gray-900">
                    ➕ Allow people to add new tasks
                  </label>
                  <p className="text-sm text-gray-600">Contributors can create additional tasks for the project</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isCreating}
              className={`w-full btn-primary text-lg py-4 ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isCreating ? "Creating Project..." : "Create Project"}
            </button>
          </form>

          {/* Admin Access */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200">
            <p className="text-gray-600 mb-4">Already have a project?</p>
            <button
              onClick={() => router.push('/admin')}
              className="btn-secondary"
            >
              🔑 Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // Render authenticated user view
  const renderAuthenticatedView = () => {
    // Debug: Log current user info
    console.log('Current user session:', {
      name: session?.user?.name,
      email: session?.user?.email,
      isAdmin: isAdminUser(session?.user)
    })
    
    return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-6 mb-12">
          <div className="flex items-center justify-center gap-4">
            <svg className="header-icon text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <h1 className="header-main">{session?.user?.name ? `Welcome Back, ${session.user.name}!` : 'Welcome Back!'}</h1>
          </div>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
            {session?.user?.name ? `Welcome back, ${session.user.name}!` : `Hi ${session?.user?.email}!`} Ready to manage your projects?
          </p>
          {/* Debug info - check console for detailed logs */}
          <div className="text-sm text-gray-500 bg-yellow-50 border border-yellow-200 p-3 rounded">
            🔍 Debug Mode: Check browser console for authentication details
          </div>
        </div>

        {/* Action Options for Authenticated Users */}
        <div className="grid gap-8 max-w-2xl mx-auto">
          {/* Create New Project */}
          <div className="card-beautiful p-8 text-center hover-lift">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 Create New Project</h2>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Start organizing tasks for your next event, potluck, or project.
            </p>
            <button
              onClick={handleCreateProjectClick}
              className="w-full btn-primary text-lg py-4 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Create Project
            </button>
          </div>

          {/* Dashboard Access - Different for Admin vs Regular Users */}
          {isAdminUser(session?.user) ? (
            <div className="card-form p-8 text-center hover-lift">
              <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">⚙️ Admin Dashboard</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                View and manage all projects, access support center, and monitor system operations.
              </p>
              <button
                onClick={() => router.push('/admin')}
                className="w-full btn-secondary text-lg py-4 border-2 border-blue-200 hover:border-blue-300 transition-all duration-300"
              >
                🔧 Go to Admin Dashboard
              </button>
            </div>
          ) : (
            <div className="card-form p-8 text-center hover-lift">
              <div className="w-20 h-20 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">👤 My Account</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Manage your account settings, view your projects, and access billing information.
              </p>
              <button
                onClick={() => router.push('/account')}
                className="w-full btn-secondary text-lg py-4 border-2 border-purple-200 hover:border-purple-300 transition-all duration-300"
              >
                📋 View My Account
              </button>
            </div>
          )}
        </div>

        {/* Sign Out and Support Options */}
        <div className="text-center mt-8 space-y-4">
          <div className="flex justify-center gap-6">
            <button
              onClick={() => router.push('/support')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              💬 Support
            </button>
            <button
              onClick={() => router.push('/auth/signout')}
              className="text-gray-600 hover:text-gray-800 font-medium"
            >
              🚪 Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
  }

  // Render non-authenticated user view
  const renderGuestView = () => (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-5xl mx-auto min-h-screen flex flex-col pb-8">
        {/* Hero Section */}
        <div className="text-center space-y-2 mb-6">
          <div className="flex flex-col items-center gap-2">
            <img 
              src="/shared-task-logo.svg" 
              alt="SharedTask Logo" 
              className="h-20 w-auto"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 max-w-3xl mx-auto leading-tight">
            Share a link, pick a task, done.
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto font-medium leading-relaxed mt-4">
            The fastest way to organize any group — no logins, no learning curve.
          </p>
          
          {/* Start for Free CTA */}
          <div className="mt-8">
            <button
              onClick={() => router.push('/auth/signup')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Start for Free
            </button>
          </div>
          
        </div>

        {/* Call to Action */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Try Demo */}
          <div className="card-form p-6 text-center hover-lift flex flex-col">
            {/* Demo Image */}
            <div className="flex justify-center mb-4">
              <img 
                src="/ui-interaction-demo.png" 
                alt="Interactive Demo Preview" 
                className="w-32 h-32 object-contain"
              />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Try Interactive Demo</h2>
            <div className="max-w-prose mx-auto text-base md:text-[19px] text-gray-600 leading-relaxed flex-1 space-y-4 mb-8">
              <p>
                See SharedTask in action with a real potluck example — no signup needed.
              </p>
              <p>
                Add tasks, claim them, and watch updates appear instantly.
              </p>
              <p>
                The fastest way to try it before starting your own project.
              </p>
            </div>
            <div className="mt-auto">
              <button
                onClick={() => router.push('/demo')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-lg py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-none cursor-pointer min-h-12"
              >
                Start Demo Now
              </button>
              <p className="text-sm text-gray-500 mt-4">Takes 30 seconds • No commitment</p>
              <button
                onClick={() => router.push('/pricing')}
                className="w-full md:w-auto btn-secondary px-5 py-3 text-sm md:text-base mt-4"
              >
                Pricing Plans
              </button>
            </div>
          </div>

          {/* Create Real Project */}
          <div className="card-beautiful p-6 text-center hover-lift flex flex-col">
            {/* Create Project Image */}
            <div className="flex justify-center mb-4">
              <img 
                src="/create-project-demo.png" 
                alt="Create Project Preview" 
                className="w-32 h-32 object-contain"
              />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Create Your Project</h2>
            <div className="max-w-prose mx-auto text-base md:text-[19px] text-gray-600 leading-relaxed flex-1 space-y-4 mb-8">
              <p>
                Start your own project in seconds — add tasks, share a link, and let everyone pick what they'll do.
              </p>
              <p>
                Hosts save time, avoid group chat chaos, and always know who's doing what.
              </p>
              <p>
                Quick, simple, and perfect for any event or team.
              </p>
              <p>
                All for just 10¢ a day.
              </p>
            </div>
            <div className="mt-auto">
              <button
                onClick={handleCreateProjectClick}
                className="w-full btn-primary text-lg py-4 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Create Project
              </button>
              <p className="text-sm text-gray-500 mt-4">Share project link • Full functionality</p>
              <button
                onClick={() => router.push('/admin')}
                className="w-full md:w-auto btn-secondary px-5 py-3 text-sm md:text-base mt-4"
              >
                Sign in/Sign up
              </button>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-12">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-3">
              <img 
                src="/easy-collaboration-icon.png" 
                alt="Easy Collaboration" 
                className="w-12 h-12"
              />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Easy Collaboration</h3>
            <p className="text-base text-gray-600">Real-time task claiming and progress tracking</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-3">
              <img 
                src="/ui-interaction-demo.png" 
                alt="Simple Setup" 
                className="w-12 h-12"
              />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Simple Setup</h3>
            <p className="text-base text-gray-600">Get started in seconds with zero configuration</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-3">
              <img 
                src="/share-anywhere-icon.png" 
                alt="Share Anywhere" 
                className="w-12 h-12 object-contain brightness-75 contrast-125" 
              />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Share Anywhere</h3>
            <p className="text-base text-gray-600">Shareable links that work on any device</p>
          </div>
        </div>

        {/* Support Link */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/support')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            💬 Need Help? Contact Support
          </button>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
              <Link 
                href="/terms" 
                className="hover:text-blue-600 transition-colors"
              >
                Terms of Service
              </Link>
              <span>•</span>
              <Link 
                href="/privacy" 
                className="hover:text-blue-600 transition-colors"
              >
                Privacy Policy
              </Link>
              <span>•</span>
              <Link 
                href="/support" 
                className="hover:text-blue-600 transition-colors"
              >
                Support
              </Link>
            </div>
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} SharedTask. All rights reserved.
            </p>
          </div>
        </footer>

      </div>
    </div>
  )

  // Project Limit Modal
  const renderProjectLimitModal = () => {
    if (!showProjectLimitModal || !projectLimitError) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Limit Reached</h3>
            <p className="text-gray-600">{projectLimitError.message}</p>
          </div>

          <div className="space-y-3 mb-6">
            {projectLimitError.solutions?.map((solution: any, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-1">{solution.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{solution.description}</p>
                
                {solution.action === 'upgrade_plan' && (
                  <button
                    onClick={() => router.push('/pricing')}
                    className="w-full btn-primary py-2"
                  >
                    Upgrade Now
                  </button>
                )}
                
                {solution.action === 'delete_project' && solution.projectId && (
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${projectLimitError.activeProject?.name}"? This action cannot be undone.`)) {
                        handleDeleteProject(solution.projectId)
                      }
                    }}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Delete Project
                  </button>
                )}
                
                {solution.action === 'manage_projects' && (
                  <div className="space-y-2">
                    {projectLimitError.activeProjects?.map((project: any) => (
                      <div key={project.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div>
                          <div className="font-medium text-sm">{project.name}</div>
                          <div className="text-xs text-gray-500">
                            Created {new Date(project.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
                              handleDeleteProject(project.id)
                            }
                          }}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowProjectLimitModal(false)}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Main render logic with single return
  const content = (() => {
    if (showCreateForm) {
      return renderCreateForm()
    }

    if (status === "authenticated") {
      return renderAuthenticatedView()
    }

    return renderGuestView()
  })()

  return (
    <>
      {content}
      {renderProjectLimitModal()}
    </>
  )
}

export default function LandingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LandingPageContent />
    </Suspense>
  )
}