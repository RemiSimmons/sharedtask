"use client"

import React from "react"
import { useTask } from "@/contexts/TaskContextWithSupabase"
import { EventDetailsCard } from "@/components/event-details-card"

export function EventDetailsSection() {
  const { projectSettings, updateProjectSettings } = useTask()

  // Parse eventTime from ISO string to separate date and time
  const parseEventTime = (eventTime?: string) => {
    if (!eventTime) return { date: undefined, time: undefined }
    
    try {
      const dateTime = new Date(eventTime)
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
    eventName?: string
    eventDescription?: string
    eventLocation?: string
    eventDate?: Date
    eventTime?: Date
    eventAttire?: string
    maxContributors?: number
  }) => {
    try {
      // Combine date and time into ISO string if both are provided
      let combinedEventTime = projectSettings.eventTime
      
      if (updates.eventDate && updates.eventTime) {
        const combinedDateTime = new Date(
          updates.eventDate.getFullYear(),
          updates.eventDate.getMonth(),
          updates.eventDate.getDate(),
          updates.eventTime.getHours(),
          updates.eventTime.getMinutes(),
          0,
          0
        )
        combinedEventTime = combinedDateTime.toISOString()
      } else if (updates.eventDate) {
        const combinedDateTime = new Date(
          updates.eventDate.getFullYear(),
          updates.eventDate.getMonth(),
          updates.eventDate.getDate(),
          eventTime?.getHours() || 18,
          eventTime?.getMinutes() || 0,
          0,
          0
        )
        combinedEventTime = combinedDateTime.toISOString()
      } else if (updates.eventTime) {
        const combinedDateTime = new Date(
          eventDate?.getFullYear() || new Date().getFullYear(),
          eventDate?.getMonth() || new Date().getMonth(),
          eventDate?.getDate() || new Date().getDate(),
          updates.eventTime.getHours(),
          updates.eventTime.getMinutes(),
          0,
          0
        )
        combinedEventTime = combinedDateTime.toISOString()
      }

      await updateProjectSettings({
        eventLocation: updates.eventLocation,
        eventTime: combinedEventTime,
        eventAttire: updates.eventAttire,
      })
    } catch (error) {
      console.error('Failed to update event details:', error)
      throw error
    }
  }

  return (
    <EventDetailsCard
      eventName={projectSettings.projectName || ""}
      eventDescription={projectSettings.eventDescription}
      eventLocation={projectSettings.eventLocation}
      eventDate={eventDate}
      eventTime={eventTime}
      eventAttire={projectSettings.eventAttire}
      maxContributors={projectSettings.maxContributorsPerTask}
      onUpdate={handleEventUpdate}
      isOwner={true}
    />
  )
}
