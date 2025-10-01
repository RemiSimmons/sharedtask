"use client"

import { SessionProvider } from "next-auth/react"

export function AuthProvider({ children }: { children: React.ReactNode }) {
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





