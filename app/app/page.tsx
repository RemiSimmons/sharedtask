import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

function CheckoutSuccess() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to SharedTask!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Your subscription has been successfully activated. You can now create unlimited projects and collaborate with your team.
        </p>
        
        <div className="space-y-3">
          <a
            href="/admin"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 inline-block"
          >
            Go to Dashboard
          </a>
          
          <a
            href="/pricing"
            className="w-full text-gray-600 hover:text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200 inline-block border border-gray-200 hover:border-gray-300"
          >
            View Pricing Plans
          </a>
        </div>
      </div>
    </div>
  )
}

export default async function AppPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const session = await auth()
  const resolvedSearchParams = await searchParams
  
  // If checkout success, show success message
  if (resolvedSearchParams.checkout === 'success') {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <CheckoutSuccess />
      </Suspense>
    )
  }
  
  // If user is not logged in, redirect to signin
  if (!session) {
    redirect('/auth/signin')
  }
  
  // Otherwise redirect to admin dashboard
  redirect('/admin')
}
