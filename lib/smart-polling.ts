// Smart Polling Hook for Performance Optimization
import { useEffect, useRef, useCallback, useState } from 'react'

interface SmartPollingOptions {
  onPoll: () => Promise<void>
  baseInterval: number // Base polling interval in ms
  maxInterval: number // Maximum interval in ms
  backoffMultiplier: number // How much to increase interval on each poll
  resetOnActivity: boolean // Reset to base interval on user activity
  enabled: boolean // Whether polling is enabled
}

export function useSmartPolling({
  onPoll,
  baseInterval = 5000, // Start at 5 seconds
  maxInterval = 60000, // Max 1 minute
  backoffMultiplier = 1.5,
  resetOnActivity = true,
  enabled = true
}: SmartPollingOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const currentIntervalRef = useRef(baseInterval)
  const lastActivityRef = useRef(Date.now())
  const isPollingRef = useRef(false)

  // Reset interval to base on user activity
  const resetInterval = useCallback(() => {
    currentIntervalRef.current = baseInterval
    lastActivityRef.current = Date.now()
  }, [baseInterval])

  // Track user activity
  useEffect(() => {
    if (!resetOnActivity) return

    const activities = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const handleActivity = () => {
      const now = Date.now()
      const timeSinceLastActivity = now - lastActivityRef.current
      
      // Only reset if it's been more than 1 second since last activity
      if (timeSinceLastActivity > 1000) {
        resetInterval()
      }
    }

    activities.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      activities.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }, [resetInterval, resetOnActivity])

  // Smart polling logic
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    const scheduleNextPoll = () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current)
      }

      intervalRef.current = setTimeout(async () => {
        if (isPollingRef.current) return // Prevent overlapping polls

        try {
          isPollingRef.current = true
          await onPoll()
          
          // Successful poll - increase interval (exponential backoff)
          currentIntervalRef.current = Math.min(
            currentIntervalRef.current * backoffMultiplier,
            maxInterval
          )
        } catch (error) {
          console.warn('Polling error:', error)
          // On error, reset to base interval for faster recovery
          currentIntervalRef.current = baseInterval
        } finally {
          isPollingRef.current = false
          scheduleNextPoll() // Schedule next poll
        }
      }, currentIntervalRef.current)
    }

    // Start polling
    scheduleNextPoll()

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, onPoll, baseInterval, maxInterval, backoffMultiplier])

  // Return current polling state
  return {
    currentInterval: currentIntervalRef.current,
    isPolling: isPollingRef.current,
    resetInterval
  }
}

// Page Visibility API for pausing polling when tab is not active
export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return isVisible
}

// Combined hook for smart, visibility-aware polling
export function useOptimizedPolling(
  onPoll: () => Promise<void>,
  options: Partial<SmartPollingOptions> = {}
) {
  const isVisible = usePageVisibility()
  
  const smartPolling = useSmartPolling({
    onPoll,
    baseInterval: 10000, // Start at 10 seconds (much better than 3!)
    maxInterval: 120000, // Max 2 minutes
    backoffMultiplier: 1.3,
    resetOnActivity: true,
    enabled: isVisible, // Only poll when page is visible
    ...options
  })

  return smartPolling
}
