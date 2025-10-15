"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

function VerifyEmailContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [token, setToken] = useState("")
  const searchParams = useSearchParams()

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (!tokenParam) {
      setError("Invalid or missing verification token.")
      setIsLoading(false)
      return
    }
    
    setToken(tokenParam)
    verifyEmail(tokenParam)
  }, [searchParams])

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to verify email')
        return
      }

      setIsSuccess(true)
    } catch (error) {
      console.error('Email verification error:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center space-y-6 mb-8">
          <div className="flex items-center justify-center gap-4">
            <svg className="header-icon text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h1 className="header-main">Email Verification</h1>
          </div>
          <p className="text-xl text-gray-700 font-medium">
            {isLoading ? "Verifying your email..." : isSuccess ? "Email verified successfully!" : "Verification failed"}
          </p>
        </div>

        {/* Content */}
        <div className="card-beautiful p-8">
          {isLoading ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">Verifying Email</h3>
                <p className="text-gray-700">Please wait while we verify your email address...</p>
              </div>
            </div>
          ) : isSuccess ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">Email Verified!</h3>
                <p className="text-gray-700">
                  Your email address has been successfully verified. You can now access all features of your account.
                </p>
              </div>
              <div className="pt-4 space-y-3">
                <Link href="/admin" className="btn-primary w-full text-center block">
                  🏠 Go to Dashboard
                </Link>
                <Link href="/account" className="btn-secondary w-full text-center block">
                  👤 Manage Account
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-red-600">Verification Failed</h3>
                <p className="text-gray-700">{error}</p>
              </div>
              <div className="pt-4 space-y-3">
                <Link href="/account" className="btn-secondary w-full text-center block">
                  👤 Go to Account Settings
                </Link>
                <p className="text-sm text-gray-600">
                  You can request a new verification email from your account settings.
                </p>
              </div>
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
