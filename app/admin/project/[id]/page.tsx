"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import TaskTable from "@/components/task-table"
import DangerZone from "@/components/danger-zone"
import { TaskProvider } from "@/contexts/TaskContextWithSupabase"
import { useTask } from "@/contexts/TaskContextWithSupabase"
import Link from "next/link"

export default function AdminProjectPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const copyContributorLink = () => {
    const link = `${window.location.origin}/project/${projectId}`
    navigator.clipboard.writeText(link)
    alert('Contributor link copied to clipboard!')
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  if (status === "loading") {
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
                <h2 className="text-2xl font-semibold text-gray-900">Loading Project</h2>
                <p className="text-lg text-gray-600">Please wait...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push('/auth/signin')
    return null
  }

  return (
    <TaskProvider projectId={projectId}>
      <div className="min-h-screen bg-gray-50">
        {/* Clean Header with Shared Task logo and user actions */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              {/* Left side - Shared Task Logo */}
              <Link href="/admin" className="flex items-center hover:opacity-80 transition-opacity">
                <img 
                  src="/shared-task-logo.svg" 
                  alt="SharedTask Logo" 
                  className="h-20 w-auto"
                />
              </Link>

              {/* Right side - User info and actions */}
              <div className="flex items-center gap-4">
                {session?.user && (
                  <>
                    {/* User greeting */}
                    <div className="hidden sm:block text-gray-600">
                      <span className="text-sm">
                        Hello, <span className="font-medium">{session.user.name || session.user.email}</span>
                      </span>
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex items-center gap-3">
                      {/* Account button */}
                      <Link 
                        href="/account" 
                        className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors border border-gray-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="hidden sm:inline">Account</span>
                      </Link>

                      {/* Sign out button */}
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 text-gray-600 hover:text-red-600 px-3 py-2 rounded-lg font-medium transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="hidden sm:inline">Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-12">
            {/* Page-level Back Button and Project Header */}
            <div className="space-y-4">
              {/* Back to Dashboard Button - Prominent positioning */}
              <div className="flex items-center">
                <Link 
                  href="/admin"
                  className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors border border-blue-200 shadow-sm hover:shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Dashboard
                </Link>
              </div>

              {/* Project Header and Actions */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <ProjectHeader projectId={projectId} />
              
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={copyContributorLink}
                  className="btn-accent flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Share Link
                </button>
                <button
                  onClick={() => window.open(`/project/${projectId}`, '_blank')}
                  className="btn-secondary flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Preview Public View
                </button>
              </div>
            </div>
            </div>

            {/* Project Summary */}
            <ProjectSummary />

            {/* Project Settings - Moved before Dynamic Content */}
            <div className="max-w-2xl">
              <ProjectSettingsSection />
            </div>

            {/* Dynamic Content Layout based on project state */}
            <DynamicContentLayout 
              projectId={projectId}
              copyContributorLink={copyContributorLink}
            />

            {/* Danger Zone - Moved to bottom */}
            <div className="mt-16 pt-8 border-t-2 border-gray-200">
              <div className="max-w-2xl">
                <DangerZone projectId={projectId} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </TaskProvider>
  )
}


// Dynamic Content Layout Component
function DynamicContentLayout({ 
  projectId, 
  copyContributorLink 
}: { 
  projectId: string
  copyContributorLink: () => void 
}) {
  const { tasks, projectSettings } = useTask()
  const isNewProject = tasks.length <= 2

  if (isNewProject) {
    // For new/empty projects (0-2 tasks): Show Project Setup first, then Active Tasks
    return (
      <div className="space-y-8">
        {/* Project Setup Section */}
        <BulkAddSection />

        {/* Task Management - Secondary for new projects */}
        <div className="card-beautiful p-8">
          <div className="flex items-center gap-3 mb-6">
            <svg className="section-icon text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h2 className="header-section mb-0">{projectSettings.taskLabel || "Active Tasks"}</h2>
          </div>
          <TaskTable />
        </div>

        {/* Project Actions Section */}
        <ProjectActions 
          projectId={projectId}
          copyContributorLink={copyContributorLink}
        />
      </div>
    )
  } else {
    // For established projects (3+ tasks): Show Active Tasks first, then Project Setup
    return (
      <div className="space-y-8">
        {/* Task Management - Primary for established projects */}
        <div className="card-beautiful p-8">
          <div className="flex items-center gap-3 mb-6">
            <svg className="section-icon text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h2 className="header-section mb-0">{projectSettings.taskLabel || "Active Tasks"}</h2>
          </div>
          <TaskTable />
        </div>

        {/* Project Setup Section */}
        <BulkAddSection />

        {/* Project Actions Section */}
        <ProjectActions 
          projectId={projectId}
          copyContributorLink={copyContributorLink}
        />
      </div>
    )
  }
}

// Bulk Add Section Component
function BulkAddSection() {
  const { addTasks, tasks, addContributorNames } = useTask()
  const [bulkTasks, setBulkTasks] = useState("")
  const [bulkContributors, setBulkContributors] = useState("")
  const [bulkDescription, setBulkDescription] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [lastAddedInfo, setLastAddedInfo] = useState<{ tasks: number; contributors: number } | null>(null)

  // Get active contributors from context
  const { activeContributors } = useTask()

  const parseTasks = () => {
    return bulkTasks
      .split(/[\n,]/)
      .map(name => name.trim())
      .filter(name => name.length > 0)
  }

  const parseContributors = () => {
    return bulkContributors
      .split(/[\n,]/)
      .map(name => name.trim())
      .filter(name => name.length > 0)
  }

  const handleBulkAdd = async () => {
    const taskNames = parseTasks()
    const contributorNames = parseContributors()
    
    if (taskNames.length === 0 && contributorNames.length === 0) return

    setIsAdding(true)
    
    try {
      let addedTasks = 0
      let addedContributors = 0

      // Add tasks if any
      if (taskNames.length > 0) {
        await addTasks(taskNames, bulkDescription.trim() || undefined, true)
        addedTasks = taskNames.length
      }

      // Add contributors to the database (all at once to avoid state sync issues)
      if (contributorNames.length > 0) {
        console.log('Adding contributors:', contributorNames)
        try {
          await addContributorNames(contributorNames)
          addedContributors = contributorNames.length
          console.log(`Successfully added ${addedContributors} contributors`)
        } catch (error) {
          console.error('Failed to add contributors:', error)
        }
      }

      // Show success feedback
      setLastAddedInfo({ tasks: addedTasks, contributors: addedContributors })
      
      // Clear inputs
      setBulkTasks("")
      setBulkContributors("")
      setBulkDescription("")
      
      // Clear success message after 5 seconds
      setTimeout(() => setLastAddedInfo(null), 5000)
    } catch (error) {
      console.error('Error adding bulk items:', error)
      alert('Failed to add items. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  const taskCount = parseTasks().length
  const contributorCount = parseContributors().length
  const hasContent = taskCount > 0 || contributorCount > 0  // Allow either tasks or contributors or both

  return (
    <div className="card-beautiful p-8">
      <div className="mb-6">
        <h2 className="header-section mb-0">Project Setup</h2>
      </div>

      <p className="text-lg text-gray-700 mb-8">
        Set up your project quickly by adding all tasks and contributors at once.
      </p>

      {/* Success Message */}
      {lastAddedInfo && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-800 font-medium">
              Successfully added {lastAddedInfo.tasks > 0 && `${lastAddedInfo.tasks} task(s)`}
              {lastAddedInfo.tasks > 0 && lastAddedInfo.contributors > 0 && ' and '}
              {lastAddedInfo.contributors > 0 && `${lastAddedInfo.contributors} contributor(s)`}!
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6 mb-8">
        {/* Tasks Input - Primary position */}
        <div>
          <label htmlFor="bulk-tasks" className="block text-xl font-semibold text-gray-900 mb-3">
            What needs to be done?
          </label>
          <textarea
            id="bulk-tasks"
            value={bulkTasks}
            onChange={(e) => setBulkTasks(e.target.value)}
            className="form-input h-40 resize-none text-base"
            placeholder="Enter all task names (one per line or separated by commas)&#10;Examples:&#10;Pancakes, Orange juice, Coffee, Eggs&#10;Set up decorations&#10;Clean up afterward"
            disabled={isAdding}
          />
          {taskCount > 0 && (
            <p className="text-sm text-blue-600 mt-2 font-medium">{taskCount} task{taskCount !== 1 ? 's' : ''} ready to add</p>
          )}
          <p className="text-sm text-gray-600 mt-1">Enter one task per line or separate with commas</p>
        </div>

        {/* Contributors Input - Secondary position */}
        <div>
          <label htmlFor="bulk-contributors-main" className="block text-lg font-semibold text-gray-900 mb-2">
            Who might help? (Optional)
          </label>
          <input
            id="bulk-contributors-main"
            type="text"
            value={bulkContributors}
            onChange={(e) => setBulkContributors(e.target.value)}
            className="form-input text-base"
            placeholder="Enter expected contributor names (separated by commas)"
            disabled={isAdding}
          />
          {contributorCount > 0 && (
            <p className="text-sm text-blue-600 mt-1">{contributorCount} contributor{contributorCount !== 1 ? 's' : ''} for reference</p>
          )}
          <p className="text-xs text-gray-600 mt-1">
            Optional: Add expected contributors for planning. People can also enter their names when claiming tasks.
          </p>
        </div>

        {/* Description - Tertiary position */}
        <div>
          <label htmlFor="bulk-description" className="block text-lg font-semibold text-gray-900 mb-2">
            Additional Details (Optional)
          </label>
          <textarea
            id="bulk-description"
            value={bulkDescription}
            onChange={(e) => setBulkDescription(e.target.value)}
            className="form-input h-20 resize-none text-base"
            placeholder="Add any additional details or instructions for all tasks..."
            disabled={isAdding}
          />
        </div>
      </div>

      {/* Add All Button */}
      <button
        onClick={handleBulkAdd}
        disabled={isAdding || !hasContent}
        className={`w-full text-xl py-4 px-8 rounded-lg font-bold transition-all duration-300 ${
          hasContent && !isAdding
            ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isAdding ? (
          <div className="flex items-center justify-center gap-3">
            <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Adding Everything...
          </div>
        ) : hasContent ? (
          (() => {
            if (taskCount > 0 && contributorCount > 0) {
              return `Add ${taskCount} Task${taskCount !== 1 ? 's' : ''} & ${contributorCount} Contributor${contributorCount !== 1 ? 's' : ''}`
            } else if (taskCount > 0) {
              return `Add ${taskCount} Task${taskCount !== 1 ? 's' : ''}`
            } else {
              return `Add ${contributorCount} Contributor${contributorCount !== 1 ? 's' : ''}`
            }
          })()
        ) : (
          'Enter tasks or contributors above to get started'
        )}
      </button>

      <p className="text-sm text-gray-600 mt-4 text-center">
        This bulk setup saves time, but you can always add details per task or modify them later.
      </p>

      {/* Active Contributors Display */}
      {activeContributors.length > 0 && (
        <div className="mt-8 p-6 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h4 className="text-lg font-semibold text-green-800">👥 Active Contributors</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeContributors.map((contributor) => (
              <div key={contributor} className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
                <span className="text-gray-900 font-medium">{contributor}</span>
                <span className="text-green-600 text-sm font-semibold">
                  {tasks.filter(t => t.claimedBy?.includes(contributor)).length} task{tasks.filter(t => t.claimedBy?.includes(contributor)).length !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
          <p className="text-green-700 text-sm mt-4">
            These people have claimed tasks in your project. Contributors don't need to be pre-added - they can enter their names when claiming tasks.
          </p>
        </div>
      )}
    </div>
  )
}


// Project Actions Component
function ProjectActions({ 
  projectId, 
  copyContributorLink 
}: { 
  projectId: string
  copyContributorLink: () => void 
}) {
  return (
    <div className="max-w-2xl">
      <div className="card-form p-6">
        <div className="flex items-center gap-3 mb-6">
          <svg className="section-icon text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Project Actions</h3>
        </div>

      <div className="space-y-6">
        {/* Share Link Section */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Share Link
          </label>
          <div className="flex gap-3 items-center">
            <div className="flex-shrink-0">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <input
              type="text"
              value={`${window.location.origin}/project/${projectId}`}
              readOnly
              className="form-input flex-1 text-sm bg-gray-50"
            />
            <button
              onClick={copyContributorLink}
              className="btn-primary px-4 py-2 text-sm font-medium"
            >
              Copy
            </button>
          </div>
          <p className="text-gray-600 text-xs mt-2">
            Share this link — contributors can claim tasks without signup.
          </p>
        </div>

        {/* Divider */}
        <hr className="border-gray-200" />

        {/* Preview Section */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Preview
          </label>
          <button
            onClick={() => window.open(`/project/${projectId}`, '_blank')}
            className="w-full btn-secondary text-sm py-2 font-medium"
          >
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open Contributor View
          </button>
        </div>
      </div>
    </div>
    </div>
  )
}

// Project Header Component
function ProjectHeader({ projectId }: { projectId: string }) {
  const { projectSettings, loading } = useTask()

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        {projectSettings.projectName || "Loading..."}
      </h1>
    </div>
  )
}

// Project Summary Component
function ProjectSummary() {
  const { tasks, projectSettings, loading } = useTask()

  if (loading) {
    return (
      <div className="card-beautiful p-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-8 bg-gray-200 rounded w-12"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Calculate statistics
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const claimedTasks = tasks.filter(t => t.status === 'claimed').length
  const availableTasks = tasks.filter(t => t.status === 'available').length
  
  // Get unique contributors
  const contributors = new Set<string>()
  tasks.forEach(task => {
    if (task.claimedBy) {
      task.claimedBy.forEach(contributor => contributors.add(contributor))
    }
  })
  
  const totalComments = tasks.reduce((sum, task) => sum + task.comments.length, 0)

  return (
    <div className="card-beautiful p-8">
      <div className="flex items-center gap-3 mb-6">
        <svg className="section-icon text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h2 className="header-section mb-0">Project Overview</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Tasks */}
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-3xl font-bold text-blue-600">{totalTasks}</div>
          <div className="text-sm text-gray-600">Total Tasks</div>
        </div>

        {/* Available Tasks */}
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-3xl font-bold text-green-600">{availableTasks}</div>
          <div className="text-sm text-gray-600">Available</div>
        </div>

        {/* Claimed Tasks */}
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <div className="text-3xl font-bold text-orange-600">{claimedTasks}</div>
          <div className="text-sm text-gray-600">Claimed</div>
        </div>

        {/* Completed Tasks */}
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-3xl font-bold text-purple-600">{completedTasks}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-200">
        {/* Contributors */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{contributors.size}</div>
          <div className="text-sm text-gray-600">Active Contributors</div>
          {contributors.size > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              {Array.from(contributors).slice(0, 3).join(", ")}
              {contributors.size > 3 && ` +${contributors.size - 3} more`}
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{totalComments}</div>
          <div className="text-sm text-gray-600">Total Comments</div>
        </div>

        {/* Settings */}
        <div className="text-center">
          <div className="text-sm text-gray-600">Settings</div>
          <div className="text-xs text-gray-500 mt-1 space-y-1">
            <div>Multiple Claims: {projectSettings.allowMultipleClaims ? "✅ Yes" : "❌ No"}</div>
            <div>Multiple Contributors: {projectSettings.allowMultipleContributors ? "✅ Yes" : "❌ No"}</div>
            <div>Contributors Add Names: {projectSettings.allowContributorsAddNames ? "✅ Yes" : "❌ No"}</div>
            <div>Contributors Add Tasks: {projectSettings.allowContributorsAddTasks ? "✅ Yes" : "❌ No"}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Project Settings Section Component
function ProjectSettingsSection() {
  const { projectSettings, updateProjectSettings } = useTask()
  const [isUpdating, setIsUpdating] = useState(false)
  const [localSettings, setLocalSettings] = useState({
    allowMultipleClaims: projectSettings.allowMultipleClaims,
    allowMultipleContributors: projectSettings.allowMultipleContributors,
    allowContributorsAddNames: projectSettings.allowContributorsAddNames,
    allowContributorsAddTasks: projectSettings.allowContributorsAddTasks,
  })

  // Update local settings when project settings change
  useEffect(() => {
    setLocalSettings({
      allowMultipleClaims: projectSettings.allowMultipleClaims,
      allowMultipleContributors: projectSettings.allowMultipleContributors,
      allowContributorsAddNames: projectSettings.allowContributorsAddNames,
      allowContributorsAddTasks: projectSettings.allowContributorsAddTasks,
    })
  }, [projectSettings])

  const handleSettingChange = async (setting: string, value: boolean) => {
    setIsUpdating(true)
    try {
      const newSettings = { ...localSettings, [setting]: value }
      setLocalSettings(newSettings)
      await updateProjectSettings({ [setting]: value })
    } catch (error) {
      console.error('Failed to update setting:', error)
      // Revert local state on error
      setLocalSettings({
        allowMultipleClaims: projectSettings.allowMultipleClaims,
        allowMultipleContributors: projectSettings.allowMultipleContributors,
        allowContributorsAddNames: projectSettings.allowContributorsAddNames,
        allowContributorsAddTasks: projectSettings.allowContributorsAddTasks,
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="card-beautiful p-8">
      <div className="flex items-center gap-3 mb-6">
        <svg className="section-icon text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h2 className="header-section mb-0">Project Settings</h2>
      </div>

      <p className="text-lg text-gray-700 mb-8">
        Control how contributors can interact with your project.
      </p>

      <div className="space-y-6">
        {/* Multiple Claims Setting */}
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            checked={localSettings.allowMultipleClaims}
            onChange={(e) => handleSettingChange('allowMultipleClaims', e.target.checked)}
            disabled={isUpdating}
            className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <div>
            <label className="text-base font-medium text-gray-900">
              👥 Let people claim multiple tasks
            </label>
            <p className="text-sm text-gray-600">One person can take several different tasks</p>
          </div>
        </div>

        {/* Multiple Contributors Setting */}
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            checked={localSettings.allowMultipleContributors}
            onChange={(e) => handleSettingChange('allowMultipleContributors', e.target.checked)}
            disabled={isUpdating}
            className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <div>
            <label className="text-base font-medium text-gray-900">
              🤝 Allow team tasks (multiple people per task)
            </label>
            <p className="text-sm text-gray-600">Multiple people can work together on one task</p>
          </div>
        </div>

        {/* Allow Contributors to Add Names Setting */}
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            checked={localSettings.allowContributorsAddNames}
            onChange={(e) => handleSettingChange('allowContributorsAddNames', e.target.checked)}
            disabled={isUpdating}
            className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <div>
            <label className="text-base font-medium text-gray-900">
              ✏️ Allow people to add their names when claiming tasks
            </label>
            <p className="text-sm text-gray-600">Contributors can enter their names when claiming tasks</p>
          </div>
        </div>

        {/* Allow Contributors to Add Tasks Setting */}
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            checked={localSettings.allowContributorsAddTasks}
            onChange={(e) => handleSettingChange('allowContributorsAddTasks', e.target.checked)}
            disabled={isUpdating}
            className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <div>
            <label className="text-base font-medium text-gray-900">
              ➕ Allow people to add new tasks
            </label>
            <p className="text-sm text-gray-600">Contributors can create additional tasks for the project</p>
          </div>
        </div>
      </div>

      {isUpdating && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <p className="text-blue-800 font-medium">Updating settings...</p>
          </div>
        </div>
      )}
    </div>
  )
}