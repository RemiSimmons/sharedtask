"use client"

import React from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import TaskTable from "@/components/task-table"
import TaskClaimForm from "@/components/task-claim-form"
import AddTaskButton from "@/components/add-task-button"
import { TaskProvider, useTask } from "@/contexts/TaskContextWithSupabase"
import { LoadingErrorWrapper } from "@/components/loading-error-wrapper"
import { PoweredByFooter } from "@/components/powered-by-footer"
import { useFeatureFlags } from "@/hooks/use-subscription"
import { Button } from "@/components/ui/button"
import { RealtimeIndicator } from "@/components/realtime-indicator"
import { CalendarExportButton } from "@/components/calendar-export-button"
import { ClickableLocation } from "@/components/clickable-location"
import { ShareProjectButton } from "@/components/share-project-button"
import { MobileNav } from "@/components/mobile-nav"
import { HeadcountDisplay } from "@/components/headcount-display"

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.id as string

  return (
    <TaskProvider projectId={projectId}>
      <ProjectContent />
    </TaskProvider>
  )
}

function ProjectContent() {
  const { projectSettings, currentProject, realtimeConnected, lastRealtimeUpdate } = useTask()
  const { featureFlags } = useFeatureFlags()
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  
  // Check if current user is the project owner
  const isOwner = session?.user?.id && currentProject?.user_id === session.user.id
  
  const goToHostDashboard = () => {
    router.push(`/admin/project/${projectId}`)
  }

  // Format event time for display
  const formatEventTime = (isoString: string) => {
    try {
      // Validate the date string before creating Date object
      if (!isoString || isoString === 'null' || isoString === 'undefined') {
        return 'Date not set'
      }
      
      const date = new Date(isoString)
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Date not set'
      }
      
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }
      return date.toLocaleString('en-US', options)
    } catch (error) {
      return 'Date not set'
    }
  }

  // Split location into two lines for mobile display (street on line 1, city/state/zip on line 2)
  const splitLocationForMobile = (location: string) => {
    // Try to find the last comma before state/zip (typically after city)
    const parts = location.split(',').map(p => p.trim())
    
    if (parts.length >= 2) {
      // If we have at least 2 parts, put the last 2 parts (city, state zip) on second line
      const streetAddress = parts.slice(0, -2).join(', ')
      const cityStateZip = parts.slice(-2).join(', ')
      return { line1: streetAddress, line2: cityStateZip }
    } else if (parts.length === 1) {
      // Single part address, keep it on one line
      return { line1: '', line2: location }
    }
    
    // Default: split at first comma
    return { line1: parts[0], line2: parts.slice(1).join(', ') }
  }

  return (
    <LoadingErrorWrapper>
      {/* Mobile Navigation */}
      <MobileNav showHomeLink={true} />
      
      <div className="min-h-screen p-4 md:p-8 pt-20 md:pt-8">
        <div className="max-w-6xl mx-auto space-y-10 md:space-y-12">
          {/* Header */}
          <div className="text-center space-y-6 md:space-y-6">
            <div className="flex flex-col items-center gap-5 md:gap-4">
              <a 
                href="https://sharedtask.ai" 
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                title="Visit SharedTask.ai homepage"
              >
                <img 
                  src="/logo.png" 
                  alt="SharedTask Logo" 
                  className="h-48 md:h-40 w-auto"
                />
              </a>
              <div className="space-y-3 w-full px-3">
                <h1 className="text-4xl md:text-4xl font-bold text-gray-900 leading-tight">
                  {projectSettings.projectName || "SharedTask Project"}
                </h1>
                
                {/* Action Buttons Container */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-3">
                  {/* Share Project Button - Prominent for all users */}
                  <ShareProjectButton
                    projectId={projectId}
                    projectName={projectSettings.projectName}
                    className="w-full md:w-auto text-lg md:text-sm px-6 py-5 md:px-4 md:py-2 h-auto font-semibold md:font-medium bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all min-h-[60px] md:min-h-0"
                  />
                  
                  {/* Host Dashboard Button - Only visible to owner */}
                  {isOwner && (
                    <Button
                      onClick={goToHostDashboard}
                      className="w-full md:w-auto text-lg md:text-sm px-6 py-5 md:px-4 md:py-2 h-auto font-semibold md:font-medium bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all min-h-[60px] md:min-h-0"
                    >
                      <svg className="w-5 h-5 md:w-4 md:h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Host Dashboard
                    </Button>
                  )}
                </div>
              </div>
            </div>
            {projectSettings.projectDescription && (
              <div className="max-w-3xl mx-auto px-2">
                <div className="bg-blue-50 border-2 md:border border-blue-200 rounded-lg p-6 md:p-6 mb-4">
                  <div className="flex items-start gap-4 md:gap-3">
                    <svg className="w-8 h-8 md:w-6 md:h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h3 className="text-2xl md:text-lg font-bold md:font-semibold text-blue-900 mb-3 md:mb-2">About This Project</h3>
                      <p className="text-xl md:text-base text-blue-800 leading-relaxed">
                        {projectSettings.projectDescription}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Event Details */}
            {(projectSettings.eventLocation || projectSettings.eventTime || projectSettings.eventAttire) && (
              <div className="max-w-3xl mx-auto px-2">
                <div className="bg-green-50 border-2 md:border border-green-200 rounded-lg p-6 md:p-6 mb-4">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-3">
                    <svg className="w-10 h-10 md:w-6 md:h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div className="space-y-3 text-center md:text-left w-full">
                      <h3 className="text-2xl md:text-lg font-bold md:font-semibold text-green-900 mb-3 md:mb-2">Event Details</h3>
                      <div className="space-y-3">
                        {projectSettings.eventLocation && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-center md:justify-start gap-2">
                              <span className="text-lg">📍</span>
                              <span className="text-xl md:text-base text-green-800 font-medium">Location:</span>
                            </div>
                            {/* Mobile: Two-line address layout */}
                            <div className="block md:hidden text-center">
                              {(() => {
                                const { line1, line2 } = splitLocationForMobile(projectSettings.eventLocation)
                                return (
                                  <button
                                    onClick={() => {
                                      const mapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(projectSettings.eventLocation || '')}`
                                      window.open(mapsUrl, '_blank', 'noopener,noreferrer')
                                    }}
                                    className="text-xl text-blue-600 hover:text-blue-800 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-sm"
                                    title={`View ${projectSettings.eventLocation || ''} on Google Maps`}
                                  >
                                    {line1 && <div className="text-green-800">{line1}</div>}
                                    <div className="text-green-800 flex items-center justify-center gap-1">
                                      <svg className="w-4 h-4 inline flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      <span>{line2}</span>
                                      <svg className="w-3 h-3 inline flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    </div>
                                  </button>
                                )
                              })()}
                            </div>
                            {/* Desktop: Single-line ClickableLocation */}
                            <div className="hidden md:block text-left md:ml-8">
                              <ClickableLocation 
                                location={projectSettings.eventLocation}
                                className="text-base text-green-800 break-words"
                              />
                            </div>
                          </div>
                        )}
                        {projectSettings.eventTime && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-center md:justify-start gap-2">
                              <span className="text-lg">⏰</span>
                              <span className="text-xl md:text-base text-green-800 font-medium">Time:</span>
                            </div>
                            <div className="text-center md:text-left md:ml-8">
                              <span className="text-xl md:text-base text-green-800 break-words">{formatEventTime(projectSettings.eventTime)}</span>
                            </div>
                          </div>
                        )}
                        {projectSettings.eventAttire && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-center md:justify-start gap-2">
                              <span className="text-lg">📝</span>
                              <span className="text-xl md:text-base text-green-800 font-medium">Additional Details:</span>
                            </div>
                            <div className="text-center md:text-left md:ml-8">
                              <span className="text-xl md:text-base text-green-800 break-words">{projectSettings.eventAttire}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Calendar Export Button */}
                      {projectSettings.eventTime && (
                        <div className="mt-4 flex justify-center md:justify-start">
                          <CalendarExportButton
                            taskTitle={projectSettings.projectName || "Event"}
                            taskDescription={projectSettings.projectDescription || undefined}
                            eventDateTime={projectSettings.eventTime}
                            eventLocation={projectSettings.eventLocation || undefined}
                            projectName={projectSettings.projectName || "Event"}
                            className="text-base"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Headcount Display */}
            <div className="max-w-3xl mx-auto px-2">
              <HeadcountDisplay />
            </div>

            {!projectSettings.projectDescription && (
              <p className="text-2xl md:text-xl text-gray-700 max-w-2xl mx-auto font-medium leading-relaxed px-4">
                Choose what you'd like to bring
              </p>
            )}
          </div>

          {/* Task Claim Form */}
          <TaskClaimForm />

          {/* Task Table */}
          <TaskTable />

          {/* Add Task Button (Owner Only) */}
          <div className="max-w-2xl mx-auto px-3 flex justify-center">
            <AddTaskButton />
          </div>

          {/* Become a Host Section */}
          <div className="max-w-2xl mx-auto px-3">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 md:border border-blue-200 rounded-lg p-7 md:p-6">
              <div className="text-center">
                <div className="flex justify-center mb-5 md:mb-4">
                  <div className="w-16 h-16 md:w-12 md:h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl md:text-lg font-bold md:font-semibold text-gray-900 mb-3 md:mb-2">Want to create your own project?</h3>
                <p className="text-xl md:text-base text-gray-700 md:text-gray-600 mb-6 md:mb-4 leading-relaxed">
                  Create your own project
                </p>
                <a 
                  href="https://sharedtask.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-5 md:px-6 md:py-3 rounded-lg font-semibold md:font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg text-xl md:text-base min-h-[60px] md:min-h-0"
                >
                  <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Create Your Own Project
                </a>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="text-center border-t border-gray-200 pt-8 px-4">
            <p className="text-lg md:text-base text-gray-600 md:text-gray-500 leading-relaxed">
              All updates save automatically
            </p>
          </div>
        </div>
      </div>
      
      {/* Powered by SharedTask Footer - Only show if user can't remove branding */}
      <PoweredByFooter show={!featureFlags?.canRemoveBranding} />
      
      {/* Realtime connection indicator */}
      <RealtimeIndicator isConnected={realtimeConnected} lastUpdate={lastRealtimeUpdate} />
    </LoadingErrorWrapper>
  )
}

