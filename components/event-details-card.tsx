"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Edit3, MapPin, Calendar, Users, Palette, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { TimePicker } from "@/components/ui/time-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface EventDetailsCardProps {
  eventLocation?: string
  eventDate?: Date
  eventTime?: Date
  eventAttire?: string
  maxContributors?: number
  onUpdate: (updates: {
    eventLocation?: string
    eventDate?: Date
    eventTime?: Date
    eventAttire?: string
    maxContributors?: number
  }) => void
  isOwner?: boolean
}

export function EventDetailsCard({
  eventLocation,
  eventDate,
  eventTime,
  eventAttire,
  maxContributors,
  onUpdate,
  isOwner = false
}: EventDetailsCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState({
    eventLocation: eventLocation || "",
    eventDate: eventDate,
    eventTime: eventTime,
    eventAttire: eventAttire || "",
    maxContributors: maxContributors || 1
  })
  const [locationError, setLocationError] = useState("")
  const [locationWarning, setLocationWarning] = useState("")

  // Load current saved values when entering edit mode
  const handleEditClick = () => {
    setEditedData({
      eventLocation: eventLocation || "",
      eventDate: eventDate,
      eventTime: eventTime,
      eventAttire: eventAttire || "",
      maxContributors: maxContributors || 1
    })
    setLocationError("")
    setLocationWarning("")
    setIsEditing(true)
  }

  // Improved address quality checking with warnings
  const checkAddressQuality = (location: string): { isValid: boolean; warning: string } => {
    if (!location.trim()) return { isValid: true, warning: "" }
    
    const trimmed = location.trim()
    
    // Check for minimum address components
    const hasNumber = /\d/.test(trimmed)
    const hasLetters = /[a-zA-Z]{2,}/.test(trimmed) // At least 2 consecutive letters
    const hasStreetIndicator = /\b(st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|way|ct|court|pl|place|pkwy|parkway)\b/i.test(trimmed)
    const hasComma = /,/.test(trimmed)
    const hasMultipleWords = trimmed.split(/\s+/).length >= 2 // At least 2 words (e.g., "123 Main")
    const isLongEnough = trimmed.length >= 8
    const hasSpace = /\s/.test(trimmed)
    
    // Hard fail: obvious fake entries
    if (!hasNumber || !hasLetters) {
      return { 
        isValid: false, 
        warning: "Address should include both a street number and name"
      }
    }
    
    // Hard fail: no spaces means it's likely just random text (e.g., "table1")
    if (!hasSpace) {
      return {
        isValid: false,
        warning: "Please enter a valid address with a street number and name (e.g., 123 Main St)"
      }
    }
    
    // Hard fail: too short to be a real address
    if (trimmed.length < 5) {
      return {
        isValid: false,
        warning: "Address is too short. Please enter a complete street address"
      }
    }
    
    // Warning: looks incomplete but might be valid
    if (!hasComma && !hasMultipleWords) {
      return { 
        isValid: true, 
        warning: "⚠️ This may be incomplete. A full address includes: Street, City, State (e.g., 123 Main St, Austin, TX)"
      }
    }
    
    if (!isLongEnough || (!hasStreetIndicator && !hasComma)) {
      return { 
        isValid: true, 
        warning: "⚠️ Consider adding City and State for clarity (e.g., 123 Main St, Austin, TX)"
      }
    }
    
    return { isValid: true, warning: "" }
  }

  const handleSave = () => {
    // Check location quality if provided
    if (editedData.eventLocation) {
      const { isValid, warning } = checkAddressQuality(editedData.eventLocation)
      
      // Hard block only if completely invalid
      if (!isValid) {
        setLocationError(warning)
        setLocationWarning("")
        return
      }
      
      // Show warning but allow save
      setLocationError("")
      setLocationWarning(warning)
    } else {
      setLocationError("")
      setLocationWarning("")
    }

    onUpdate({
      eventLocation: editedData.eventLocation || undefined,
      eventDate: editedData.eventDate,
      eventTime: editedData.eventTime,
      eventAttire: editedData.eventAttire || undefined,
      maxContributors: editedData.maxContributors
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    // Reset to saved values
    setEditedData({
      eventLocation: eventLocation || "",
      eventDate: eventDate,
      eventTime: eventTime,
      eventAttire: eventAttire || "",
      maxContributors: maxContributors || 1
    })
    setLocationError("")
    setLocationWarning("")
    setIsEditing(false)
  }

  const formatEventDateTime = (date: Date | undefined, time: Date | undefined) => {
    if (!date || !time) return "No date set"
    const combinedDateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 
                                     time.getHours(), time.getMinutes(), 0, 0)
    return format(combinedDateTime, "EEE, MMM d, yyyy 'at' h:mm a")
  }

  // Check if date/time is missing
  const hasDateTime = eventDate && eventTime
  const hasLocation = eventLocation && eventLocation.trim().length > 0

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Event Details
          </CardTitle>
          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditClick}
              className="flex items-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isEditing ? (
          // Edit Mode
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Event Date
                </label>
                <DatePicker
                  date={editedData.eventDate}
                  setDate={(date) => setEditedData(prev => ({ ...prev, eventDate: date }))}
                  minDate={new Date()}
                  variant="quick"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ⏰ Event Time
                </label>
                <TimePicker
                  time={editedData.eventTime}
                  setTime={(time) => setEditedData(prev => ({ ...prev, eventTime: time }))}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📍 Location
              </label>
              <Input
                value={editedData.eventLocation}
                onChange={(e) => {
                  setEditedData(prev => ({ ...prev, eventLocation: e.target.value }))
                  setLocationError("") // Clear error on change
                  setLocationWarning("") // Clear warning on change
                }}
                placeholder="Enter address (e.g., 123 Main St, City, State)"
              />
              {locationError && (
                <p className="text-red-600 text-sm mt-1 font-medium">{locationError}</p>
              )}
              {locationWarning && !locationError && (
                <p className="text-amber-600 text-sm mt-1 flex items-start gap-1">
                  <span>{locationWarning}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  👕 Attire
                </label>
                <Input
                  value={editedData.eventAttire}
                  onChange={(e) => setEditedData(prev => ({ ...prev, eventAttire: e.target.value }))}
                  placeholder="e.g., Casual, Business casual..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  👥 Max Guests per Task
                </label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={editedData.maxContributors}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    if (val >= 1 && val <= 20) {
                      setEditedData(prev => ({ ...prev, maxContributors: val }))
                    }
                  }}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} className="flex-1">
                Save Changes
              </Button>
              <Button variant="outline" onClick={handleCancel} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          // View Mode
          <div className="space-y-4">
            {/* Warning if no date/time set */}
            {!hasDateTime && isOwner && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No date and time selected for this event.{" "}
                  <button 
                    onClick={handleEditClick}
                    className="underline font-semibold hover:no-underline"
                  >
                    Set now
                  </button>
                  {" or "}
                  <button 
                    onClick={() => {/* Ignore - just close alert */}}
                    className="underline font-semibold hover:no-underline"
                  >
                    ignore
                  </button>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Date & Time</p>
                  <p className={`text-sm ${hasDateTime ? 'text-gray-600' : 'text-muted-foreground italic'}`}>
                    {formatEventDateTime(eventDate, eventTime)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Location</p>
                  <p className={`text-sm ${hasLocation ? 'text-gray-600' : 'text-muted-foreground italic'}`}>
                    {hasLocation ? eventLocation : 'No location set'}
                  </p>
                </div>
              </div>

              {eventAttire && (
                <div className="flex items-center gap-3">
                  <Palette className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Attire</p>
                    <Badge variant="outline" className="text-xs">
                      {eventAttire}
                    </Badge>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-orange-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Max Guests</p>
                  <Badge variant="outline" className="text-xs">
                    {maxContributors || 1} per task
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
