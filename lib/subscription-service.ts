import { supabaseAdmin } from './supabase'
import { 
  UserSubscription, 
  UserTrial, 
  InsertUserSubscription, 
  InsertUserTrial, 
  UpdateUserSubscription, 
  UpdateUserTrial,
  PlanType, 
  BillingInterval, 
  SubscriptionStatus, 
  TrialStatus 
} from '@/types/database'

// Constants
export const TRIAL_DURATION_DAYS = 14
export const APP_TIMEZONE = 'UTC' // Canonical timezone for the app

// Helper functions for date calculations
export function calculateTrialEndDate(startDate: Date = new Date()): Date {
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + TRIAL_DURATION_DAYS)
  endDate.setHours(23, 59, 59, 999) // End at 23:59:59
  return endDate
}

export function getDaysUntilTrialEnd(trialEndDate: string): number {
  const now = new Date()
  const endDate = new Date(trialEndDate)
  const diffTime = endDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

export function isTrialExpired(trialEndDate: string): boolean {
  return new Date() > new Date(trialEndDate)
}

// User subscription state interface
export interface UserSubscriptionState {
  hasActiveTrial: boolean
  hasActiveSubscription: boolean
  canStartTrial: boolean
  subscription?: UserSubscription
  trial?: UserTrial
  accessLevel: 'free' | 'trial' | 'paid'
  plan?: PlanType
  interval?: BillingInterval
  trialDaysRemaining?: number
}

/**
 * Get comprehensive subscription state for a user
 */
export async function getUserSubscriptionState(userId: string): Promise<UserSubscriptionState> {
  try {
    // Get active subscription
    const { data: activeSubscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    // Also get the most recent subscription (any status) for billing portal access
    // This allows users with past_due or other statuses to update payment
    const { data: anySubscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Use active subscription if available, otherwise use any subscription (for billing portal)
    const subscription = activeSubscription || anySubscription

    // Get active trial
    const { data: trial } = await supabaseAdmin
      .from('user_trials')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    // Check if user has ever had a trial
    const { data: anyTrial } = await supabaseAdmin
      .from('user_trials')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    const hasActiveTrial = !!trial && !isTrialExpired(trial.ends_at)
    const hasActiveSubscription = !!activeSubscription // Only count 'active' status
    const canStartTrial = !anyTrial && !hasActiveSubscription
    
    let accessLevel: 'free' | 'trial' | 'paid' = 'free'
    if (hasActiveSubscription) {
      accessLevel = 'paid'
    } else if (hasActiveTrial) {
      accessLevel = 'trial'
    }

    const trialDaysRemaining = trial ? getDaysUntilTrialEnd(trial.ends_at) : undefined

    return {
      hasActiveTrial,
      hasActiveSubscription,
      canStartTrial,
      subscription: subscription || undefined, // Return any subscription (for Stripe customer ID)
      trial: trial || undefined,
      accessLevel,
      plan: (activeSubscription?.plan || trial?.plan) as PlanType | undefined,
      interval: activeSubscription?.interval as BillingInterval | undefined,
      trialDaysRemaining
    }
  } catch (error) {
    console.error('Error getting user subscription state:', error)
    throw new Error('Failed to get subscription state')
  }
}

/**
 * Start a trial for a user
 */
export async function startTrial(userId: string, plan: PlanType): Promise<UserTrial> {
  try {
    // Check if user can start a trial
    const state = await getUserSubscriptionState(userId)
    if (!state.canStartTrial) {
      throw new Error('User cannot start a trial')
    }

    const startDate = new Date()
    const endDate = calculateTrialEndDate(startDate)

    const trialData: InsertUserTrial = {
      user_id: userId,
      plan,
      status: 'active',
      started_at: startDate.toISOString(),
      ends_at: endDate.toISOString()
    }

    const { data: trial, error } = await supabaseAdmin
      .from('user_trials')
      .insert(trialData)
      .select()
      .single()

    if (error) {
      console.error('Error starting trial:', error)
      throw new Error('Failed to start trial')
    }

    return trial
  } catch (error) {
    console.error('Error in startTrial:', error)
    throw error
  }
}

/**
 * Create or update a subscription from Stripe webhook data
 */
export async function upsertSubscription(
  userId: string,
  stripeSubscriptionData: {
    id: string
    customer: string
    status: string
    current_period_start: number
    current_period_end: number
    cancel_at_period_end: boolean
    canceled_at?: number | null
    metadata?: Record<string, string>
    items: {
      data: Array<{
        price: {
          id: string
          recurring?: {
            interval: string
          }
        }
      }>
    }
  }
): Promise<UserSubscription> {
  try {
    // Extract plan and interval from price ID
    const priceId = stripeSubscriptionData.items.data[0]?.price.id
    const interval = stripeSubscriptionData.items.data[0]?.price.recurring?.interval as BillingInterval
    
    // IMPROVED: Determine plan from metadata first (most reliable), fallback to price ID
    let plan: PlanType = 'basic'
    
    // Try to get plan from metadata (set during checkout)
    if (stripeSubscriptionData.metadata?.plan) {
      plan = stripeSubscriptionData.metadata.plan as PlanType
      console.log('✅ Plan detected from metadata:', plan)
    } 
    // Fallback to price ID matching for backwards compatibility
    else if (priceId?.includes('pro')) {
      plan = 'pro'
      console.log('⚠️ Plan detected from price ID (pro):', priceId)
    } else if (priceId?.includes('team')) {
      plan = 'team'
      console.log('⚠️ Plan detected from price ID (team):', priceId)
    } else {
      console.log('⚠️ Plan defaulting to basic. Price ID:', priceId)
    }

    const subscriptionData: InsertUserSubscription = {
      user_id: userId,
      stripe_customer_id: stripeSubscriptionData.customer,
      stripe_subscription_id: stripeSubscriptionData.id,
      stripe_price_id: priceId,
      plan,
      interval,
      status: stripeSubscriptionData.status as SubscriptionStatus,
      current_period_start: new Date(stripeSubscriptionData.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSubscriptionData.current_period_end * 1000).toISOString(),
      cancel_at_period_end: stripeSubscriptionData.cancel_at_period_end,
      canceled_at: stripeSubscriptionData.canceled_at 
        ? new Date(stripeSubscriptionData.canceled_at * 1000).toISOString() 
        : null
    }

    // Upsert subscription
    const { data: subscription, error } = await supabaseAdmin
      .from('user_subscriptions')
      .upsert(subscriptionData, { 
        onConflict: 'stripe_subscription_id',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting subscription:', error)
      throw new Error('Failed to upsert subscription')
    }

    // If subscription is active, mark any active trial as converted
    if (subscription.status === 'active') {
      await supabaseAdmin
        .from('user_trials')
        .update({ 
          status: 'converted',
          converted_to_subscription_id: subscription.id
        })
        .eq('user_id', userId)
        .eq('status', 'active')
    }

    return subscription
  } catch (error) {
    console.error('Error in upsertSubscription:', error)
    throw error
  }
}

/**
 * Expire trials that have passed their end date
 */
export async function expireTrials(): Promise<number> {
  try {
    const now = new Date().toISOString()
    
    const { data, error } = await supabaseAdmin
      .from('user_trials')
      .update({ status: 'expired' })
      .eq('status', 'active')
      .lt('ends_at', now)
      .select('id')

    if (error) {
      console.error('Error expiring trials:', error)
      throw new Error('Failed to expire trials')
    }

    return data?.length || 0
  } catch (error) {
    console.error('Error in expireTrials:', error)
    throw error
  }
}

/**
 * Get trials that need reminder emails
 */
export async function getTrialsNeedingReminders(): Promise<{
  day5Reminders: UserTrial[]
  day7Reminders: UserTrial[]
}> {
  try {
    const now = new Date()
    
    // Day 5 reminders (2 days before trial ends)
    const day5Date = new Date(now)
    day5Date.setDate(day5Date.getDate() + 2)
    day5Date.setHours(23, 59, 59, 999)

    const { data: day5Trials, error: day5Error } = await supabaseAdmin
      .from('user_trials')
      .select('*')
      .eq('status', 'active')
      .eq('day_5_reminder_sent', false)
      .lte('ends_at', day5Date.toISOString())

    if (day5Error) {
      console.error('Error getting day 5 trials:', day5Error)
      throw new Error('Failed to get day 5 trials')
    }

    // Day 14 reminders (trial ends today)
    const endOfToday = new Date(now)
    endOfToday.setHours(23, 59, 59, 999)

    const { data: day14Trials, error: day14Error } = await supabaseAdmin
      .from('user_trials')
      .select('*')
      .eq('status', 'active')
      .eq('day_14_reminder_sent', false)
      .lte('ends_at', endOfToday.toISOString())

    if (day14Error) {
      console.error('Error getting day 14 trials:', day14Error)
      throw new Error('Failed to get day 14 trials')
    }

    return {
      day5Reminders: day5Trials || [],
      day7Reminders: day14Trials || [] // Keep old name for compatibility, but it's actually day 14
    }
  } catch (error) {
    console.error('Error in getTrialsNeedingReminders:', error)
    throw error
  }
}

/**
 * Mark reminder as sent for a trial
 */
export async function markReminderSent(trialId: string, reminderType: 'day_5' | 'day_14'): Promise<void> {
  try {
    const updateData: UpdateUserTrial = {}
    
    if (reminderType === 'day_5') {
      updateData.day_5_reminder_sent = true
      updateData.day_5_reminder_sent_at = new Date().toISOString()
    } else {
      updateData.day_7_reminder_sent = true
      updateData.day_7_reminder_sent_at = new Date().toISOString()
    }

    const { error } = await supabaseAdmin
      .from('user_trials')
      .update(updateData)
      .eq('id', trialId)

    if (error) {
      console.error('Error marking reminder sent:', error)
      throw new Error('Failed to mark reminder sent')
    }
  } catch (error) {
    console.error('Error in markReminderSent:', error)
    throw error
  }
}

/**
 * Check if user has access to paid features
 */
export function hasAccessToPaidFeatures(state: UserSubscriptionState): boolean {
  return state.accessLevel === 'paid' || state.accessLevel === 'trial'
}

/**
 * Get plan limits based on subscription state
 */
export function getPlanLimits(state: UserSubscriptionState): {
  maxProjects: number
  maxContributors: number
  projectActiveWindow: number
  hasAdvancedFeatures: boolean
  hasPrioritySupport: boolean
  hasCustomBranding: boolean
  hasAnalyticsDashboard: boolean
  hasSMSNotifications: boolean
  showPoweredByBranding: boolean
  emailNotificationsOnly: boolean
} {
  const plan = state.plan || 'basic'
  const hasAccess = hasAccessToPaidFeatures(state)

  // Free tier - new users get limited access
  if (!hasAccess) {
    return {
      maxProjects: 1,
      maxContributors: 10,
      projectActiveWindow: 14, // 14 days
      hasAdvancedFeatures: false,
      hasPrioritySupport: false,
      hasCustomBranding: false,
      hasAnalyticsDashboard: false,
      hasSMSNotifications: false,
      showPoweredByBranding: true,
      emailNotificationsOnly: true
    }
  }

  switch (plan) {
    case 'basic':
      return {
        maxProjects: 5,
        maxContributors: -1, // unlimited
        projectActiveWindow: 60, // 60 days
        hasAdvancedFeatures: false,
        hasPrioritySupport: false,
        hasCustomBranding: false,
        hasAnalyticsDashboard: true,
        hasSMSNotifications: true,
        showPoweredByBranding: true, // Keep branding on Basic
        emailNotificationsOnly: false
      }
    case 'pro':
      return {
        maxProjects: 10, // 10 projects with unique passwords each
        maxContributors: -1, // unlimited
        projectActiveWindow: -1, // unlimited
        hasAdvancedFeatures: true,
        hasPrioritySupport: true,
        hasCustomBranding: false,
        hasAnalyticsDashboard: true,
        hasSMSNotifications: true,
        showPoweredByBranding: false,
        emailNotificationsOnly: false
      }
    case 'team':
      return {
        maxProjects: -1, // unlimited
        maxContributors: -1, // unlimited
        projectActiveWindow: -1, // unlimited
        hasAdvancedFeatures: true,
        hasPrioritySupport: true,
        hasCustomBranding: true,
        hasAnalyticsDashboard: true,
        hasSMSNotifications: true,
        showPoweredByBranding: false,
        emailNotificationsOnly: false
      }
    default:
      return {
        maxProjects: 1,
        maxContributors: 15,
        projectActiveWindow: 14,
        hasAdvancedFeatures: false,
        hasPrioritySupport: false,
        hasCustomBranding: false,
        hasAnalyticsDashboard: false,
        hasSMSNotifications: false,
        showPoweredByBranding: true,
        emailNotificationsOnly: true
      }
  }
}

/**
 * Check if a project has expired based on its creation date and active window
 */
export function isProjectExpired(projectCreatedAt: string, activeWindow: number): boolean {
  if (activeWindow === -1) return false // Unlimited
  
  const createdDate = new Date(projectCreatedAt)
  const expiryDate = new Date(createdDate)
  expiryDate.setDate(expiryDate.getDate() + activeWindow)
  return new Date() > expiryDate
}

/**
 * Get days until project expires
 */
export function getDaysUntilProjectExpiry(projectCreatedAt: string, activeWindow: number): number {
  if (activeWindow === -1) return -1 // Unlimited
  
  const createdDate = new Date(projectCreatedAt)
  const expiryDate = new Date(createdDate)
  expiryDate.setDate(expiryDate.getDate() + activeWindow)
  const diffTime = expiryDate.getTime() - new Date().getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}
