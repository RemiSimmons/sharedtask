"use client"

import React from "react"

export function EventHeader() {
  return (
    <>
      {/* Desktop Header - Empty header for spacing */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
          </div>
        </div>
      </header>

      {/* Mobile Header - Empty header for spacing */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm md:hidden">
        <div className="flex items-center p-4 h-16">
        </div>
      </div>
    </>
  )
}
