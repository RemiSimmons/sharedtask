"use client"

import React from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function AuthHeader() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  if (status === "loading") {
    return (
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  if (status === "authenticated" && session?.user) {
    return (
      <div className="flex items-center space-x-4">
        {/* User Info */}
        <div className="flex items-center space-x-3">
          {/* User Avatar/Initial */}
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-blue-700">
              {session.user.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          
          {/* User Email */}
          <span className="text-sm text-gray-700 font-medium hidden sm:inline">
            {session.user.email}
          </span>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
        >
          Sign Out
        </button>
      </div>
    )
  }

  // Non-authenticated users
  return (
    <div className="flex items-center space-x-3">
      {/* Sign In Button */}
      <Link
        href="/auth/signin"
        className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
      >
        Sign In
      </Link>

      {/* Sign Up Button */}
      <Link
        href="/auth/signup"
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200 shadow-sm"
      >
        Sign Up
      </Link>
    </div>
  )
}










