"use client"

import React, { useState } from "react"
import { useTask } from "@/contexts/TaskContextWithSupabase"
import { Users } from "lucide-react"

interface HeadcountDisplayProps {
  isOwner?: boolean
}

export function HeadcountDisplay({ isOwner = false }: HeadcountDisplayProps) {
  const { getTotalHeadcount, getContributorHeadcounts, updateContributorHeadcount } = useTask()
  const [editingContributor, setEditingContributor] = useState<string | null>(null)
  const [tempHeadcounts, setTempHeadcounts] = useState<Map<string, number>>(new Map())
  const [isSaving, setIsSaving] = useState(false)

  const totalHeadcount = getTotalHeadcount()
  const contributorHeadcounts = getContributorHeadcounts()

  const handleEdit = (contributor: string, currentCount: number) => {
    setEditingContributor(contributor)
    setTempHeadcounts(new Map(tempHeadcounts.set(contributor, currentCount)))
  }

  const handleCancel = (contributor: string) => {
    setEditingContributor(null)
    const newMap = new Map(tempHeadcounts)
    newMap.delete(contributor)
    setTempHeadcounts(newMap)
  }

  const handleSave = async (contributor: string) => {
    const newHeadcount = tempHeadcounts.get(contributor)
    if (!newHeadcount || newHeadcount < 1) return

    setIsSaving(true)
    try {
      await updateContributorHeadcount(contributor, newHeadcount)
      setEditingContributor(null)
      const newMap = new Map(tempHeadcounts)
      newMap.delete(contributor)
      setTempHeadcounts(newMap)
    } catch (error) {
      console.error('Failed to update headcount:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleHeadcountChange = (contributor: string, value: string) => {
    // Allow empty string temporarily for typing
    if (value === '') {
      setTempHeadcounts(new Map(tempHeadcounts.set(contributor, 1)))
      return
    }
    const numValue = Math.max(1, Math.min(99, parseInt(value) || 1))
    setTempHeadcounts(new Map(tempHeadcounts.set(contributor, numValue)))
  }

  const handleIncrement = (contributor: string) => {
    const currentValue = tempHeadcounts.get(contributor) || contributorHeadcounts.get(contributor) || 1
    const newValue = Math.min(99, currentValue + 1)
    setTempHeadcounts(new Map(tempHeadcounts.set(contributor, newValue)))
  }

  const handleDecrement = (contributor: string) => {
    const currentValue = tempHeadcounts.get(contributor) || contributorHeadcounts.get(contributor) || 1
    const newValue = Math.max(1, currentValue - 1)
    setTempHeadcounts(new Map(tempHeadcounts.set(contributor, newValue)))
  }

  // If no contributors yet, don't show anything
  if (contributorHeadcounts.size === 0) {
    return null
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 md:border border-blue-200 rounded-lg p-6 md:p-6">
      <div className="flex flex-col items-center text-center">
        <h3 className="text-2xl md:text-lg font-bold md:font-semibold text-blue-900 mb-3 md:mb-4">
          Expected Attendees
        </h3>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Users className="w-8 h-8 md:w-6 md:h-6 text-blue-600 flex-shrink-0" />
          <span className="text-4xl md:text-3xl font-bold text-blue-900">{totalHeadcount}</span>
          <span className="text-lg md:text-base text-blue-700">
            {totalHeadcount === 1 ? 'person' : 'people'}
          </span>
        </div>

        {contributorHeadcounts.size > 0 && (
          <div className="space-y-3 md:space-y-2 w-full">
            <p className="text-base md:text-sm font-medium text-blue-800 text-center">
              Breakdown by guest: {contributorHeadcounts.size > 3 && <span className="text-xs">↕️ Scroll to see all</span>}
            </p>
            <div 
              className="flex flex-col items-center space-y-2 mx-auto max-h-[50vh] md:max-h-[350px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100 px-2"
              style={{ 
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-y'
              }}
            >
                {Array.from(contributorHeadcounts.entries())
                  .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
                  .map(([contributor, count]) => {
                    const isEditing = editingContributor === contributor
                    const displayCount = isEditing ? (tempHeadcounts.get(contributor) || count) : count

                    return (
                      <div
                        key={contributor}
                        className="bg-white rounded-lg p-4 md:p-3 border border-blue-200 w-full max-w-md"
                        style={{ touchAction: 'manipulation' }}
                      >
                        {!isEditing ? (
                          /* Display Mode - One line on all screens */
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-lg md:text-base font-medium text-gray-900 truncate">
                              {contributor}
                            </span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-2xl md:text-xl font-bold text-blue-900 min-w-[3rem] md:min-w-[2.5rem] text-center">
                                {count}
                              </span>
                              <button
                                onClick={() => handleEdit(contributor, count)}
                                className="px-4 py-2 md:px-3 md:py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors font-medium text-base md:text-sm min-h-[44px] md:min-h-[36px]"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Edit Mode - Stack on mobile, inline on desktop */
                          <div>
                            {/* Guest Name */}
                            <div className="mb-3 md:mb-0 md:flex md:items-center md:justify-between">
                              <span className="text-lg md:text-base font-medium text-gray-900 block md:inline">
                                {contributor}
                              </span>
                              
                              {/* Edit Controls - hidden on mobile, shown on desktop */}
                              <div className="hidden md:flex md:items-center md:gap-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleDecrement(contributor)}
                                    disabled={isSaving || displayCount <= 1}
                                    className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-lg"
                                    aria-label="Decrease headcount"
                                  >
                                    −
                                  </button>
                                  
                                  <input
                                    type="number"
                                    inputMode="numeric"
                                    min="1"
                                    max="99"
                                    value={displayCount}
                                    onChange={(e) => handleHeadcountChange(contributor, e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                    className="w-16 px-2 py-2 border-2 border-blue-300 rounded-md text-center text-base font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    style={{ touchAction: 'manipulation' }}
                                    disabled={isSaving}
                                    autoFocus
                                  />
                                  
                                  <button
                                    type="button"
                                    onClick={() => handleIncrement(contributor)}
                                    disabled={isSaving || displayCount >= 99}
                                    className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-lg"
                                    aria-label="Increase headcount"
                                  >
                                    +
                                  </button>
                                </div>
                                
                                <button
                                  onClick={() => handleSave(contributor)}
                                  disabled={isSaving}
                                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50"
                                >
                                  {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={() => handleCancel(contributor)}
                                  disabled={isSaving}
                                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium text-sm disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                            
                            {/* Edit Controls - Mobile Only */}
                            <div className="md:hidden space-y-3">
                              {/* Number controls */}
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleDecrement(contributor)}
                                  disabled={isSaving || displayCount <= 1}
                                  className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-xl"
                                  aria-label="Decrease headcount"
                                >
                                  −
                                </button>
                                
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  min="1"
                                  max="99"
                                  value={displayCount}
                                  onChange={(e) => handleHeadcountChange(contributor, e.target.value)}
                                  onFocus={(e) => e.target.select()}
                                  className="w-20 px-3 py-3 border-2 border-blue-300 rounded-md text-center text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  style={{ touchAction: 'manipulation' }}
                                  disabled={isSaving}
                                  autoFocus
                                />
                                
                                <button
                                  type="button"
                                  onClick={() => handleIncrement(contributor)}
                                  disabled={isSaving || displayCount >= 99}
                                  className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-xl"
                                  aria-label="Increase headcount"
                                >
                                  +
                                </button>
                              </div>
                              
                              {/* Action buttons */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSave(contributor)}
                                  disabled={isSaving}
                                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-base disabled:opacity-50"
                                >
                                  {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={() => handleCancel(contributor)}
                                  disabled={isSaving}
                                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium text-base disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                })}
            </div>
          </div>
        )}

        {!isOwner && (
          <p className="text-base md:text-sm text-blue-700 mt-4 md:mt-3 text-center">
            💡 Guests can update their headcount by clicking "Edit" next to their name.
          </p>
        )}
      </div>
    </div>
  )
}

