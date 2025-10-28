"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { PasswordInput } from "@/components/ui/password-input"

export default function SignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!name || !email || !password || !confirmPassword) {
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

    setIsLoading(true)

    try {
      // Create account
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle validation errors with detailed messages
        if (data.details && data.details.length > 0) {
          // Show the first validation error message
          setError(data.details[0].message)
        } else {
          // Fallback to generic error message
          setError(data.error || data.message || 'Failed to create account')
        }
        return
      }

      // Automatically sign in after successful signup
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (signInResult?.error) {
        setError('Account created but failed to sign in. Please try signing in manually.')
        router.push('/auth/signin')
        return
      }

      // Redirect to admin dashboard
      router.push('/admin')
    } catch (error) {
      console.error('Signup error:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setError("")
    setIsLoading(true)
    
    try {
      await signIn('google', { callbackUrl: '/admin' })
    } catch (error) {
      console.error('Google sign up error:', error)
      setError('Failed to sign up with Google. Please try again.')
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <h1 className="header-main">Create Account</h1>
          </div>
          <p className="text-xl text-gray-700 font-medium">
            Sign up to start managing your projects
          </p>
        </div>

        {/* Signup Form */}
        <div className="card-beautiful p-8">
          {/* Google Sign Up */}
          <div className="space-y-4 mb-6">
            <button
              type="button"
              onClick={handleGoogleSignUp}
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
              Sign up with Google
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

            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-lg font-semibold text-gray-900 mb-2">
                👤 Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                placeholder="Enter your full name"
                required
                disabled={isLoading}
              />
              <p className="text-sm text-gray-600 mt-1">This will be used to personalize your experience</p>
            </div>

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
              <p className="text-sm text-gray-600 mt-1">We'll use this to send you project updates</p>
            </div>

            {/* Password */}
            <PasswordInput
              id="password"
              label="🔒 Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a secure password"
              helperText="Must be at least 8 characters long"
              required
              disabled={isLoading}
            />

            {/* Confirm Password */}
            <PasswordInput
              id="confirm-password"
              label="🔒 Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Enter your password again"
              required
              disabled={isLoading}
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full btn-primary text-lg py-4 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200">
            <p className="text-gray-600 mb-4">Already have an account?</p>
            <Link href="/auth/signin" className="btn-secondary">
              🔑 Sign In Instead
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



