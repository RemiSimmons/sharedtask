"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { PasswordInput } from "@/components/ui/password-input"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }

    setIsLoading(true)

    try {
      // Clear any existing session data before signing in
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email or password incorrect')
        return
      }

      if (result?.ok) {
        // Wait longer to ensure session is fully established
        setTimeout(() => {
          // Use window.location.replace to prevent back button issues
          window.location.replace('/')
        }, 300)
      } else {
        setError('Sign in failed. Please try again.')
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError("")
    setIsLoading(true)
    
    try {
      await signIn('google', { callbackUrl: '/' })
    } catch (error) {
      console.error('Google sign in error:', error)
      setError('Failed to sign in with Google. Please try again.')
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            <h1 className="header-main">Welcome Back</h1>
          </div>
          <p className="text-xl text-gray-700 font-medium">
            Access your projects
          </p>
        </div>

        {/* Sign In Form */}
        <div className="card-beautiful p-8">
          {/* Google Sign In */}
          <div className="space-y-4 mb-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-lg font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <g fill="none" fillRule="evenodd">
                  <path d="M17.6 9.2l-.1-1.8H9v3.4h4.8C13.6 12 13 13 12 13.6v2.2h3a8.8 8.8 0 0 0 2.6-6.6z" fill="#4285F4"/>
                  <path d="M9 18c2.4 0 4.5-.8 6-2.2l-3-2.2a5.4 5.4 0 0 1-8-2.9H1V13a9 9 0 0 0 8 5z" fill="#34A853"/>
                  <path d="M4 10.7a5.4 5.4 0 0 1 0-3.4V5H1a9 9 0 0 0 0 8l3-2.3z" fill="#FBBC05"/>
                  <path d="M9 3.6c1.3 0 2.5.4 3.4 1.3L15 2.3A9 9 0 0 0 1 5l3 2.4a5.4 5.4 0 0 1 5-3.7z" fill="#EA4335"/>
                </g>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">OR</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-lg font-semibold text-gray-900 mb-2">
                📧 Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="Enter your email address"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <PasswordInput
              id="password"
              label="🔒 Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link href="/auth/forgot-password" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Forgot your password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full btn-primary text-lg py-4 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? "Signing In..." : "🔑 Sign In"}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200">
            <p className="text-gray-600 mb-4">Don't have an account?</p>
            <Link href="/auth/signup" className="btn-secondary">
              Create Account
            </Link>
          </div>
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



