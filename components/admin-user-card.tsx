"use client"

import React from "react"
import { useRouter } from "next/navigation"

interface UserCardProps {
  user: {
    id: string
    name: string
    email: string
    emailVerified: boolean
    tier: string
    tierLabel: string
    tierColor: string
    projectCount: number
    projectLimit: number
    projectUsagePercent: number
    taskCount: number
    lastActivity: string
    isActive: boolean
    storageUsed: number
    storageLimit: number
  }
}

export default function AdminUserCard({ user }: UserCardProps) {
  const router = useRouter()

  const getTierColorClasses = (color: string) => {
    const colors = {
      gray: 'bg-gray-100 text-gray-800 border-gray-300',
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
      purple: 'bg-purple-100 text-purple-800 border-purple-300',
      green: 'bg-green-100 text-green-800 border-green-300',
    }
    return colors[color as keyof typeof colors] || colors.gray
  }

  const getProgressBarColor = (percent: number) => {
    if (percent < 50) return 'bg-green-500'
    if (percent < 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const formatLastActivity = (date: string) => {
    const now = new Date()
    const activityDate = new Date(date)
    const diffMs = now.getTime() - activityDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <div 
      className="card-beautiful p-6 hover-lift cursor-pointer transition-all"
      onClick={() => router.push(`/admin/user/${user.id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
            user.isActive ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          
          {/* Name & Email */}
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              {user.name}
              {user.emailVerified && (
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </h3>
            <p className="text-sm text-gray-600 truncate max-w-[200px]">{user.email}</p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className={`w-3 h-3 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-gray-400'}`} title={user.isActive ? 'Active' : 'Inactive'} />
      </div>

      {/* Tier Badge */}
      <div className="mb-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getTierColorClasses(user.tierColor)}`}>
          {user.tier === 'free' && '🟤'}
          {user.tier === 'basic' && '🔵'}
          {user.tier === 'pro' && '🟣'}
          {user.tier === 'team' && '🟢'}
          <span className="ml-1">{user.tierLabel.toUpperCase()}</span>
        </span>
      </div>

      {/* Project Usage */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Projects</span>
          <span className="font-semibold text-gray-900">
            {user.projectCount}/{user.projectLimit === -1 ? '∞' : user.projectLimit}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${getProgressBarColor(user.projectUsagePercent)}`}
            style={{ width: `${Math.min(user.projectUsagePercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Storage Usage */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Storage</span>
          <span className="font-semibold text-gray-900">
            {user.storageUsed}MB / {user.storageLimit}MB
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${getProgressBarColor((user.storageUsed / user.storageLimit) * 100)}`}
            style={{ width: `${Math.min((user.storageUsed / user.storageLimit) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <div className="text-xs text-gray-600">Tasks</div>
          <div className="text-lg font-bold text-gray-900">{user.taskCount}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <div className="text-xs text-gray-600">Last Active</div>
          <div className="text-sm font-bold text-gray-900">{formatLastActivity(user.lastActivity)}</div>
        </div>
      </div>

      {/* View Details Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          router.push(`/admin/user/${user.id}`)
        }}
        className="w-full btn-primary text-center py-2"
      >
        View Details
      </button>
    </div>
  )
}

