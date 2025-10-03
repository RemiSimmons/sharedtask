"use client"

import React from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { isAdminUser } from "@/lib/admin"

interface AppHeaderProps {
  showBackButton?: boolean
  backButtonText?: string
  backButtonHref?: string
  currentPage?: string
}

export default function AppHeader({ 
  showBackButton = false, 
  backButtonText = "Back to Dashboard",
  backButtonHref = "/admin",
  currentPage = ""
}: AppHeaderProps) {
  const { data: session } = useSession()
  const router = useRouter()

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex justify-between items-center">
          {/* Left side - Logo and Back Button */}
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Logo - Always clickable to dashboard */}
            <Link href="/admin" className="flex items-center hover:opacity-80 transition-opacity">
              <img 
                src="/shared-task-logo.svg" 
                alt="SharedTask Logo" 
                className="h-20 w-auto"
              />
            </Link>

            {/* Back Button for sub-pages */}
            {showBackButton && (
              <Link 
                href={backButtonHref}
                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors border border-blue-200"
              >
                <span className="hidden sm:inline">{backButtonText}</span>
              </Link>
            )}

            {/* Current Page Indicator */}
            {currentPage && (
              <div className="hidden md:flex items-center gap-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="font-medium">{currentPage}</span>
              </div>
            )}
          </div>

          {/* Right side - User info and actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {session?.user && (
              <>
                {/* User greeting */}
                <div className="hidden lg:block text-gray-600">
                  <span className="text-sm">
                    Hello, <span className="font-medium">{session.user.name || session.user.email}</span>
                  </span>
                </div>

                {/* Navigation buttons */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Operations Dashboard button - For admin users */}
                  {isAdminUser(session?.user) && (
                    <Link 
                      href="/admin/operations" 
                      className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors border border-purple-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="hidden sm:inline">Operations</span>
                    </Link>
                  )}

                  {/* Support button */}
                  <Link 
                    href="/support" 
                    className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors border border-blue-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 110 19.5 9.75 9.75 0 010-19.5z" />
                    </svg>
                    <span className="hidden sm:inline">Support</span>
                  </Link>

                  {/* Account button */}
                  <Link 
                    href="/account" 
                    className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors border border-gray-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="hidden sm:inline">Account</span>
                  </Link>

                  {/* Sign out button */}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-gray-600 hover:text-red-600 px-2 sm:px-3 py-2 rounded-lg font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
