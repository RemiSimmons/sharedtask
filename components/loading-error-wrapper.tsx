"use client"

import React from "react"
import { useTask } from "@/contexts/TaskContextWithSupabase"

interface LoadingErrorWrapperProps {
  children: React.ReactNode
}

export function LoadingErrorWrapper({ children }: LoadingErrorWrapperProps) {
  const { loading, error, refreshTasks } = useTask()
  if (loading) {
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
                <h2 className="text-2xl font-semibold text-gray-900">Loading Tasks</h2>
                <p className="text-lg text-gray-600">
                  Connecting to database and loading your project...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="card-beautiful p-12">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="text-center space-y-4 max-w-2xl">
                <h2 className="text-2xl font-semibold text-gray-900">Database Connection Error</h2>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-base text-red-700">{error}</p>
                </div>
                <div className="space-y-3">
                  <p className="text-lg text-gray-600">Make sure you have:</p>
                  <ul className="text-left text-base text-gray-600 space-y-2">
                    <li>• Set up your Supabase project and database tables</li>
                    <li>• Added your Supabase URL and API key to .env.local</li>
                    <li>• Run the database schema SQL in your Supabase dashboard</li>
                  </ul>
                </div>
                <button 
                  onClick={refreshTasks}
                  className="btn-primary flex items-center gap-2 mx-auto"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Retry Connection
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
