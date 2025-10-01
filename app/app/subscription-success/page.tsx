"use client"

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function SubscriptionSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (!sessionId) {
      router.push('/pricing')
      return
    }

    // In a real implementation, you'd verify the session and get subscription details
    // For now, we'll simulate it
    setSubscriptionInfo({
      plan: 'Pro',
      interval: 'monthly',
      amount: '$9.99',
      nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
    })
    setLoading(false)
  }, [session, status, sessionId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Confirming your subscription...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/shared-task-logo.svg" alt="SharedTask" className="h-20 w-auto" />
          </div>
          <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎉 Welcome to SharedTask {subscriptionInfo?.plan}!
          </h1>
          <p className="text-lg text-gray-600">
            Your subscription is now active. Thank you for choosing SharedTask!
          </p>
        </div>

        {/* Subscription Details Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Subscription Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">{subscriptionInfo?.plan}</div>
              <div className="text-sm text-gray-600">Plan</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{subscriptionInfo?.amount}</div>
              <div className="text-sm text-gray-600">
                {subscriptionInfo?.interval === 'yearly' ? 'Per Year' : 'Per Month'}
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg md:col-span-2">
              <div className="text-lg font-bold text-purple-600">{subscriptionInfo?.nextBilling}</div>
              <div className="text-sm text-gray-600">Next Billing Date</div>
            </div>
          </div>
        </div>

        {/* What's Included */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your {subscriptionInfo?.plan} features:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'Unlimited projects',
              'Unlimited tasks & contributors',
              'No SharedTask branding',
              'Advanced project templates',
              'Export options (CSV/PDF)',
              'Priority support',
              'Custom task labels',
              'Advanced permissions'
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => router.push('/app')}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors text-lg"
          >
            Start Using SharedTask
          </button>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push('/account/billing')}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Manage Billing
            </button>
            <button
              onClick={() => router.push('/support')}
              className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Get Support
            </button>
          </div>
        </div>

        {/* Receipt Info */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Receipt & Billing:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• A receipt has been sent to {session?.user?.email}</li>
            <li>• You can manage your subscription anytime in Account Settings</li>
            <li>• Cancel anytime - no long-term commitments</li>
            <li>• Need help? Contact our priority support team</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Questions? Contact us at <a href="mailto:support@sharedtask.com" className="text-blue-600 hover:underline">support@sharedtask.com</a></p>
        </div>
      </div>
    </div>
  )
}
