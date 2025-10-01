"use client"

import React from "react"
import { useParams } from "next/navigation"
import TaskTable from "@/components/task-table"
import TaskClaimForm from "@/components/task-claim-form"
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
      <div className="min-h-screen p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-6">
            <div className="flex flex-col items-center gap-4">
              <img 
                src="/shared-task-logo.svg" 
                alt="SharedTask Logo" 
                className="h-20 w-auto"
              />
              <h1 className="text-4xl font-bold text-gray-900">
                {projectSettings.projectName || "SharedTask Project"}
              </h1>
            </div>
            {projectSettings.projectDescription && (
              <div className="max-w-3xl mx-auto">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">About This Project</h3>
                      <p className="text-blue-800 leading-relaxed">
                        {projectSettings.projectDescription}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {!projectSettings.projectDescription && (
              <p className="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
                Collaborate on tasks and track progress with your team
              </p>
            )}
          </div>

          {/* Task Claim Form */}
          <TaskClaimForm />

          {/* Task Table */}
          <TaskTable />

          {/* Become a Host Section */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Want to host your own project?</h3>
                <p className="text-gray-600 mb-4">
                  Organize your own tasks and collaborate with your team using SharedTask
                </p>
                <a 
                  href="/"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Try Demo & Become a Host
                </a>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="text-center border-t border-gray-200 pt-8">
            <p className="text-base text-gray-500">
              Tasks are automatically saved to the database • Updates happen in real-time
            </p>
          </div>
        </div>
      </div>
      
      {/* Powered by SharedTask Footer - Only show if user can't remove branding */}
      <PoweredByFooter show={!featureFlags?.canRemoveBranding} />
    </LoadingErrorWrapper>
  )
}

