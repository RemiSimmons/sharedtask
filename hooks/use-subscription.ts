"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ClientSubscriptionState, FeatureFlags } from '@/lib/access-control'

/**
 * Hook to get user's subscription state
 */
export function useSubscription() {
  const { data: session, status } = useSession()
  const [subscriptionState, setSubscriptionState] = useState<ClientSubscriptionState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user?.id) {
      setSubscriptionState({
        hasActiveTrial: false,
        hasActiveSubscription: false,
        canStartTrial: false,
        accessLevel: 'free'
      })
      setLoading(false)
      return
    }

    fetchSubscriptionState()
  }, [session, status])

  const fetchSubscriptionState = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/subscription/state')
      if (!response.ok) {
        throw new Error('Failed to fetch subscription state')
      }

      const data = await response.json()
      setSubscriptionState(data)
    } catch (err) {
      console.error('Error fetching subscription state:', err)
      setError(err instanceof Error ? err.message : 'Failed to load subscription')
      // Set default free state on error
      setSubscriptionState({
        hasActiveTrial: false,
        hasActiveSubscription: false,
        canStartTrial: false,
        accessLevel: 'free'
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshSubscriptionState = () => {
    if (session?.user?.id) {
      fetchSubscriptionState()
    }
  }

  return {
    subscriptionState,
    loading,
    error,
    refreshSubscriptionState,
    isAuthenticated: !!session?.user?.id
  }
}

/**
 * Hook to get feature flags based on subscription
 */
export function useFeatureFlags() {
  const { data: session, status } = useSession()
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user?.id) {
      // Set free tier flags for unauthenticated users
      setFeatureFlags({
        canCreateUnlimitedProjects: false,
        canRemoveBranding: false,
        canUseAdvancedTemplates: false,
        canExportData: false,
        hasPrioritySupport: false,
        canUseCustomBranding: false,
        canUseAdvancedPermissions: false,
        canUseAPIAccess: false,
        maxProjects: 1
      })
      setLoading(false)
      return
    }

    fetchFeatureFlags()
  }, [session, status])

  const fetchFeatureFlags = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/subscription/features')
      if (!response.ok) {
        throw new Error('Failed to fetch feature flags')
      }

      const data = await response.json()
      setFeatureFlags(data)
    } catch (err) {
      console.error('Error fetching feature flags:', err)
      setError(err instanceof Error ? err.message : 'Failed to load features')
      // Set free tier flags on error
      setFeatureFlags({
        canCreateUnlimitedProjects: false,
        canRemoveBranding: false,
        canUseAdvancedTemplates: false,
        canExportData: false,
        hasPrioritySupport: false,
        canUseCustomBranding: false,
        canUseAdvancedPermissions: false,
        canUseAPIAccess: false,
        maxProjects: 1
      })
    } finally {
      setLoading(false)
    }
  }

  return {
    featureFlags,
    loading,
    error,
    refreshFeatureFlags: fetchFeatureFlags
  }
}

/**
 * Hook to check if user has access to specific features
 */
export function useAccessControl() {
  const { subscriptionState, loading: subscriptionLoading } = useSubscription()
  const { featureFlags, loading: featuresLoading } = useFeatureFlags()

  const loading = subscriptionLoading || featuresLoading

  const hasAccess = (feature: keyof FeatureFlags): boolean => {
    if (!featureFlags) return false
    return featureFlags[feature] as boolean
  }

  const hasAccessToFeature = (requiredLevel: 'trial' | 'basic' | 'pro' | 'team'): boolean => {
    if (!subscriptionState) return false

    const accessLevel = subscriptionState.accessLevel
    const plan = subscriptionState.plan

    // Free users have no access
    if (accessLevel === 'free') return false

    // Trial and paid users have access to basic features
    if (requiredLevel === 'trial' || requiredLevel === 'basic') {
      return accessLevel === 'trial' || accessLevel === 'paid'
    }

    // Pro features require pro or team plan
    if (requiredLevel === 'pro') {
      return accessLevel === 'paid' && (plan === 'pro' || plan === 'team')
    }

    // Team features require team plan
    if (requiredLevel === 'team') {
      return accessLevel === 'paid' && plan === 'team'
    }

    return false
  }

  const getUpgradeMessage = (requiredLevel: 'trial' | 'basic' | 'pro' | 'team'): string => {
    if (!subscriptionState) return 'Please sign in to access this feature.'

    const { accessLevel, canStartTrial, plan } = subscriptionState

    if (accessLevel === 'free') {
      if (canStartTrial) {
        return 'Start a free trial to access this feature.'
      } else {
        return 'Subscribe to access this feature.'
      }
    }

    if (requiredLevel === 'pro' && plan === 'basic') {
      return 'Upgrade to Pro or Team plan to access this feature.'
    }

    if (requiredLevel === 'team' && plan !== 'team') {
      return 'Upgrade to Team plan to access this feature.'
    }

    return 'Upgrade your plan to access this feature.'
  }

  return {
    loading,
    subscriptionState,
    featureFlags,
    hasAccess,
    hasAccessToFeature,
    getUpgradeMessage,
    isPaidUser: subscriptionState?.accessLevel === 'paid',
    isTrialUser: subscriptionState?.accessLevel === 'trial',
    isFreeUser: subscriptionState?.accessLevel === 'free',
    canStartTrial: subscriptionState?.canStartTrial || false
  }
}

/**
 * Hook for project creation limits
 */
export function useProjectLimits() {
  const { featureFlags, subscriptionState } = useAccessControl()
  const [projectCount, setProjectCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjectCount()
  }, [])

  const fetchProjectCount = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/projects/count')
      if (response.ok) {
        const data = await response.json()
        setProjectCount(data.count || 0)
      }
    } catch (error) {
      console.error('Error fetching project count:', error)
    } finally {
      setLoading(false)
    }
  }

  const canCreateProject = (): { allowed: boolean; reason?: string } => {
    if (!featureFlags) {
      return { allowed: false, reason: 'Loading...' }
    }

    const maxProjects = featureFlags.maxProjects

    if (maxProjects === -1) {
      return { allowed: true } // Unlimited
    }

    if (projectCount >= maxProjects) {
      const planName = subscriptionState?.plan || 'free'
      return {
        allowed: false,
        reason: `Your ${planName} plan allows up to ${maxProjects} project${maxProjects === 1 ? '' : 's'}. Upgrade to create more projects.`
      }
    }

    return { allowed: true }
  }

  return {
    projectCount,
    maxProjects: featureFlags?.maxProjects || 1,
    canCreateProject,
    refreshProjectCount: fetchProjectCount,
    loading
  }
}

