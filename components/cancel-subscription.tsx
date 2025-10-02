"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, X } from 'lucide-react'

interface CancelSubscriptionProps {
  subscriptionId: string
  plan: string
  onCancel?: () => void
}

export default function CancelSubscription({ subscriptionId, plan, onCancel }: CancelSubscriptionProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const handleCancel = async () => {
    if (confirmText !== 'CANCEL') {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      // Success - call onCancel callback
      onCancel?.()
      
      // Show success message
      alert('Subscription canceled successfully. You will retain access until the end of your current billing period.')
      
    } catch (error) {
      console.error('Cancel subscription error:', error)
      alert(error instanceof Error ? error.message : 'Failed to cancel subscription. Please try again.')
    } finally {
      setIsLoading(false)
      setShowConfirm(false)
      setConfirmText('')
    }
  }

  if (!showConfirm) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Cancel Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Cancel your {plan} subscription. You'll retain access until the end of your current billing period.
          </p>
          <Button
            variant="destructive"
            onClick={() => setShowConfirm(true)}
          >
            Cancel Subscription
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="text-red-600 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Confirm Cancellation
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowConfirm(false)
              setConfirmText('')
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white p-4 rounded-lg border border-red-200">
          <h4 className="font-semibold text-red-800 mb-2">⚠️ This action cannot be undone</h4>
          <ul className="text-sm text-red-700 space-y-1">
            <li>• Your {plan} subscription will be canceled</li>
            <li>• You'll lose access to premium features at the end of your billing period</li>
            <li>• Your projects and data will be preserved</li>
            <li>• You can resubscribe at any time</li>
          </ul>
        </div>

        <div>
          <label className="block text-sm font-medium text-red-800 mb-2">
            Type "CANCEL" to confirm:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="CANCEL"
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-3">
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isLoading || confirmText !== 'CANCEL'}
            className="flex-1"
          >
            {isLoading ? 'Canceling...' : 'Confirm Cancellation'}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowConfirm(false)
              setConfirmText('')
            }}
            disabled={isLoading}
          >
            Keep Subscription
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
