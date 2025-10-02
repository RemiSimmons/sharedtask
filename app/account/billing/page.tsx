"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useSubscription, useFeatureFlags } from '@/hooks/use-subscription'
import CancelSubscription from '@/components/cancel-subscription'

export default function BillingPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { subscriptionState, loading: subscriptionLoading, refreshSubscriptionState } = useSubscription()
  const { featureFlags, loading: featuresLoading } = useFeatureFlags()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin?callbackUrl=/account/billing')
      return
    }
  }, [session, status, router])

  const handleManageBilling = async () => {
    if (!subscriptionState?.hasActiveSubscription) {
      router.push('/pricing')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to access billing portal')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Billing portal error:', err)
      setError(err instanceof Error ? err.message : 'Failed to access billing portal')
    } finally {
      setLoading(false)
    }
  }

  const handleStartTrial = () => {
    router.push('/pricing?action=trial')
  }

  const handleUpgrade = () => {
    router.push('/pricing?action=paid')
  }

  if (status === 'loading' || subscriptionLoading || featuresLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading billing information...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-2">Manage your SharedTask subscription and billing information.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Plan */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Plan</h2>
              
              {subscriptionState?.hasActiveSubscription ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 capitalize">
                        {subscriptionState.plan} Plan
                      </h3>
                      <p className="text-gray-600 capitalize">
                        Billed {subscriptionState.interval}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <button
                      onClick={handleManageBilling}
                      disabled={loading}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Loading...' : 'Manage Billing'}
                    </button>
                    <p className="text-sm text-gray-500 mt-2">
                      Update payment method, view invoices, or cancel subscription
                    </p>
                  </div>
                </div>
              ) : subscriptionState?.hasActiveTrial ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 capitalize">
                        {subscriptionState.plan} Trial
                      </h3>
                      <p className="text-gray-600">
                        {subscriptionState.trialDaysRemaining} days remaining
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Trial
                      </span>
                    </div>
                  </div>
                  
                  {subscriptionState.trialEndsAt && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800 text-sm">
                        Your trial ends on {new Date(subscriptionState.trialEndsAt).toLocaleDateString()}.
                        Subscribe to continue using all features.
                      </p>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 pt-4">
                    <button
                      onClick={handleUpgrade}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Subscribe Now
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Free Plan</h3>
                    <p className="text-gray-600">Limited features</p>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4 space-x-3">
                    {subscriptionState?.canStartTrial && (
                      <button
                        onClick={handleStartTrial}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Start Free Trial
                      </button>
                    )}
                    <button
                      onClick={handleUpgrade}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Subscribe Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Plan Features */}
          <div className="space-y-6">
            {/* Current Features */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Features</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Projects</span>
                  <span className="text-sm font-medium text-gray-900">
                    {featureFlags?.maxProjects === -1 ? 'Unlimited' : featureFlags?.maxProjects || 1}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Advanced Templates</span>
                  <span className={`text-sm font-medium ${featureFlags?.canUseAdvancedTemplates ? 'text-green-600' : 'text-gray-400'}`}>
                    {featureFlags?.canUseAdvancedTemplates ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Data Export</span>
                  <span className={`text-sm font-medium ${featureFlags?.canExportData ? 'text-green-600' : 'text-gray-400'}`}>
                    {featureFlags?.canExportData ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Priority Support</span>
                  <span className={`text-sm font-medium ${featureFlags?.hasPrioritySupport ? 'text-green-600' : 'text-gray-400'}`}>
                    {featureFlags?.hasPrioritySupport ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Remove Branding</span>
                  <span className={`text-sm font-medium ${featureFlags?.canRemoveBranding ? 'text-green-600' : 'text-gray-400'}`}>
                    {featureFlags?.canRemoveBranding ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Custom Branding</span>
                  <span className={`text-sm font-medium ${featureFlags?.canUseCustomBranding ? 'text-green-600' : 'text-gray-400'}`}>
                    {featureFlags?.canUseCustomBranding ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            </div>

            {/* Upgrade CTA */}
            {subscriptionState?.accessLevel !== 'paid' && (
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Unlock More Features</h3>
                <p className="text-blue-100 text-sm mb-4">
                  Get unlimited projects, advanced features, and priority support.
                </p>
                <button
                  onClick={handleUpgrade}
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm"
                >
                  View Plans
                </button>
              </div>
            )}

            {/* Cancel Subscription */}
            {subscriptionState?.hasActiveSubscription && subscriptionState?.currentSubscription && (
              <CancelSubscription
                subscriptionId={subscriptionState.currentSubscription.stripe_subscription_id}
                plan={subscriptionState.currentPlan || 'Unknown'}
                onCancel={() => {
                  refreshSubscriptionState()
                }}
              />
            )}
          </div>
        </div>

        {/* Back to App */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/app')}
            className="text-gray-600 hover:text-gray-800 font-medium"
          >
            ← Back to App
          </button>
        </div>
      </div>
    </div>
  )
}

