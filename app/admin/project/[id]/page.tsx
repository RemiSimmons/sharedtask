"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useCustomAlert } from "@/components/ui/custom-toast"
import TaskTable from "@/components/task-table"
import DangerZone from "@/components/danger-zone"
import { EventDetailsSection } from "@/components/event-details-section"
import { TaskProvider } from "@/contexts/TaskContextWithSupabase"
import { useTask } from "@/contexts/TaskContextWithSupabase"
import Link from "next/link"
import { ShareProjectButton } from "@/components/share-project-button"
import { MobileNav } from "@/components/mobile-nav"

export default function AdminProjectPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const { alert } = useCustomAlert()

  // Handle unauthenticated redirect in useEffect to avoid state update during render
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/auth/signin')
    }
  }, [status, router])

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
    return null
  }

  return (
    <TaskProvider projectId={projectId}>
      <AdminProjectContent 
        projectId={projectId}
        copyContributorLink={copyContributorLink}
        handleSignOut={handleSignOut}
        session={session}
      />
    </TaskProvider>
  )
}

// Main content component with access to TaskContext
function AdminProjectContent({
  projectId,
  copyContributorLink,
  handleSignOut,
  session
}: {
  projectId: string
  copyContributorLink: () => void
  handleSignOut: () => void
  session: any
}) {
  const { projectSettings } = useTask()

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Mobile Navigation - Only shows on mobile */}
        <MobileNav showHomeLink={true} />
        
        {/* Clean Header with Shared Task logo and user actions - Desktop */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              {/* Left side - Logo and Back Button */}
              <div className="flex items-center gap-4">
                <Link href="/admin" className="flex items-center hover:opacity-80 transition-opacity">
                  <img 
                    src="/logo.png" 
                    alt="SharedTask Logo" 
                    className="h-20 w-auto"
                  />
                </Link>
                
                {/* Back Button */}
                <Link 
                  href="/admin"
                  className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg font-medium transition-colors border border-blue-200 min-h-[44px]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">Back to Dashboard</span>
                  <span className="sm:hidden">Back</span>
                </Link>
              </div>

              {/* Right side - User info and actions - Desktop Only */}
              <div className="hidden md:flex items-center gap-4">
                {session?.user && (
                  <>
                    {/* User greeting */}
                    <div className="hidden lg:block text-gray-600">
                      <span className="text-sm">
                        Hello, <span className="font-medium">{session.user.name || session.user.email}</span>
                      </span>
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex items-center gap-3">
                      {/* Account button */}
                      <Link 
                        href="/account" 
                        className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors border border-gray-200 min-h-[44px]"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="hidden sm:inline">Account</span>
                      </Link>

                      {/* Sign out button */}
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 text-gray-600 hover:text-red-600 px-3 py-2 rounded-lg font-medium transition-colors min-h-[44px]"
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

        <div className="p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-12">
            {/* Project Header and Actions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <ProjectHeader projectId={projectId} />
              
              <div className="flex items-center gap-3 flex-wrap">
                <ShareProjectButton
                  projectId={projectId}
                  projectName={projectSettings.projectName}
                  shareMessage={projectSettings.shareMessage || undefined}
                  className="btn-accent flex items-center gap-2 min-h-[44px]"
                />
                <button
                  onClick={() => window.open(`/project/${projectId}`, '_blank')}
                  className="btn-secondary flex items-center gap-2 min-h-[44px]"
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
    // For new/empty projects (0-2 tasks): Show Add Tasks & Guests first, then Active Tasks
    return (
      <div className="space-y-8">
        {/* Add Tasks & Guests Section */}
        <BulkAddSection />

        {/* Task Management - Secondary for new projects */}
        <div className="card-beautiful p-8">
          <div className="flex items-center gap-3 mb-6">
            <svg className="section-icon text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h2 className="header-section mb-0">{projectSettings.taskLabel || "Active Tasks"}</h2>
          </div>
          <TaskTable isAdminView={true} />
        </div>

        {/* Project Actions Section */}
        <ProjectActions 
          projectId={projectId}
          copyContributorLink={copyContributorLink}
        />

        {/* Event Details Section */}
        <div className="max-w-2xl">
          <EventDetailsSection />
        </div>

        {/* Project Settings - Moved here */}
        <div className="max-w-2xl">
          <ProjectSettingsSection />
        </div>
      </div>
    )
  } else {
    // For established projects (3+ tasks): Show Active Tasks first, then Add Tasks & Guests
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
          <TaskTable isAdminView={true} />
        </div>

        {/* Add Tasks & Guests Section */}
        <BulkAddSection />

        {/* Project Actions Section */}
        <ProjectActions 
          projectId={projectId}
          copyContributorLink={copyContributorLink}
        />

        {/* Event Details Section */}
        <div className="max-w-2xl">
          <EventDetailsSection />
        </div>

        {/* Project Settings - Moved here */}
        <div className="max-w-2xl">
          <ProjectSettingsSection />
        </div>
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
  const hasContent = taskCount > 0 || contributorCount > 0  // Allow tasks or contributors (description requires tasks)

  return (
    <div className="card-beautiful p-6 md:p-8">
      <div className="mb-6">
        <h2 className="header-section mb-0">Add Tasks & Guests</h2>
      </div>

      <p className="text-lg md:text-lg text-gray-700 mb-6">
        Add tasks and guests now, or leave blank and let guests add themselves.
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
              {lastAddedInfo.contributors > 0 && `${lastAddedInfo.contributors} guest(s)`}!
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6 mb-8">
        {/* Tasks Input - Primary position */}
        <div>
          <label htmlFor="bulk-tasks" className="block text-xl md:text-xl font-semibold text-gray-900 mb-3">
            Add Task (Optional)
          </label>
          <textarea
            id="bulk-tasks"
            value={bulkTasks}
            onChange={(e) => setBulkTasks(e.target.value)}
            className="form-input h-32 md:h-40 resize-none text-base"
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
          <label htmlFor="bulk-contributors-main" className="block text-lg md:text-lg font-semibold text-gray-900 mb-2">
            Add Guests (Optional)
          </label>
          <input
            id="bulk-contributors-main"
            type="text"
            value={bulkContributors}
            onChange={(e) => setBulkContributors(e.target.value)}
            className="form-input text-base"
            placeholder="Enter expected guest names (separated by commas)"
            disabled={isAdding}
          />
          {contributorCount > 0 && (
            <p className="text-sm text-blue-600 mt-1">{contributorCount} guest{contributorCount !== 1 ? 's' : ''} for reference</p>
          )}
          <p className="text-xs md:text-xs text-gray-600 mt-1">
            Optional: Add expected guests for planning. People can also enter their names when claiming tasks.
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
            placeholder="Add any additional details or instructions for all tasks above..."
            disabled={isAdding}
          />
          <p className="text-xs text-gray-600 mt-1">
            These details will be added to all tasks entered above
          </p>
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
              return `Add ${taskCount} Task${taskCount !== 1 ? 's' : ''} & ${contributorCount} Guest${contributorCount !== 1 ? 's' : ''}`
            } else if (taskCount > 0) {
              return `Add ${taskCount} Task${taskCount !== 1 ? 's' : ''}`
            } else {
              return `Add ${contributorCount} Guest${contributorCount !== 1 ? 's' : ''}`
            }
          })()
        ) : (
          'Enter tasks or guests above to get started'
        )}
      </button>

      <p className="text-sm text-gray-600 mt-4 text-center">
        This bulk setup saves time, but you can always add details per task or modify them later.
      </p>

      {/* Active Guests Display */}
      {activeContributors.length > 0 && (
        <div className="mt-8 p-4 md:p-6 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h4 className="text-lg font-semibold text-green-800">👥 Active Guests ({activeContributors.length})</h4>
          </div>
          {/* Scrollable container for mobile */}
          <div 
            className="max-h-[60vh] md:max-h-[400px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-green-300 scrollbar-track-green-100"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y'
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pr-2">
              {activeContributors.map((contributor) => (
                <div 
                  key={contributor} 
                  className="flex items-center justify-between bg-white rounded-lg p-4 md:p-3 shadow-sm hover:shadow-md transition-shadow min-h-[60px] md:min-h-0"
                  style={{ touchAction: 'manipulation' }}
                >
                  <span className="text-gray-900 font-medium text-base md:text-sm break-words pr-2 flex-1">{contributor}</span>
                  <span className="text-green-600 text-sm font-semibold whitespace-nowrap ml-2">
                    {tasks.filter(t => t.claimedBy?.includes(contributor)).length} task{tasks.filter(t => t.claimedBy?.includes(contributor)).length !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-green-700 text-xs md:text-sm mt-4">
            {activeContributors.length > 3 && (
              <span className="block text-green-600 font-medium mb-2">
                ↕️ Scroll to see all guests
              </span>
            )}
            Guests who have claimed tasks will appear here
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
        {/* Share Link Section - More Prominent */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-lg border-2 border-green-200">
          <label className="block text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Your Shareable Link
          </label>
          <div className="flex gap-3 items-center">
            <input
              type="text"
              value={`${window.location.origin}/project/${projectId}`}
              readOnly
              className="form-input flex-1 text-base bg-white font-mono text-gray-800 border-2 border-green-300 focus:border-green-500 focus:ring-green-500 select-all"
              onClick={(e) => e.currentTarget.select()}
            />
            <button
              onClick={copyContributorLink}
              className="btn-primary px-6 py-3 text-base font-semibold bg-green-600 hover:bg-green-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Link
            </button>
          </div>
          <p className="text-green-800 font-medium text-sm mt-3 flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Share this link with guests — they can claim tasks without signing up!</span>
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
            Open Guest View
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
  const { tasks, projectSettings, loading, getContributorHeadcounts, getTotalHeadcount } = useTask()

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
  
  // Get unique contributors from headcount (includes attending-only guests)
  const contributorHeadcounts = getContributorHeadcounts()
  const contributors = Array.from(contributorHeadcounts.keys())
  const totalPeopleAttending = getTotalHeadcount()
  
  const totalComments = tasks.reduce((sum, task) => sum + task.comments.length, 0)

  return (
    <div className="card-beautiful p-8">
      <div className="flex items-center gap-3 mb-6">
        <svg className="section-icon text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h2 className="header-section mb-0">Project Overview</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-200">
        {/* Total People Attending */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{totalPeopleAttending}</div>
          <div className="text-sm text-gray-600">Expected Attendees</div>
          {contributors.length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              {contributors.length} guest{contributors.length !== 1 ? 's' : ''}
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
            <div>Multiple Guests: {projectSettings.allowMultipleContributors ? "✅ Yes" : "❌ No"}</div>
            <div>Guests Add Names: {projectSettings.allowContributorsAddNames ? "✅ Yes" : "❌ No"}</div>
            <div>Guests Add Tasks: {projectSettings.allowContributorsAddTasks ? "✅ Yes" : "❌ No"}</div>
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
        Manage your project details and guest permissions.
      </p>

      {/* Project Details Section */}
      <div className="space-y-6 mb-8 pb-8 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
        
        {/* Project Name */}
        <div>
          <label htmlFor="project-name-setting" className="block text-base font-medium text-gray-900 mb-2">
            📋 Project Name
          </label>
          <input
            id="project-name-setting"
            type="text"
            value={projectSettings.projectName}
            onChange={(e) => updateProjectSettings({ projectName: e.target.value })}
            placeholder="e.g., Smith Family Potluck"
            maxLength={50}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-sm text-gray-600 mt-1">
            {projectSettings.projectName.length}/50 characters
          </p>
        </div>

        {/* Task Label */}
        <div>
          <label htmlFor="task-label-setting" className="block text-base font-medium text-gray-900 mb-2">
            🏷️ Task Label
          </label>
          <input
            id="task-label-setting"
            type="text"
            value={projectSettings.taskLabel}
            onChange={(e) => updateProjectSettings({ taskLabel: e.target.value })}
            placeholder="e.g., Food Dishes, Volunteer Roles, Equipment"
            maxLength={30}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-sm text-gray-600 mt-1">
            {projectSettings.taskLabel.length}/30 characters - This replaces "Task Name" in your table
          </p>
        </div>

        {/* Project Description */}
        <div>
          <label htmlFor="project-description-setting" className="block text-base font-medium text-gray-900 mb-2">
            📝 Project Description <span className="text-sm font-normal text-gray-600">(Optional)</span>
          </label>
          <textarea
            id="project-description-setting"
            value={projectSettings.projectDescription || ""}
            onChange={(e) => updateProjectSettings({ projectDescription: e.target.value.trim() === "" ? null : e.target.value })}
            placeholder="Describe your project for guests..."
            rows={3}
            maxLength={500}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            style={{ touchAction: 'manipulation', userSelect: 'text', WebkitUserSelect: 'text' }}
            autoComplete="off"
            autoCorrect="on"
            autoCapitalize="sentences"
            spellCheck="true"
          />
          <p className="text-sm text-gray-600 mt-1">
            {(projectSettings.projectDescription || "").length}/500 characters - This description will be shown to guests under the project title
          </p>
        </div>

        {/* Share Message */}
        <div>
          <label htmlFor="share-message-setting" className="block text-base font-medium text-gray-900 mb-2">
            💬 Share Message <span className="text-sm font-normal text-gray-600">(Optional)</span>
          </label>
          <textarea
            id="share-message-setting"
            value={projectSettings.shareMessage || ""}
            onChange={(e) => updateProjectSettings({ shareMessage: e.target.value || undefined })}
            placeholder="Help contribute to our event! Claim a task here:"
            rows={2}
            maxLength={200}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            style={{ touchAction: 'manipulation', userSelect: 'text', WebkitUserSelect: 'text' }}
            autoComplete="off"
            autoCorrect="on"
            autoCapitalize="sentences"
            spellCheck="true"
          />
          <p className="text-sm text-gray-600 mt-1">
            {(projectSettings.shareMessage || "").length}/200 characters - This message appears when you share the project link
          </p>
        </div>
      </div>

      {/* Permission Settings Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Permission Settings</h3>
        <p className="text-sm text-gray-600 mb-6">
          Control how guests can interact with your project
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

        {/* Multiple Guests Setting */}
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

        {/* Allow Guests to Add Names Setting */}
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
            <p className="text-sm text-gray-600">Guests can enter their names when claiming tasks</p>
          </div>
        </div>

        {/* Allow Guests to Add Tasks Setting */}
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
            <p className="text-sm text-gray-600">Guests can create additional tasks for the project</p>
          </div>
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