import { getUserSubscriptionState, UserSubscriptionState, hasAccessToPaidFeatures, getPlanLimits } from './subscription-service'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from './auth'

/**
 * Access control middleware for API routes
 */
export async function requireSubscriptionAccess(
  request: NextRequest,
  requiredFeature?: 'basic' | 'pro' | 'team'
): Promise<{ authorized: boolean; response?: NextResponse; userId?: string; subscriptionState?: UserSubscriptionState }> {
  try {
    // Get user session
    const session = await auth()
    
    if (!session?.user?.id) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
    }

    const userId = session.user.id

    // Get user's subscription state
    const subscriptionState = await getUserSubscriptionState(userId)

    // Check if user has access to paid features
    if (!hasAccessToPaidFeatures(subscriptionState)) {
      return {
        authorized: false,
        response: NextResponse.json(
          { 
            error: 'Subscription required',
            message: 'This feature requires an active subscription or trial.',
            subscriptionState: {
              hasActiveTrial: subscriptionState.hasActiveTrial,
              hasActiveSubscription: subscriptionState.hasActiveSubscription,
              canStartTrial: subscriptionState.canStartTrial,
              accessLevel: subscriptionState.accessLevel
            }
          },
          { status: 403 }
        )
      }
    }

    // Check specific feature requirements
    if (requiredFeature) {
      const planLimits = getPlanLimits(subscriptionState)
      
      if (requiredFeature === 'pro' && subscriptionState.plan === 'basic') {
        return {
          authorized: false,
          response: NextResponse.json(
            { 
              error: 'Pro plan required',
              message: 'This feature requires a Pro or Team plan.',
              currentPlan: subscriptionState.plan,
              requiredPlan: 'pro'
            },
            { status: 403 }
          )
        }
      }

      if (requiredFeature === 'team' && subscriptionState.plan !== 'team') {
        return {
          authorized: false,
          response: NextResponse.json(
            { 
              error: 'Team plan required',
              message: 'This feature requires a Team plan.',
              currentPlan: subscriptionState.plan,
              requiredPlan: 'team'
            },
            { status: 403 }
          )
        }
      }
    }

    return {
      authorized: true,
      userId,
      subscriptionState
    }

  } catch (error) {
    console.error('Access control error:', error)
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Access control check failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * Check if user can create more projects based on their plan limits
 */
export async function canCreateProject(userId: string, currentProjectCount: number): Promise<{
  allowed: boolean
  reason?: string
  limit?: number
}> {
  try {
    const subscriptionState = await getUserSubscriptionState(userId)
    const planLimits = getPlanLimits(subscriptionState)

    // Unlimited projects
    if (planLimits.maxProjects === -1) {
      return { allowed: true }
    }

    // Check against limit
    if (currentProjectCount >= planLimits.maxProjects) {
      return {
        allowed: false,
        reason: `Your ${subscriptionState.plan || 'free'} plan allows up to ${planLimits.maxProjects} project${planLimits.maxProjects === 1 ? '' : 's'}. Upgrade to create more projects.`,
        limit: planLimits.maxProjects
      }
    }

    return { allowed: true, limit: planLimits.maxProjects }

  } catch (error) {
    console.error('Error checking project creation limits:', error)
    return {
      allowed: false,
      reason: 'Unable to verify project limits. Please try again.'
    }
  }
}

/**
 * Feature flags based on subscription state
 */
export interface FeatureFlags {
  canCreateUnlimitedProjects: boolean
  canRemoveBranding: boolean
  canUseAdvancedTemplates: boolean
  canExportData: boolean
  hasPrioritySupport: boolean
  canUseCustomBranding: boolean
  canUseAdvancedPermissions: boolean
  canUseAPIAccess: boolean
  maxProjects: number
}

export async function getFeatureFlags(userId: string): Promise<FeatureFlags> {
  try {
    const subscriptionState = await getUserSubscriptionState(userId)
    const planLimits = getPlanLimits(subscriptionState)
    const hasAccess = hasAccessToPaidFeatures(subscriptionState)
    const plan = subscriptionState.plan || 'basic'

    return {
      canCreateUnlimitedProjects: hasAccess && planLimits.maxProjects === -1,
      canRemoveBranding: hasAccess && (plan === 'pro' || plan === 'team'),
      canUseAdvancedTemplates: hasAccess,
      canExportData: hasAccess && (plan === 'pro' || plan === 'team'),
      hasPrioritySupport: hasAccess && (plan === 'pro' || plan === 'team'),
      canUseCustomBranding: hasAccess && plan === 'team',
      canUseAdvancedPermissions: hasAccess && (plan === 'pro' || plan === 'team'),
      canUseAPIAccess: hasAccess && plan === 'team',
      maxProjects: planLimits.maxProjects
    }
  } catch (error) {
    console.error('Error getting feature flags:', error)
    // Return free tier flags on error
    return {
      canCreateUnlimitedProjects: false,
      canRemoveBranding: false,
      canUseAdvancedTemplates: false,
      canExportData: false,
      hasPrioritySupport: false,
      canUseCustomBranding: false,
      canUseAdvancedPermissions: false,
      canUseAPIAccess: false,
      maxProjects: 1
    }
  }
}

/**
 * Subscription status for client-side components
 */
export interface ClientSubscriptionState {
  hasActiveTrial: boolean
  hasActiveSubscription: boolean
  canStartTrial: boolean
  accessLevel: 'free' | 'trial' | 'paid'
  plan?: string
  interval?: string
  trialDaysRemaining?: number
  trialEndsAt?: string
  subscriptionStatus?: string
  subscriptionId?: string
}

export async function getClientSubscriptionState(userId: string): Promise<ClientSubscriptionState> {
  try {
    const subscriptionState = await getUserSubscriptionState(userId)

    return {
      hasActiveTrial: subscriptionState.hasActiveTrial,
      hasActiveSubscription: subscriptionState.hasActiveSubscription,
      canStartTrial: subscriptionState.canStartTrial,
      accessLevel: subscriptionState.accessLevel,
      plan: subscriptionState.plan,
      interval: subscriptionState.interval,
      trialDaysRemaining: subscriptionState.trialDaysRemaining,
      trialEndsAt: subscriptionState.trial?.ends_at,
      subscriptionStatus: subscriptionState.subscription?.status,
      subscriptionId: subscriptionState.subscription?.stripe_subscription_id || undefined
    }
  } catch (error) {
    console.error('Error getting client subscription state:', error)
    return {
      hasActiveTrial: false,
      hasActiveSubscription: false,
      canStartTrial: false,
      accessLevel: 'free'
    }
  }
}
