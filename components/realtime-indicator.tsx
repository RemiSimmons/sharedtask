"use client"

import React from "react"

interface RealtimeIndicatorProps {
  isConnected: boolean
  lastUpdate: Date | null
}

export function RealtimeIndicator({ isConnected, lastUpdate }: RealtimeIndicatorProps) {
  const [showUpdate, setShowUpdate] = React.useState(false)
  
  React.useEffect(() => {
    if (lastUpdate) {
      setShowUpdate(true)
      const timer = setTimeout(() => setShowUpdate(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [lastUpdate])
  
  if (!isConnected && !showUpdate) {
    return null // Hide when disconnected and no recent updates
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {showUpdate && (
        <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-sm font-medium">Updated</span>
        </div>
      )}
      {!showUpdate && isConnected && (
        <div className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2 text-xs opacity-60 hover:opacity-100 transition-opacity">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          <span>Live</span>
        </div>
      )}
    </div>
  )
}

