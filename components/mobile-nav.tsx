"use client"

import React, { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Menu, X, User, LogOut, Settings, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

interface MobileNavProps {
  showHomeLink?: boolean
}

export function MobileNav({ showHomeLink = true }: MobileNavProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    setIsOpen(false)
    router.push("/")
  }

  const handleNavigation = (path: string) => {
    setIsOpen(false)
    router.push(path)
  }

  // Loading state
  if (status === "loading") {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </div>
    )
  }

  // Unauthenticated state - no Sign In/Sign Up buttons for shared events
  if (status === "unauthenticated" || !session?.user) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 md:hidden">
        <div className="flex items-center justify-between p-4">
          {showHomeLink && (
            <Link href="/" className="text-gray-700 hover:text-gray-900">
              <Home className="w-6 h-6" />
            </Link>
          )}
        </div>
      </div>
    )
  }

  // Authenticated state
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 md:hidden">
      <div className="flex items-center justify-between p-4">
        {showHomeLink && (
          <Link href="/" className="text-gray-700 hover:text-gray-900">
            <Home className="w-6 h-6" />
          </Link>
        )}
        
        <div className="ml-auto flex items-center gap-3">
          {/* User Avatar */}
          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-blue-700">
              {session.user.email?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>

          {/* Hamburger Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="min-w-[44px] min-h-[44px] hover:bg-gray-100"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              <SheetHeader className="text-left mb-6">
                <SheetTitle className="text-xl font-bold">Menu</SheetTitle>
                <SheetDescription className="text-sm text-gray-600">
                  {session.user.email}
                </SheetDescription>
              </SheetHeader>

              <nav className="flex flex-col space-y-2">
                {/* Home */}
                <button
                  onClick={() => handleNavigation("/")}
                  className="flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px]"
                >
                  <Home className="w-5 h-5" />
                  <span className="text-base font-medium">Home</span>
                </button>

                <Separator className="my-2" />

                {/* Account Settings */}
                <button
                  onClick={() => handleNavigation("/account")}
                  className="flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px]"
                >
                  <Settings className="w-5 h-5" />
                  <span className="text-base font-medium">Account Settings</span>
                </button>

                {/* Support */}
                <button
                  onClick={() => handleNavigation("/support")}
                  className="flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px]"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-base font-medium">Support</span>
                </button>

                <Separator className="my-2" />

                {/* Sign Out */}
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[44px]"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-base font-medium">Sign Out</span>
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  )
}


