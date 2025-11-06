"use client"

import React, { useEffect, useState, useRef } from "react"
import { format } from "date-fns"
import { Calendar, MapPin, Users, Palette, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { CalendarExportButton } from "@/components/calendar-export-button"
import { ClickableLocation } from "@/components/clickable-location"
import { useTask } from "@/contexts/TaskContextWithSupabase"
import { useIsMobile } from "@/hooks/use-mobile"

interface EventDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EventDetailsModal({ open, onOpenChange }: EventDetailsModalProps) {
  const { projectSettings } = useTask()
  const isMobile = useIsMobile()
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const swipeStartY = useRef<number | null>(null)
  const swipeThreshold = 50 // pixels

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Parse eventTime from ISO string to separate date and time
  const parseEventTime = (eventTime?: string | null) => {
    if (!eventTime) return { date: undefined, time: undefined }
    
    try {
      const dateTime = new Date(eventTime)
      
      if (isNaN(dateTime.getTime())) {
        return { date: undefined, time: undefined }
      }
      
      const date = new Date(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate())
      const time = new Date()
      time.setHours(dateTime.getHours(), dateTime.getMinutes(), 0, 0)
      return { date, time }
    } catch (error) {
      console.error('Error parsing event time:', error)
      return { date: undefined, time: undefined }
    }
  }

  const { date: eventDate, time: eventTime } = parseEventTime(projectSettings.eventTime)

  const formatEventDateTime = (date: Date | undefined, time: Date | undefined) => {
    if (!date || !time) return null
    const combinedDateTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes(),
      0,
      0
    )
    return format(combinedDateTime, "MMM d, yyyy • h:mm a")
  }

  const hasDateTime = eventDate && eventTime
  const hasLocation = projectSettings.eventLocation && projectSettings.eventLocation.trim().length > 0
  const hasDescription = projectSettings.projectDescription && projectSettings.projectDescription.trim().length > 0

  // Calculate expected attendees count
  const expectedAttendees = projectSettings.activeContributors?.length || 0

  // Description truncation
  const descriptionText = projectSettings.projectDescription || ''
  const shouldTruncate = descriptionText.length > 100
  const truncatedDescription = shouldTruncate && !isDescriptionExpanded 
    ? descriptionText.substring(0, 100) + '...'
    : descriptionText

  // Swipe gesture handlers for mobile (only on drag handle/header area)
  const handleDragAreaTouchStart = (e: React.TouchEvent) => {
    swipeStartY.current = e.touches[0].clientY
  }

  const handleDragAreaTouchMove = (e: React.TouchEvent) => {
    if (!swipeStartY.current) return
    const currentY = e.touches[0].clientY
    const deltaY = currentY - swipeStartY.current
    
    // Only allow downward swipe
    if (deltaY > 0) {
      e.preventDefault()
    }
  }

  const handleDragAreaTouchEnd = (e: React.TouchEvent) => {
    if (!swipeStartY.current) return
    const endY = e.changedTouches[0].clientY
    const deltaY = endY - swipeStartY.current
    
    if (deltaY > swipeThreshold) {
      onOpenChange(false)
    }
    
    swipeStartY.current = null
  }

  // Event content component (shared between mobile and desktop)
  const EventContent = () => (
    <div className="space-y-4">
      {/* Date and Time */}
      {hasDateTime && (
        <div className="flex items-center gap-2 text-base text-gray-700">
          <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <span>{formatEventDateTime(eventDate, eventTime)}</span>
        </div>
      )}

      {/* Location */}
      {hasLocation && (
        <div className="flex items-center gap-2 text-base text-gray-700">
          <MapPin className="h-4 w-4 text-green-600 flex-shrink-0" />
          <ClickableLocation 
            location={projectSettings.eventLocation || ''}
            className="text-base text-gray-700"
          />
        </div>
      )}

      {/* Description */}
      {hasDescription && (
        <div className="text-base text-gray-700">
          <p className="whitespace-pre-wrap">{truncatedDescription}</p>
          {shouldTruncate && (
            <button
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              className="text-blue-600 hover:text-blue-700 font-medium mt-1 text-sm"
            >
              {isDescriptionExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {/* Attire */}
      {projectSettings.eventAttire && (
        <div className="flex items-center gap-2 text-base text-gray-700">
          <Palette className="h-4 w-4 text-purple-600 flex-shrink-0" />
          <span>{projectSettings.eventAttire}</span>
        </div>
      )}

      {/* Expected Attendees */}
      <div className="flex items-center gap-2 text-base text-gray-700">
        <Users className="h-4 w-4 text-orange-600 flex-shrink-0" />
        <span>
          {expectedAttendees} {expectedAttendees === 1 ? 'person' : 'people'} attending
        </span>
      </div>

      {/* Add to Calendar */}
      {projectSettings.eventTime && (
        <div className="pt-4 border-t">
          <CalendarExportButton
            taskTitle={projectSettings.projectName || "Event"}
            taskDescription={projectSettings.projectDescription || undefined}
            eventDateTime={projectSettings.eventTime}
            eventLocation={projectSettings.eventLocation || undefined}
            projectName={projectSettings.projectName || "Event"}
            className="w-full"
            variant="default"
            size="default"
          />
        </div>
      )}
    </div>
  )

  // Mobile drawer view
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent 
          className="max-h-[70vh] rounded-t-2xl"
          direction="bottom"
        >
          {/* Drag Handle - Swipeable area */}
          <div 
            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
            onTouchStart={handleDragAreaTouchStart}
            onTouchMove={handleDragAreaTouchMove}
            onTouchEnd={handleDragAreaTouchEnd}
          >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>

          {/* Header with Event Name and Close Button - Also swipeable */}
          <DrawerHeader 
            className="px-4 pb-2"
            onTouchStart={handleDragAreaTouchStart}
            onTouchMove={handleDragAreaTouchMove}
            onTouchEnd={handleDragAreaTouchEnd}
          >
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-lg font-bold text-left flex-1">
                {projectSettings.projectName || "Untitled Event"}
              </DrawerTitle>
              <button
                onClick={() => onOpenChange(false)}
                className="rounded-lg p-2 hover:bg-gray-100 active:bg-gray-200 transition-colors flex-shrink-0 ml-2 touch-manipulation"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </DrawerHeader>

          {/* Scrollable Content */}
          <div className="px-4 pb-6 overflow-y-auto flex-1">
            <EventContent />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  // Desktop dialog view
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onEscapeKeyDown={() => onOpenChange(false)}
        onPointerDownOutside={() => onOpenChange(false)}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              {projectSettings.projectName || "Untitled Event"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="mt-4">
          <EventContent />
        </div>
      </DialogContent>
    </Dialog>
  )
}
