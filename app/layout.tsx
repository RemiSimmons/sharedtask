import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/providers'
import QueryProvider from '@/components/query-provider'
import { performanceMonitor } from '@/lib/performance-monitor'
import './globals.css'

export const metadata: Metadata = {
  title: 'SharedTask - Collaborative Task Management',
  description: 'Manage and collaborate on tasks efficiently with SharedTask',
  generator: 'SharedTask',
  // Optimize font loading
  other: {
    'font-display': 'swap',
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <QueryProvider>
          <AuthProvider>
            {/* Main Content */}
            <main>
              {children}
            </main>
          </AuthProvider>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  )
}
