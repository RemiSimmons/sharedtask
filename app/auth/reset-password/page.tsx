"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { PasswordInput } from "@/components/ui/password-input"

function ResetPasswordContent() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [token, setToken] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (!tokenParam) {
      setError("Invalid or missing reset token. Please request a new password reset.")
      return
    }
    setToken(tokenParam)
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!password || !confirmPassword) {
      setError("Please fill in all fields")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    if (!token) {
      setError("Invalid reset token")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to reset password')
        return
      }

      setIsSuccess(true)
    } catch (error) {
      console.error('Password reset error:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token && !error) {
    return (
      <div className="min-h-screen p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center space-y-6 mb-8">
          <div className="flex items-center justify-center gap-4">
            <svg className="header-icon text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2-2m0 0a2 2 0 00-2 2m2 2v3a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2h2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v2M7 7h.01M7 3h5c.512 0 .853.61.853 1.3l.147 3.7s0 .7-.853.7H7s-.853 0-.853-.7l.147-3.7C6.147 3.61 6.488 3 7 3z" />
            </svg>
            <h1 className="header-main">Set New Password</h1>
          </div>
          <p className="text-xl text-gray-700 font-medium">
            {isSuccess ? "Password updated successfully!" : "Enter your new password"}
          </p>
        </div>

        {/* Form or Success Message */}
        <div className="card-beautiful p-8">
          {isSuccess ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">Password Updated!</h3>
                <p className="text-gray-700">
                  Your password has been successfully updated. You can now sign in with your new password.
                </p>
              </div>
              <div className="pt-4">
                <Link href="/auth/signin" className="btn-primary">
                  🔑 Sign In Now
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* New Password */}
              <PasswordInput
                id="password"
                label="🔒 New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your new password"
                helperText="Must be at least 8 characters long"
                required
                disabled={isLoading}
              />

              {/* Confirm New Password */}
              <PasswordInput
                id="confirm-password"
                label="🔒 Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Enter your new password again"
                required
                disabled={isLoading}
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !token}
                className={`w-full btn-primary text-lg py-4 ${isLoading || !token ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? "Updating Password..." : "🔄 Update Password"}
              </button>
            </form>
          )}

          {!isSuccess && (
            <div className="text-center mt-8 pt-6 border-t border-gray-200">
              <p className="text-gray-600 mb-4">Remember your password?</p>
              <Link href="/auth/signin" className="btn-secondary">
                🔑 Sign In Instead
              </Link>
            </div>
          )}
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <a href="https://app.sharedtask.ai" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
