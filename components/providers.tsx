"use client"

import { SessionProvider } from "next-auth/react"
import { useEffect } from "react"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Suppress non-critical auth fetch errors in console
  useEffect(() => {
    if (typeof window === 'undefined') return

    const originalError = console.error
    const errorHandler = (...args: any[]) => {
      // Check if this is a ClientFetchError from authjs
      const firstArg = args[0]
      const errorStr = typeof firstArg === 'string' 
        ? firstArg 
        : firstArg?.message || firstArg?.toString() || ''
      
      // Filter out non-critical auth fetch errors
      if (
        errorStr.includes('ClientFetchError') ||
        (errorStr.includes('Failed to fetch') && errorStr.includes('authjs'))
      ) {
        // Only show as warning in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Auth session fetch failed (non-critical, usually network-related)')
        }
        return
      }
      
      // Pass through all other errors
      originalError.apply(console, args)
    }

    console.error = errorHandler

    return () => {
      console.error = originalError
    }
  }, [])

  return (
    <SessionProvider
      // Balanced session management - allow initial session check but reduce polling
      refetchInterval={5 * 60} // 5 minutes instead of 30 seconds default
      refetchOnWindowFocus={false} // Don't refetch on window focus to prevent excessive requests
    >
      {children}
    </SessionProvider>
  )
}





