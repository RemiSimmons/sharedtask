"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { UpgradePromptData } from '@/hooks/use-upgrade-prompts'

interface UpgradePromptProps {
  promptData: UpgradePromptData
  onClose: () => void
  onUpgrade?: () => void
  projectId?: string
}

export function UpgradePrompt({ promptData, onClose, onUpgrade, projectId }: UpgradePromptProps) {
  const router = useRouter()

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade()
    } else {
      // Default upgrade behavior
      const upgradeUrl = `/pricing?source=${promptData.type}&project=${projectId || ''}`
      router.push(upgradeUrl)
    }
  }

  const getUrgencyStyles = () => {
    switch (promptData.urgency) {
      case 'high':
        return {
          container: 'bg-red-50 border-red-200',
          title: 'text-red-900',
          message: 'text-red-700',
          button: 'bg-red-600 hover:bg-red-700 text-white',
          icon: '🚨'
        }
      case 'medium':
        return {
          container: 'bg-orange-50 border-orange-200',
          title: 'text-orange-900',
          message: 'text-orange-700',
          button: 'bg-orange-600 hover:bg-orange-700 text-white',
          icon: '⚠️'
        }
      default:
        return {
          container: 'bg-blue-50 border-blue-200',
          title: 'text-blue-900',
          message: 'text-blue-700',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
          icon: '💡'
        }
    }
  }

  const styles = getUrgencyStyles()

  return (
    <div className={`${styles.container} border rounded-lg p-4 mb-4 relative`}>
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex items-start gap-3 pr-6">
        {/* Icon */}
        <div className="text-2xl flex-shrink-0 mt-0.5">
          {styles.icon}
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className={`font-semibold ${styles.title} mb-1`}>
            {promptData.title}
          </h3>
          <p className={`${styles.message} mb-3 text-sm leading-relaxed`}>
            {promptData.message}
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleUpgrade}
              className={`${styles.button} px-4 py-2 rounded-lg font-medium transition-colors text-sm`}
            >
              {promptData.cta}
            </button>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 font-medium text-sm px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Maybe later
            </button>
          </div>

          {/* Additional context based on prompt type */}
          {promptData.type === 'day3' && promptData.daysRemaining && (
            <div className="mt-2 text-xs text-gray-600">
              💰 Upgrade to Basic for just $2.99/month and get 30-day project windows
            </div>
          )}
          
          {promptData.type === 'contributors' && (
            <div className="mt-2 text-xs text-gray-600">
              🚀 Basic plan includes unlimited contributors + analytics dashboard
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Multi-project upgrade prompt for when users try to create a second project
 */
export function MultiProjectPrompt({ onClose, onUpgrade }: { onClose: () => void, onUpgrade: () => void }) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-4">
      <div className="text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="font-bold text-blue-900 text-lg mb-2">
          Ready for your next event?
        </h3>
        <p className="text-blue-700 mb-4">
          Upgrade to manage multiple events simultaneously and never lose your planning data.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onUpgrade}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Upgrade to Basic - $2.99/month
          </button>
          <button
            onClick={onClose}
            className="text-blue-600 hover:text-blue-800 font-medium px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Maybe later
          </button>
        </div>
        
        <div className="mt-3 text-xs text-blue-600">
          ✨ 3 active projects • 30-day windows • Analytics dashboard • No branding
        </div>
      </div>
    </div>
  )
}

/**
 * Success prompt after a project is completed
 */
export function SuccessPrompt({ onClose, onUpgrade }: { onClose: () => void, onUpgrade: () => void }) {
  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mb-4">
      <div className="text-center">
        <div className="text-4xl mb-3">🎊</div>
        <h3 className="font-bold text-green-900 text-lg mb-2">
          That went great!
        </h3>
        <p className="text-green-700 mb-4">
          Your event was successful! Upgrade to use SharedTask for all your future events.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onUpgrade}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Upgrade Now - $2.99/month
          </button>
          <button
            onClick={onClose}
            className="text-green-600 hover:text-green-800 font-medium px-6 py-3 rounded-lg hover:bg-green-50 transition-colors"
          >
            Not now
          </button>
        </div>
        
        <div className="mt-3 text-xs text-green-600">
          🚀 Perfect for regular event organizers • Multiple projects • Extended windows
        </div>
      </div>
    </div>
  )
}

