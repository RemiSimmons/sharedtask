import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/providers'
import QueryProvider from '@/components/query-provider'
import { ToastProvider } from '@/components/ui/custom-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'SharedTask - Free Collaborative Task Management for Teams',
  description: 'Manage tasks and collaborate with your team for free. Simple, fast task management built for small teams who need to get things done together. Built by RemiSimmons.com.',
  generator: 'SharedTask',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://sharedtask.ai/',
  },
  openGraph: {
    title: 'SharedTask - Free Team Task Management',
    description: 'Manage tasks and collaborate with your team for free. Simple and fast.',
    url: 'https://sharedtask.ai/',
    type: 'website',
    siteName: 'SharedTask',
  },
  twitter: {
    card: 'summary_large_image',
  },
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "SharedTask",
              "description": "Free collaborative task management for small teams",
              "url": "https://sharedtask.ai",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "author": {
                "@type": "Person",
                "name": "Remi Simmons",
                "url": "https://remisimmons.com"
              }
            })
          }}
        />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <QueryProvider>
          <AuthProvider>
            <ToastProvider>
              <main>
                {children}
              </main>
            </ToastProvider>
          </AuthProvider>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  )
}
