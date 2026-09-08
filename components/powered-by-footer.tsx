"use client"

import React from 'react'

interface PoweredByFooterProps {
  show: boolean
  className?: string
}

export function PoweredByFooter({ show, className = '' }: PoweredByFooterProps) {
  if (!show) return null
  
  return (
    <div className={`w-full max-w-full overflow-x-hidden text-center py-3 px-4 text-xs sm:text-sm text-gray-500 border-t bg-gray-50 ${className}`}>
      <div className="flex flex-col items-center sm:flex-row sm:justify-center sm:items-center gap-1 sm:gap-2 min-w-0 max-w-full">
        <span className="inline-flex flex-nowrap items-center justify-center gap-2 min-w-0 max-w-full">
          <span className="whitespace-nowrap">Powered by</span>
          <a 
            href="https://sharedtask.ai" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors inline-flex items-center gap-1 cursor-pointer min-w-0 min-h-0 sm:min-h-[48px] [overflow-wrap:anywhere]"
            title="Visit SharedTask.ai homepage"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            SharedTask
          </a>
        </span>
        <span className="hidden sm:inline mx-1">•</span>
        <span className="inline-flex flex-nowrap items-center justify-center gap-2 min-w-0 max-w-full">
          <span className="whitespace-nowrap">Built by</span>
          <a 
            href="https://remisimmons.com" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors cursor-pointer min-w-0 min-h-0 sm:min-h-[48px] [overflow-wrap:anywhere]"
          >
            RemiSimmons.com
          </a>
        </span>
      </div>
    </div>
  )
}

export function PoweredByFooterCompact({ show, className = '' }: PoweredByFooterProps) {
  if (!show) return null
  
  return (
    <div className={`text-center py-2 px-3 text-xs text-gray-500 border-t bg-gray-50 ${className}`}>
      <a 
        href="https://sharedtask.ai" 
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 font-medium transition-colors cursor-pointer"
        title="Visit SharedTask.ai homepage"
      >
        Powered by SharedTask
      </a>
      <span className="mx-2">•</span>
      <a 
        href="https://remisimmons.com" 
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
      >
        Built by RemiSimmons.com
      </a>
    </div>
  )
}

export function PoweredByFloating({ show, className = '' }: PoweredByFooterProps) {
  if (!show) return null
  
  return (
    <div className={`fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs text-gray-500 z-50 ${className}`}>
      <div className="flex items-center gap-2">
        <span>Powered by</span>
        <a 
          href="https://sharedtask.ai" 
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 font-medium transition-colors cursor-pointer"
          title="Visit SharedTask.ai homepage"
        >
          SharedTask
        </a>
        <span className="mx-1">•</span>
        <a 
          href="https://remisimmons.com" 
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          Built by RemiSimmons.com
        </a>
      </div>
    </div>
  )
}
