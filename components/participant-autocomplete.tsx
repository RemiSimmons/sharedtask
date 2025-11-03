"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ParticipantAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onAddParticipant: (name: string) => void
  existingParticipants: string[]
  className?: string
}

interface ParticipantSuggestion {
  name: string
  frequency: number
  lastUsed?: string
}

export function ParticipantAutocomplete({
  value,
  onChange,
  onAddParticipant,
  existingParticipants,
  className
}: ParticipantAutocompleteProps) {
  const { data: session } = useSession()
  const [suggestions, setSuggestions] = useState<ParticipantSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  // Fetch previous participants on mount
  useEffect(() => {
    if (session?.user?.id && !hasLoaded) {
      fetchPreviousParticipants()
    }
  }, [session?.user?.id, hasLoaded])

  const fetchPreviousParticipants = async () => {
    if (!session?.user?.id) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/participants/suggestions?userId=${session.user.id}`)
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Failed to fetch participant suggestions:', error)
    } finally {
      setIsLoading(false)
      setHasLoaded(true)
    }
  }

  // Filter suggestions based on current input
  const filteredSuggestions = useMemo(() => {
    if (!value.trim()) return suggestions.slice(0, 10) // Show top 10 when empty

    const query = value.toLowerCase().trim()
    return suggestions
      .filter(suggestion => 
        suggestion.name.toLowerCase().includes(query) &&
        !existingParticipants.some(existing => 
          existing.toLowerCase() === suggestion.name.toLowerCase()
        )
      )
      .slice(0, 8) // Limit to 8 suggestions
  }, [suggestions, value, existingParticipants])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    
    // Open dropdown if there are suggestions and user is typing
    if (newValue.trim() && filteredSuggestions.length > 0) {
      setIsOpen(true)
    } else if (!newValue.trim()) {
      setIsOpen(false)
    }
  }

  const handleSuggestionClick = (suggestion: ParticipantSuggestion) => {
    onAddParticipant(suggestion.name)
    onChange("") // Clear input
    setIsOpen(false)
  }

  // Prevent blur from firing when clicking/tapping suggestions
  const handleSuggestionMouseDown = (e: React.MouseEvent) => {
    e.preventDefault() // Prevents input blur
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (value.trim() && !existingParticipants.some(existing => 
        existing.toLowerCase() === value.toLowerCase()
      )) {
        onAddParticipant(value.trim())
        onChange("")
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const handleInputFocus = () => {
    if (filteredSuggestions.length > 0) {
      setIsOpen(true)
    }
  }

  const handleInputBlur = () => {
    // Delay closing to allow clicks on suggestions
    // Increased timeout for mobile browsers where touch events take longer to register
    setTimeout(() => setIsOpen(false), 300)
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="Type to search previous participants or add new names..."
          className="form-input text-base pr-10"
          disabled={isLoading}
        />
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}
        
        {/* Dropdown indicator */}
        {!isLoading && hasLoaded && filteredSuggestions.length > 0 && (
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.name}-${index}`}
              onMouseDown={handleSuggestionMouseDown}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Avatar/icon */}
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-700">
                      {suggestion.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  <div>
                    <div className="font-medium text-gray-900">{suggestion.name}</div>
                    <div className="text-sm text-gray-500">
                      {suggestion.frequency > 1 
                        ? `Used in ${suggestion.frequency} previous projects`
                        : 'Used in 1 previous project'
                      }
                    </div>
                  </div>
                </div>
                
                <Check className="w-4 h-4 text-green-600" />
              </div>
            </button>
          ))}
          
          {/* Add current input as new participant */}
          {value.trim() && !existingParticipants.some(existing => 
            existing.toLowerCase() === value.toLowerCase()
          ) && (
            <button
              onMouseDown={handleSuggestionMouseDown}
              onClick={() => {
                onAddParticipant(value.trim())
                onChange("")
                setIsOpen(false)
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-t border-gray-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">+</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Add "{value.trim()}"</div>
                  <div className="text-sm text-gray-500">New participant</div>
                </div>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Help text */}
      {hasLoaded && suggestions.length > 0 && (
        <p className="text-xs text-gray-500 mt-1">
          💡 {suggestions.length} previous participants available. Click suggestions or press Enter to add.
        </p>
      )}
    </div>
  )
}
