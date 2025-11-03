"use client"

import React from "react"
import { useTask } from "@/contexts/TaskContextWithSupabase"
import { EventDetailsCard } from "@/components/event-details-card"

export function EventDetailsSection() {
  const { projectSettings, updateProjectSettings } = useTask()

  // Parse eventTime from ISO string to separate date and time
  const parseEventTime = (eventTime?: string | null) => {
    if (!eventTime) return { date: undefined, time: undefined }
    
    try {
      const dateTime = new Date(eventTime)
      
      // Check if the date is valid
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

  const handleEventUpdate = async (updates: {
    eventLocation?: string
    eventDate?: Date
    eventTime?: Date
    eventAttire?: string
    maxContributors?: number
  }) => {
    try {
      // Only create ISO timestamp when BOTH date AND time are set
      let combinedEventTime = projectSettings.eventTime
      
      if (updates.eventDate !== undefined || updates.eventTime !== undefined) {
        const finalDate = updates.eventDate !== undefined ? updates.eventDate : eventDate
        const finalTime = updates.eventTime !== undefined ? updates.eventTime : eventTime
        
        // Only set timestamp if both exist
        if (finalDate && finalTime) {
          const combinedDateTime = new Date(
            finalDate.getFullYear(),
            finalDate.getMonth(),
            finalDate.getDate(),
            finalTime.getHours(),
            finalTime.getMinutes(),
            0,
            0
          )
          combinedEventTime = combinedDateTime.toISOString()
        } else {
          // If either is undefined, clear the timestamp
          combinedEventTime = undefined
        }
      }

      await updateProjectSettings({
        eventLocation: updates.eventLocation,
        eventTime: combinedEventTime,
        eventAttire: updates.eventAttire,
        maxContributorsPerTask: updates.maxContributors,
      })
    } catch (error) {
      console.error('Failed to update event details:', error)
      throw error
    }
  }

  return (
    <EventDetailsCard
      eventLocation={projectSettings.eventLocation || undefined}
      eventDate={eventDate}
      eventTime={eventTime}
      eventAttire={projectSettings.eventAttire || undefined}
      maxContributors={projectSettings.maxContributorsPerTask}
      onUpdate={handleEventUpdate}
      isOwner={true}
    />
  )
}
