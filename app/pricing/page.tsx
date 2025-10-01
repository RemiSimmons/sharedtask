"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"

function PricingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [actionType, setActionType] = useState<'trial' | 'paid'>('trial')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize from URL params
  useEffect(() => {
    const billing = searchParams.get('billing')
    const action = searchParams.get('action')
    
    if (billing === 'yearly') {
      setBillingCycle('yearly')
    }
    if (action === 'paid') {
      setActionType('paid')
    }
  }, [searchParams])

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: '/forever',
      savings: null,
      description: 'Perfect for trying out SharedTask',
      features: [
        '1 project at a time',
        'Up to 10 contributors',
        '14-day active project window',
        '"Powered by SharedTask" footer'
      ],
      limitations: [
        'No multiple projects',
        'No analytics dashboard',
        'No SMS notifications'
      ],
      cta: 'Start Free',
      popular: false,
      color: 'gray'
    },
    {
      id: 'basic',
      name: 'Basic',
      price: billingCycle === 'monthly' ? 2.99 : 29.99,
      period: billingCycle === 'monthly' ? '/mo' : '/year',
      savings: billingCycle === 'yearly' ? 'Save 17%' : null,
      description: 'Perfect for regular event organizers',
      features: [
        '5 active projects',
        'Unlimited contributors',
        '60-day active project window',
        'Analytics dashboard',
        'Email notifications',
        '"Powered by SharedTask" footer'
      ],
      cta: 'Start Free Trial',
      popular: true,
      color: 'blue'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: billingCycle === 'monthly' ? 9.99 : 99.99,
      period: billingCycle === 'monthly' ? '/mo' : '/year',
      savings: billingCycle === 'yearly' ? 'Save 17%' : null,
      description: 'Ideal for growing teams and professional use',
      features: [
        'Everything in Basic',
        '10 projects with unique passwords',
        'Unlimited project windows',
        'No branding footer',
        'Project templates (Coming Soon)',
        'Project link expirations (Coming Soon)',
        'Set project restrictions',
        'Export options (CSV/PDF)',
        'Priority support',
        'Custom task labels'
      ],
      cta: 'Start Pro Trial',
      popular: true,
      color: 'green'
    },
    {
      id: 'team',
      name: 'Team',
      price: billingCycle === 'monthly' ? 24.99 : 249.99,
      period: billingCycle === 'monthly' ? '/mo' : '/year',
      savings: billingCycle === 'yearly' ? 'Save 17%' : null,
      description: 'Built for large teams and enterprise needs',
      features: [
        'Everything in Pro',
        'Save templates',
        'Archive projects',
        'Custom branding',
        'Role-based permissions',
        'Email/Slack notifications',
        'Team activity dashboard',
        'Admin console + support',
        'API access',
        'SSO integration',
        'Dedicated account manager'
      ],
      cta: actionType === 'trial' ? 'Start Team Trial' : 'Subscribe to Team',
      popular: false,
      color: 'purple',
      disabled: true,
      beta: true
    }
  ]

  const handlePlanSelect = async (planId: string, overrideActionType?: 'trial' | 'paid') => {
    const startType = overrideActionType || actionType
    
    // Handle disabled plans (like Team in beta)
    if (planId === 'team') {
      return // Don't allow selection of disabled plans
    }
    
    // Handle free tier - redirect to signup/signin
    if (planId === 'free') {
      if (!session) {
        router.push('/auth/signup')
      } else {
        router.push('/admin')
      }
      return
    }
    
    // Check if user is authenticated
    if (status === 'loading') {
      return // Wait for session to load
    }
    
    if (!session) {
      // Redirect to sign in with return URL
      const returnUrl = `/pricing?plan=${planId}&billing=${billingCycle}&action=${startType}`
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(returnUrl)}`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: planId,
          start: startType,
          billing: billingCycle
        })
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response:', text)
        throw new Error('Server returned an invalid response. Please try again.')
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed')
      }

      if (data.type === 'trial') {
        // Trial started successfully - redirect to welcome page
        router.push(data.redirectUrl)
      } else if (data.url) {
        // Redirect to Stripe checkout or billing portal
        window.location.href = data.url
      } else {
        throw new Error('Invalid response from checkout API')
      }

    } catch (error) {
      console.error('Checkout error:', error)
      setError(error instanceof Error ? error.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-3 md:p-6">
      <div className="max-w-6xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="text-center mb-4">
          {/* Logo and Home Button Row */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Home
            </button>
            
            <div className="flex-1 flex flex-col items-center justify-center">
              <img src="/shared-task-logo.svg" alt="SharedTask" className="h-20 w-auto" />
              <h1 className="text-[35px] font-bold text-gray-900 mt-2">Pricing Plans</h1>
            </div>
            
            {/* Right side - Account/Support buttons for authenticated users */}
            {status === 'authenticated' && session ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/support')}
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Support
                </button>
                <button
                  onClick={() => router.push('/admin')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Dashboard
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/support')}
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Support
                </button>
                <button
                  onClick={() => router.push('/auth/signin')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
          
          <p className="text-[16px] text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan for your team. Start with our free trial and upgrade as you grow.
          </p>
          
          {/* Error Message */}
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm max-w-md mx-auto">
              {error}
            </div>
          )}
          
          {/* Action Type Toggle */}
          <div className="flex items-center justify-center mt-3">
            <div className="bg-blue-50 p-1 rounded-lg flex border border-blue-200">
              <button
                onClick={() => setActionType('trial')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  actionType === 'trial'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-blue-700 hover:text-blue-900'
                }`}
              >
                Start Free Trial
              </button>
              <button
                onClick={() => setActionType('paid')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  actionType === 'paid'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-blue-700 hover:text-blue-900'
                }`}
              >
                Pay Now
              </button>
            </div>
          </div>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center mt-3">
            <div className="bg-gray-100 p-1 rounded-lg flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
              </button>
            </div>
            {billingCycle === 'yearly' && (
              <span className="ml-2 text-xs md:text-sm text-green-600 font-medium">💰 Save 17%</span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 items-stretch mb-4 max-h-96">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl flex flex-col h-full ${
                plan.disabled
                  ? 'border-gray-300 bg-gray-50 opacity-60 cursor-not-allowed'
                  : plan.popular 
                  ? 'border-green-500 ring-2 ring-green-100' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    🌟 Popular
                  </span>
                </div>
              )}

              {/* Beta Badge */}
              {plan.beta && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Coming Soon
                  </span>
                </div>
              )}

              <div className="flex flex-col p-3 md:p-4 gap-1 h-full">
                {/* Plan Header */}
                <div className="text-center">
                  <h3 className="text-[36px] font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-[16px] text-gray-600">{plan.description}</p>
                  
                  {/* 2 lines above price */}
                  <div className="h-4"></div>
                  
                  {/* Price */}
                  <div>
                    {plan.price === 0 ? (
                      <>
                        <span className="text-2xl md:text-3xl font-bold text-gray-900">$0</span>
                        <span className="text-gray-600 text-sm ml-1">/mo</span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl md:text-3xl font-bold text-gray-900">${plan.price}</span>
                        <span className="text-gray-600 text-sm ml-1">{plan.period}</span>
                      </>
                    )}
                    {plan.savings && (
                      <div className="text-xs text-green-600 font-medium">{plan.savings}</div>
                    )}
                  </div>
                  
                  {/* 3 lines under price */}
                  <div className="h-6"></div>
                </div>

                {/* Features */}
                <div className="flex-1 min-h-0">
                  <ul className="text-lg leading-relaxed space-y-2">
                    {plan.features.slice(0, 6).map((feature, index) => (
                      <li key={index} className="flex items-start gap-1.5">
                        <svg className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                    {plan.features.length > 6 && (
                      <li className="text-xs text-gray-500 italic">
                        +{plan.features.length - 6} more features
                      </li>
                    )}
                  </ul>
                  
                  {/* 3 lines at bottom of features */}
                  <div className="h-6"></div>
                </div>

                {/* CTA Buttons */}
                <div className="mt-auto">
                  {/* 3 empty lines above button */}
                  <div className="h-6"></div>
                  
                  {/* Primary CTA Button */}
                  <button
                    onClick={() => handlePlanSelect(plan.id)}
                    disabled={loading || plan.disabled}
                    className={`w-full py-2 px-3 rounded-lg font-medium transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                      plan.disabled
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : plan.id === 'free'
                        ? 'bg-gray-500 hover:bg-gray-600 text-white shadow-lg hover:shadow-xl'
                        : plan.popular
                        ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
                        : plan.id === 'team'
                        ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg hover:shadow-xl'
                        : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {loading ? 'Loading...' : plan.disabled ? 'Coming Soon' : (
                      plan.id === 'free' 
                        ? 'Start Free'
                        : actionType === 'trial' 
                        ? (plan.id === 'team' ? 'Start Team Trial' : `Start ${plan.name} Trial`)
                        : `Subscribe to ${plan.name}`
                    )}
                  </button>

                  {/* Action-specific note */}
                  <p className="text-center text-xs text-gray-500 mt-1">
                    {plan.id === 'free' 
                      ? 'No credit card required • Forever free'
                      : actionType === 'trial' 
                      ? 'No credit card required'
                      : `${billingCycle === 'yearly' ? 'Billed annually' : 'Billed monthly'} • Cancel anytime`
                    }
                  </p>

                  {/* Secondary CTA - Opposite action */}
                  {!plan.disabled && plan.id !== 'free' && (actionType === 'trial' ? (
                    <button
                      onClick={() => handlePlanSelect(plan.id, 'paid')}
                      disabled={loading}
                      className="w-full mt-2 py-2 px-3 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200 border border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Skip trial — Subscribe now
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePlanSelect(plan.id, 'trial')}
                      disabled={loading}
                      className="w-full mt-2 py-2 px-3 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200 border border-blue-200 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Try free for 14 days
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Compact Footer */}
        <div className="mt-auto">
          <div className="text-center p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white">
            <h3 className="text-lg font-bold mb-2">Ready to get started?</h3>
            <p className="text-sm mb-4 opacity-90">
              SharedTask | The easiest collaboration tool | Cancel anytime | 14-day free trial
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => handlePlanSelect('pro')}
                disabled={loading}
                className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionType === 'trial' ? 'Start Free Trial' : 'Subscribe Now'}
              </button>
              <button
                onClick={() => router.push('/demo')}
                className="border border-white text-white px-6 py-2 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition-colors text-sm"
              >
                Try Demo First
              </button>
              <button
                onClick={() => router.push('/')}
                className="text-white hover:text-gray-200 font-medium text-sm"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
              <Link 
                href="/terms" 
                className="hover:text-blue-600 transition-colors"
              >
                Terms of Service
              </Link>
              <span>•</span>
              <Link 
                href="/privacy" 
                className="hover:text-blue-600 transition-colors"
              >
                Privacy Policy
              </Link>
              <span>•</span>
              <Link 
                href="/support" 
                className="hover:text-blue-600 transition-colors"
              >
                Support
              </Link>
            </div>
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} SharedTask. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pricing...</p>
        </div>
      </div>
    }>
      <PricingContent />
    </Suspense>
  )
}