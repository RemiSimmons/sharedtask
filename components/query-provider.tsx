"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Balanced approach - enable essential features, disable aggressive polling
        staleTime: 5 * 60 * 1000, // 5 minutes - reasonable staleness
        gcTime: 10 * 60 * 1000, // 10 minutes cache
        retry: 1, // Retry once on failure (for network hiccups)
        refetchOnWindowFocus: false, // Keep disabled - prevents excessive requests
        refetchOnMount: true, // Re-enable - users expect fresh data on navigation
        refetchOnReconnect: true, // Re-enable - good UX when connection restored
        refetchInterval: false, // Keep disabled - no automatic intervals
        refetchIntervalInBackground: false, // Keep disabled
      },
      mutations: {
        retry: 1, // Retry mutations once
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Re-enabled: DevTools useful for development debugging */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
