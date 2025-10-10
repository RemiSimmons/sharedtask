"use client"

import React from "react"
import { useParams } from "next/navigation"
import TaskTable from "@/components/task-table"
import TaskClaimForm from "@/components/task-claim-form"
import AddTaskButton from "@/components/add-task-button"
import { TaskProvider, useTask } from "@/contexts/TaskContextWithSupabase"
import { LoadingErrorWrapper } from "@/components/loading-error-wrapper"
import { PoweredByFooter } from "@/components/powered-by-footer"
import { useFeatureFlags } from "@/hooks/use-subscription"

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
  const { projectSettings } = useTask()
  const { featureFlags } = useFeatureFlags()

  return (
    <LoadingErrorWrapper>
      <div className="min-h-screen p-4 md:p-8">
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
                  src="/shared-task-logo.svg" 
                  alt="SharedTask Logo" 
                  className="h-24 md:h-20 w-auto"
                />
              </a>
              <h1 className="text-4xl md:text-4xl font-bold text-gray-900 px-3 leading-tight">
                {projectSettings.projectName || "SharedTask Project"}
              </h1>
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
                            <div className="text-center md:text-left md:ml-8">
                              <span className="text-xl md:text-base text-green-800 break-words">{projectSettings.eventLocation}</span>
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
                              <span className="text-xl md:text-base text-green-800 break-words">{projectSettings.eventTime}</span>
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
                    </div>
                  </div>
                </div>
              </div>
            )}
            {!projectSettings.projectDescription && (
              <p className="text-2xl md:text-xl text-gray-700 max-w-2xl mx-auto font-medium leading-relaxed px-4">
                Pick a task and help out!
              </p>
            )}
          </div>

          {/* Task Claim Form */}
          <TaskClaimForm />

          {/* Task Table */}
          <TaskTable />

          {/* Add Task Button (Owner Only) */}
          <div className="max-w-2xl mx-auto px-3">
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
                  Make your own task list for family events
                </p>
                <a 
                  href="/"
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
    </LoadingErrorWrapper>
  )
}

