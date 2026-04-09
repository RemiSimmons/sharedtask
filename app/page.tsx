"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useCustomAlert } from "@/components/ui/custom-toast"
import { isAdminUser } from "@/lib/admin"
import { DatePicker } from "@/components/ui/date-picker"
import { TimePicker } from "@/components/ui/time-picker"
import { ParticipantAutocomplete } from "@/components/participant-autocomplete"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { MobileNav } from "@/components/mobile-nav"
// Force rebuild - syntax errors fixed

function LandingPageContent() {
  const { alert } = useCustomAlert()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [projectName, setProjectName] = useState("My Task Management Project")
  const [taskLabel, setTaskLabel] = useState("Task Name")
  const [allowMultipleTasks, setAllowMultipleTasks] = useState(false)
  const [allowMultipleContributors, setAllowMultipleContributors] = useState(false)
  const [maxContributors, setMaxContributors] = useState("1")
  const [allowContributorsAddNames, setAllowContributorsAddNames] = useState(true)
  const [allowContributorsAddTasks, setAllowContributorsAddTasks] = useState(true)
  const [eventLocation, setEventLocation] = useState("")
  const [eventDate, setEventDate] = useState<Date | undefined>(() => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date
  })
  
  const [eventTime, setEventTime] = useState<Date | undefined>(() => {
    const time = new Date()
    time.setHours(18, 0, 0, 0)
    return time
  })
  const [eventAttire, setEventAttire] = useState("")
  const [contributorInput, setContributorInput] = useState("")
  const [contributors, setContributors] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [userProjects, setUserProjects] = useState<any[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [confirmDialogData, setConfirmDialogData] = useState<{
    title: string
    description: string
    onConfirm: () => void
    variant?: "default" | "destructive"
  }>({
    title: "",
    description: "",
    onConfirm: () => {},
  })
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  // Contributor management functions
  const addContributor = (name: string) => {
    const trimmedName = name.trim()
    if (trimmedName && !contributors.includes(trimmedName)) {
      setContributors(prev => [...prev, trimmedName])
      setContributorInput("")
    }
  }

  const removeContributor = (name: string) => {
    setContributors(prev => prev.filter(c => c !== name))
  }

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (status === 'authenticated' && session?.user && isAdminUser(session.user)) {
      router.push('/admin')
      return
    }
  }, [status, session, router])

  // Check for create=true query parameter and load projects
  useEffect(() => {
    try {
      if (searchParams?.get('create') === 'true' && status === 'authenticated') {
        setShowCreateForm(true)
      }
      if (status === 'authenticated') {
        loadUserProjects()
      }
    } catch (error) {
      console.log('Error reading search params:', error)
    }
  }, [searchParams, status])

  const loadUserProjects = async () => {
    try {
      setIsLoadingProjects(true)
      const response = await fetch('/api/debug/projects')
      if (response.ok) {
        const data = await response.json()
        setUserProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setIsLoadingProjects(false)
    }
  }

  const handleCreateProjectClick = () => {
    if (status === "unauthenticated") {
      router.push('/auth/signup')
      return
    }
    setShowCreateForm(true)
  }

  const handleDeleteProject = async (projectId: string, projectName?: string) => {
    // If called from modal, we don't need confirmation
    const needsConfirmation = !!projectName

    const performDelete = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/delete`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'fetch',
          },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to delete project' }))
          throw new Error(errorData.message || 'Failed to delete project')
        }

        const result = await response.json()

        // Close current dialog first
        setConfirmDialogOpen(false)
        
        // Close modal if open and reload projects list
        setShowProjectLimitModal(false)
        await loadUserProjects()

        // Small delay to ensure previous dialog closes before showing success
        setTimeout(() => {
          setConfirmDialogData({
            title: "Success",
            description: result.message || 'Project deleted successfully!',
            onConfirm: () => setConfirmDialogOpen(false),
            variant: "default"
          })
          setConfirmDialogOpen(true)
        }, 100)
      } catch (error) {
        console.error('Error deleting project:', error)
        
        // Close current dialog first
        setConfirmDialogOpen(false)
        
        // Small delay to ensure previous dialog closes before showing error
        setTimeout(() => {
          setConfirmDialogData({
            title: "Error",
            description: `Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`,
            onConfirm: () => setConfirmDialogOpen(false),
            variant: "default"
          })
          setConfirmDialogOpen(true)
        }, 100)
      }
    }

    if (needsConfirmation) {
      setConfirmDialogData({
        title: "Delete Project",
        description: `Are you sure you want to delete "${projectName}"? This action cannot be undone.`,
        onConfirm: performDelete,
        variant: "destructive"
      })
      setConfirmDialogOpen(true)
    } else {
      await performDelete()
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
          'X-Requested-With': 'fetch',
        },
        body: JSON.stringify({
          name: projectName,
          taskLabel,
          allowMultipleTasks,
          allowMultipleContributors,
          maxContributorsPerTask: allowMultipleContributors ? parseInt(maxContributors) || null : null,
          allowContributorsAddNames,
          allowContributorsAddTasks,
          eventLocation: eventLocation.trim() || null,
          contributors: contributors,
               eventTime: eventDate && eventTime ? 
                 new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), 
                         eventTime.getHours(), eventTime.getMinutes(), 0, 0).toISOString() : null,
          eventAttire: eventAttire.trim() || null,
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
        throw new Error(errorData.message || errorData.error || 'Failed to create project')
      }

      const project = await response.json()
      console.log('Project created successfully:', project)

      // Refresh the projects list immediately
      await loadUserProjects()

      // Close the create form
      setShowCreateForm(false)

      // Navigate to the project management page
      console.log('Redirecting to:', `/admin/project/${project.id}`)
      window.location.href = `/admin/project/${project.id}`
    } catch (error) {
      console.error('Error creating project:', error)
      // Use custom toast instead of browser alert
      alert(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsCreating(false)
    }
  }

  // Render create form
  const renderCreateForm = () => (
    <div className="min-h-screen p-4 md:p-8 mobile-form-container">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-6 mb-12">
          <div className="flex flex-col items-center gap-4">
            <img
              src="/logo.png"
              alt="SharedTask Logo"
              className="h-40 w-auto"
            />
          </div>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
            Set up your task list
          </p>
        </div>

        {/* Project Creation Form */}
        <div className="card-beautiful p-6 md:p-8 max-w-2xl mx-auto">
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
                maxLength={50}
                required
              />
              <p className="text-sm text-gray-600 mt-1">
                {projectName.length}/50 characters
              </p>
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
                maxLength={30}
                required
              />
              <p className="text-sm text-gray-600 mt-1">
                {taskLabel.length}/30 characters
              </p>
            </div>

            {/* Event Details - Optional */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">📅 Event Details (Optional)</h3>
              <p className="text-sm text-gray-600">Help people plan ahead</p>
              
              {/* Location */}
              <div>
                <label htmlFor="event-location" className="block text-base font-medium text-gray-900 mb-2">
                  📍 Location
                </label>
                <input
                  id="event-location"
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="form-input"
                  placeholder="e.g., Community Center, 123 Main St"
                  maxLength={100}
                />
                <p className="text-sm text-gray-600 mt-1">
                  {eventLocation.length}/100 characters
                </p>
              </div>

              {/* Date and Time - Same Line */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="event-date" className="block text-base font-medium text-gray-900 mb-2">
                    📅 Event Date
                  </label>
                  <DatePicker
                    date={eventDate}
                    setDate={setEventDate}
                    minDate={new Date()} // Prevent past dates
                    variant="quick"
                    className="w-full"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Date
                  </p>
                </div>

                <div>
                  <label htmlFor="event-time" className="block text-base font-medium text-gray-900 mb-2">
                    ⏰ Event Time
                  </label>
                  <TimePicker
                    time={eventTime}
                    setTime={setEventTime}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Time
                  </p>
                </div>
              </div>

              {/* Additional Details */}
              <div>
                <label htmlFor="event-attire" className="block text-base font-medium text-gray-900 mb-2">
                  📝 Additional Details
                </label>
                <input
                  id="event-attire"
                  type="text"
                  value={eventAttire}
                  onChange={(e) => setEventAttire(e.target.value)}
                  className="form-input"
                  placeholder="e.g., Casual attire, Surprise party, Bring snacks, etc."
                  maxLength={100}
                />
                <p className="text-sm text-gray-600 mt-1">
                  {eventAttire.length}/100 characters
                </p>
              </div>

              {/* Guests */}
              <div>
                <label className="block text-base font-medium text-gray-900 mb-2">
                  👥 Add Guests (Optional)
                </label>
                <ParticipantAutocomplete
                  value={contributorInput}
                  onChange={setContributorInput}
                  onAddParticipant={addContributor}
                  existingParticipants={contributors}
                  className="w-full"
                />
                
                {/* Selected Guests */}
                {contributors.length > 0 && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-2">
                      {contributors.map((contributor) => (
                        <div
                          key={contributor}
                          className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          <span>{contributor}</span>
                          <button
                            type="button"
                            onClick={() => removeContributor(contributor)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {contributors.length} expected participant{contributors.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
                
                <p className="text-sm text-gray-600 mt-1">
                  Add expected guests (they can add themselves later)
                </p>
              </div>
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
                  <p className="text-sm text-gray-600">Allow one person to claim multiple tasks</p>
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
                  <p className="text-sm text-gray-600">Allow team tasks with multiple people</p>
                </div>
              </div>

              {/* Max Guests */}
              {allowMultipleContributors && (
                <div className="ml-7">
                  <label htmlFor="max-contributors" className="block text-base font-medium text-gray-900 mb-2">
                    Maximum guests per task
                  </label>
                  <input
                    id="max-contributors"
                    type="number"
                    min="1"
                    max="20"
                    value={maxContributors}
                    onChange={(e) => setMaxContributors(e.target.value)}
                    className="form-input max-w-xs"
                    placeholder="e.g., 3"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    {maxContributors && (parseInt(maxContributors) < 1 || parseInt(maxContributors) > 20) 
                      ? <span className="text-red-600">Must be between 1 and 20</span>
                      : "Max per task (1-20)"
                    }
                  </p>
                </div>
              )}

              {/* Allow Guests to Add Names */}
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
                  <p className="text-sm text-gray-600">People can add their names</p>
                </div>
              </div>

              {/* Allow Guests to Add Tasks */}
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
                  <p className="text-sm text-gray-600">People can add new tasks</p>
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

          {/* Back to Dashboard */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200">
            <p className="text-gray-600 mb-4">Already have a project?</p>
            <button
              onClick={() => setShowCreateForm(false)}
              className="btn-secondary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // Render authenticated user view - Main Dashboard
  const renderAuthenticatedView = () => {
    return (
      <div className="min-h-screen">
        {/* Mobile Navigation */}
        <MobileNav showHomeLink={false} />
        
        <div className="p-6 md:p-8 pt-20 md:pt-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-6 mb-12">
              <div className="flex flex-col items-center gap-4">
                <img
                  src="/logo.png"
                  alt="SharedTask Logo"
                  className="h-40 w-auto"
                />
                <h1 className="text-4xl font-bold text-gray-900">Welcome Back, {session?.user?.name}!</h1>
              </div>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
                Ready to manage your projects?
              </p>
            </div>
          </div>
          <div className="space-y-8 max-w-2xl mx-auto">
            {/* Create New Project Card */}
            <div className="card-beautiful p-8 text-center hover-lift">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            {/* My Projects Dashboard Card */}
            <div className="card-beautiful p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h2 className="text-2xl font-bold text-gray-900">My Projects</h2>
                </div>
                <button
                  onClick={() => router.push('/account')}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  Account Settings →
                </button>
              </div>

              {isLoadingProjects ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading projects...</p>
                </div>
              ) : userProjects.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No projects yet</h3>
                  <p className="text-gray-600 mb-6">Create your first project to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userProjects.map((project) => (
                    <div key={project.id} className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                      {/* Mobile Layout */}
                      <div className="md:hidden space-y-4">
                        <div className="space-y-3">
                          {/* Project Title - Full Width */}
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 break-words leading-tight">{project.name}</h3>
                          </div>
                          {/* Date and Status - Side by Side */}
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                              Created {new Date(project.created_at).toLocaleDateString()} • {project.daysOld} days old
                            </div>
                            <div className="flex-shrink-0">
                              {project.isExpired ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Expired
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Active
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <button
                            onClick={() => router.push(`/admin/project/${project.id}`)}
                            className="w-full btn-primary text-lg py-3"
                            title="Manage project settings and admin dashboard"
                          >
                            Manage Project
                          </button>
                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push(`/project/${project.id}`)}
                              className="flex-1 btn-secondary text-base py-2 border border-gray-300"
                              title="View public project page"
                            >
                              View Public
                            </button>
                            <button
                              onClick={() => handleDeleteProject(project.id, project.name)}
                              className="text-red-600 hover:text-red-800 font-medium text-base px-3 py-2 min-h-[48px] border border-red-200 hover:border-red-300 rounded-md"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Desktop Layout */}
                      <div className="hidden md:block">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            {/* Project Title - Full Width */}
                            <div className="mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 break-words leading-tight">{project.name}</h3>
                            </div>
                            {/* Date and Status - Side by Side */}
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-600">
                                Created {new Date(project.created_at).toLocaleDateString()} • {project.daysOld} days old
                              </div>
                              <div className="flex-shrink-0">
                                {project.isExpired ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                    Expired
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    Active
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 ml-6">
                            <button
                              onClick={() => router.push(`/admin/project/${project.id}`)}
                              className="btn-primary px-4 py-2 text-sm"
                              title="Manage project settings and admin dashboard"
                            >
                              Manage Project
                            </button>
                            <button
                              onClick={() => router.push(`/project/${project.id}`)}
                              className="btn-secondary px-4 py-2 text-sm border border-gray-300"
                              title="View public project page"
                            >
                              View Public
                            </button>
                            <button
                              onClick={() => handleDeleteProject(project.id, project.name)}
                              className="text-red-600 hover:text-red-800 font-medium text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Admin Dashboard Access */}
            {isAdminUser(session?.user) && (
              <div className="card-form p-6 text-center hover-lift">
                <h3 className="text-lg font-bold text-gray-900 mb-3">⚙️ Admin Dashboard</h3>
                <button
                  onClick={() => router.push('/admin')}
                  className="w-full btn-secondary py-3 border-2 border-blue-200 hover:border-blue-300 transition-all duration-300"
                >
                  🔧 Go to Admin Dashboard
                </button>
              </div>
            )}
          </div>

          {/* Bottom Navigation - Hidden on mobile since we have MobileNav */}
          <div className="text-center mt-12 space-y-4 hidden md:block">
            <div className="flex justify-center gap-8">
              <button
                onClick={() => router.push('/support')}
                className="text-blue-600 hover:text-blue-800 font-medium min-h-[44px] px-3 py-2"
              >
                💬 Support
              </button>
              <button
                onClick={() => router.push('/account')}
                className="text-gray-600 hover:text-gray-800 font-medium min-h-[44px] px-3 py-2"
              >
                👤 Account Settings
              </button>
              <button
                onClick={() => router.push('/auth/signout')}
                className="text-gray-600 hover:text-gray-800 font-medium min-h-[44px] px-3 py-2"
              >
                🚪 Sign Out
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Built by{' '}
              <a
                href="https://remisimmons.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                RemiSimmons.com
              </a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Render non-authenticated user view
  const renderGuestView = () => (
    <div className="min-h-screen p-5 md:p-6">
      <div className="max-w-5xl mx-auto min-h-screen flex flex-col pb-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 md:space-y-2 mb-8 md:mb-6">
          <div className="flex flex-col items-center gap-3 md:gap-2">
            <img
              src="/logo.png"
              alt="SharedTask Logo"
              className="h-48 md:h-40 w-auto"
            />
          </div>
          <h1 className="text-4xl md:text-4xl font-bold text-gray-900 max-w-3xl mx-auto leading-tight px-2">
            Group Planning, Finally Simplified
          </h1>
          <p className="text-2xl md:text-xl text-gray-700 max-w-2xl mx-auto font-medium leading-relaxed mt-5 md:mt-4 px-3">
            Share a link. Pick a task. Done.
          </p>

          {/* Start for Free CTA */}
          <div className="mt-10 md:mt-8">
            <button
              onClick={() => router.push('/auth/signup')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xl md:text-lg py-5 md:py-3 px-10 md:px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 min-h-[60px] md:min-h-0"
            >
              Start for Free
            </button>
          </div>

        </div>

        {/* Call to Action */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-6 max-w-4xl mx-auto">
          {/* Create Real Project */}
          <div className="card-beautiful p-7 md:p-6 text-center hover-lift flex flex-col">
            {/* Create Project Image */}
            <div className="flex justify-center mb-5 md:mb-4">
              <img
                src="/create-project-demo.png"
                alt="Create Project Preview"
                className="w-36 h-36 md:w-32 md:h-32 object-contain"
              />
            </div>
            <h2 className="text-3xl md:text-3xl font-bold text-gray-900 mb-6 leading-tight">Create Your Project</h2>
            <div className="max-w-prose mx-auto text-xl md:text-[19px] text-gray-700 leading-relaxed flex-1 space-y-5 md:space-y-4 mb-8">
              <p className="font-medium">
                Perfect for potlucks, parties, and family events.
              </p>
              <p>
                Add your tasks. Share one link. Everyone picks what they want to do.
              </p>
              <p className="text-lg md:text-base text-gray-600">
                100% free, no credit card needed
              </p>
            </div>
            <div className="mt-auto space-y-4">
              <button
                onClick={handleCreateProjectClick}
                className="w-full btn-primary text-xl md:text-lg py-5 md:py-4 shadow-lg hover:shadow-xl transition-all duration-300 min-h-[60px] md:min-h-0"
              >
                Create Project
              </button>
              <button
                onClick={() => router.push('/auth/signin')}
                className="w-full btn-secondary px-5 py-4 md:py-3 text-lg md:text-base min-h-[56px] md:min-h-0"
              >
                Sign In / Sign Up
              </button>
            </div>
          </div>

          {/* Try Demo */}
          <div className="card-form p-7 md:p-6 text-center hover-lift flex flex-col">
            {/* Demo Image */}
            <div className="flex justify-center mb-5 md:mb-4">
              <img
                src="/ui-interaction-demo.png"
                alt="Interactive Demo Preview"
                className="w-36 h-36 md:w-32 md:h-32 object-contain"
              />
            </div>
            <h2 className="text-3xl md:text-3xl font-bold text-gray-900 mb-6 leading-tight">Try a Demo</h2>
            <div className="max-w-prose mx-auto text-xl md:text-[19px] text-gray-700 leading-relaxed flex-1 space-y-5 md:space-y-4 mb-8">
              <p className="font-medium">
                See how it works with a real example.
              </p>
              <p>
                Try adding and claiming tasks. No signup needed.
              </p>
              <p className="text-lg md:text-base text-gray-600">
                Takes just 30 seconds
              </p>
            </div>
            <div className="mt-auto space-y-4">
              <button
                onClick={() => router.push('/demo')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xl md:text-lg py-5 md:py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-none cursor-pointer min-h-[60px] md:min-h-0"
              >
                Try Demo Now
              </button>
              <button
                onClick={() => router.push('/auth/signup')}
                className="w-full btn-secondary px-5 py-4 md:py-3 text-lg md:text-base min-h-[56px] md:min-h-0"
              >
                Get Started Free
              </button>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 max-w-3xl mx-auto mt-16 md:mt-12 px-4">
          <div className="text-center bg-white p-6 md:p-4 rounded-lg">
            <div className="w-16 h-16 md:w-12 md:h-12 mx-auto rounded-lg flex items-center justify-center mb-4 md:mb-3">
              <img
                src="/easy-collaboration-icon.png"
                alt="Easy Collaboration"
                className="w-16 h-16 md:w-12 md:h-12"
              />
            </div>
            <h3 className="text-xl md:text-base font-bold text-gray-900 mb-3 md:mb-2">Work Together</h3>
            <p className="text-lg md:text-base text-gray-700 leading-relaxed">Everyone sees updates instantly</p>
          </div>

          <div className="text-center bg-white p-6 md:p-4 rounded-lg">
            <div className="w-16 h-16 md:w-12 md:h-12 mx-auto rounded-lg flex items-center justify-center mb-4 md:mb-3">
              <img
                src="/ui-interaction-demo.png"
                alt="Simple Setup"
                className="w-16 h-16 md:w-12 md:h-12"
              />
            </div>
            <h3 className="text-xl md:text-base font-bold text-gray-900 mb-3 md:mb-2">Super Simple</h3>
            <p className="text-lg md:text-base text-gray-700 leading-relaxed">Set up in under 2 minutes</p>
          </div>

          <div className="text-center bg-white p-6 md:p-4 rounded-lg">
            <div className="w-16 h-16 md:w-12 md:h-12 mx-auto rounded-lg flex items-center justify-center mb-4 md:mb-3">
              <img
                src="/share-anywhere-icon.png"
                alt="Share Anywhere"
                className="w-16 h-16 md:w-12 md:h-12 object-contain brightness-75 contrast-125"
              />
            </div>
            <h3 className="text-xl md:text-base font-bold text-gray-900 mb-3 md:mb-2">Share Easily</h3>
            <p className="text-lg md:text-base text-gray-700 leading-relaxed">Works on any phone or computer</p>
          </div>
        </div>

        {/* Support Link */}
        <div className="text-center mt-12 md:mt-8">
          <button
            onClick={() => router.push('/support')}
            className="text-blue-600 hover:text-blue-800 font-semibold text-xl md:text-base py-3 px-6 md:py-0 md:px-0"
          >
            💬 Need Help? Contact Support
          </button>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200">
          <div className="text-center space-y-5 md:space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 text-lg md:text-sm text-gray-700 md:text-gray-600">
              <Link
                href="/terms"
                className="hover:text-blue-600 transition-colors font-medium py-2 md:py-0"
              >
                Terms of Service
              </Link>
              <span className="hidden md:inline">•</span>
              <Link
                href="/privacy"
                className="hover:text-blue-600 transition-colors font-medium py-2 md:py-0"
              >
                Privacy Policy
              </Link>
              <span className="hidden md:inline">•</span>
              <Link
                href="/support"
                className="hover:text-blue-600 transition-colors font-medium py-2 md:py-0"
              >
                Support
              </Link>
            </div>
            <p className="text-base md:text-xs text-gray-600 md:text-gray-500">
              © {new Date().getFullYear()} SharedTask. All rights reserved.
            </p>
            <p className="text-base md:text-xs text-gray-600 md:text-gray-500">
              Built by{' '}
              <a
                href="https://remisimmons.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                RemiSimmons.com
              </a>
            </p>
          </div>
        </footer>

      </div>
    </div>
  )

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
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title={confirmDialogData.title}
        description={confirmDialogData.description}
        confirmText={confirmDialogData.variant === "destructive" ? "Delete" : "OK"}
        cancelText={confirmDialogData.variant === "destructive" ? "Cancel" : undefined}
        onConfirm={confirmDialogData.onConfirm}
        variant={confirmDialogData.variant}
      />
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
}// Force rebuild Tue Oct  7 11:36:51 EDT 2025
// Deployment fix 1759852893
// Fix deployment issue 1759853926
