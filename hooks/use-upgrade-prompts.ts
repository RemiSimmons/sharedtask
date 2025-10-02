"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getUserSubscriptionState, getPlanLimits, getDaysUntilProjectExpiry } from '@/lib/subscription-service'

export type UpgradePromptType = 'day3' | 'contributors' | 'multiproject' | 'success' | null

export interface UpgradePromptData {
  type: UpgradePromptType
  title: string
  message: string
  cta: string
  urgency: 'low' | 'medium' | 'high'
  daysRemaining?: number
  contributorCount?: number
}

/**
 * Hook to manage upgrade prompts for free tier users
 */
export function useUpgradePrompts(projectId?: string) {
  const { data: session } = useSession()
  const [promptData, setPromptData] = useState<UpgradePromptData | null>(null)
  const [shouldShow, setShouldShow] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session?.user?.id && projectId) {
      checkUpgradePrompts()
    }
  }, [session, projectId])

  const checkUpgradePrompts = async () => {
    if (!session?.user?.id || !projectId) return

    try {
      setLoading(true)

      // Get user subscription state
      const subscriptionState = await getUserSubscriptionState(session.user.id)
      const planLimits = getPlanLimits(subscriptionState)

      // Only show prompts for free tier users
      if (subscriptionState.accessLevel !== 'free') {
        setPromptData(null)
        setShouldShow(false)
        return
      }

      // Get project data
      const projectResponse = await fetch(`/api/projects/${projectId}`)
      if (!projectResponse.ok) return

      const project = await projectResponse.json()

      // Check for day 3 prompt (11 days remaining)
      const daysRemaining = getDaysUntilProjectExpiry(project.created_at, planLimits.projectActiveWindow)
      
      if (daysRemaining === 11) {
        setPromptData({
          type: 'day3',
          title: 'Your event is coming up!',
          message: `Your project expires in ${daysRemaining} days. Upgrade to extend to 30 days and keep your data safe.`,
          cta: 'Upgrade for 30-Day Window',
          urgency: 'medium',
          daysRemaining
        })
        setShouldShow(true)
        return
      }

      // Check for contributor limit prompt (10/15 contributors)
      const contributorsResponse = await fetch(`/api/projects/${projectId}/contributors`)
      if (contributorsResponse.ok) {
        const contributorsData = await contributorsResponse.json()
        const contributorCount = contributorsData.contributorCount

        if (contributorCount >= 10 && contributorCount < planLimits.maxContributors) {
          setPromptData({
            type: 'contributors',
            title: 'Getting close to your limit!',
            message: `You have ${contributorCount}/${planLimits.maxContributors} contributors. Upgrade for unlimited contributors and advanced features.`,
            cta: 'Upgrade for Unlimited',
            urgency: contributorCount >= 13 ? 'high' : 'medium',
            contributorCount
          })
          setShouldShow(true)
          return
        }
      }

      // Check for final urgency prompt (1-3 days remaining)
      if (daysRemaining <= 3 && daysRemaining > 0) {
        setPromptData({
          type: 'day3',
          title: 'Project expires soon!',
          message: `Only ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left! Upgrade now to keep your project active and extend to 30 days.`,
          cta: 'Upgrade Now - Save My Project',
          urgency: 'high',
          daysRemaining
        })
        setShouldShow(true)
        return
      }

      // No prompts needed
      setPromptData(null)
      setShouldShow(false)

    } catch (error) {
      console.error('Error checking upgrade prompts:', error)
    } finally {
      setLoading(false)
    }
  }

  const dismissPrompt = () => {
    setShouldShow(false)
    // Store dismissal in localStorage to avoid showing again today
    const dismissKey = `prompt_dismissed_${promptData?.type}_${new Date().toDateString()}`
    localStorage.setItem(dismissKey, 'true')
  }

  const handleUpgrade = () => {
    // Redirect to pricing page with context
    const upgradeUrl = `/pricing?source=${promptData?.type}&project=${projectId}`
    window.location.href = upgradeUrl
  }

  return {
    promptData,
    shouldShow,
    loading,
    dismissPrompt,
    handleUpgrade,
    refreshPrompts: checkUpgradePrompts
  }
}

/**
 * Hook to check for multi-project upgrade prompt
 */
export function useMultiProjectPrompt() {
  const { data: session } = useSession()
  const [shouldShow, setShouldShow] = useState(false)

  const checkMultiProjectPrompt = async () => {
    if (!session?.user?.id) return

    try {
      // Get user subscription state
      const subscriptionState = await getUserSubscriptionState(session.user.id)
      
      // Only show for free tier users
      if (subscriptionState.accessLevel !== 'free') {
        setShouldShow(false)
        return
      }

      // Check if they have any projects
      const projectsResponse = await fetch('/api/projects/count')
      if (projectsResponse.ok) {
        const data = await projectsResponse.json()
        if (data.count > 0) {
          setShouldShow(true)
        }
      }
    } catch (error) {
      console.error('Error checking multi-project prompt:', error)
    }
  }

  return {
    shouldShow,
    checkMultiProjectPrompt,
    dismissPrompt: () => setShouldShow(false)
  }
}


