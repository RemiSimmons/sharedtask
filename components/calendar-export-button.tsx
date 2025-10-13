"use client"

import { useState } from "react"
import { Calendar, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { generateICS, downloadICS, generateICSFilename, type CalendarEvent } from "@/lib/calendar-utils"

interface CalendarExportButtonProps {
  taskTitle: string
  taskDescription?: string
  eventDateTime?: string
  eventLocation?: string
  projectName: string
  className?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
}

export function CalendarExportButton({
  taskTitle,
  taskDescription,
  eventDateTime,
  eventLocation,
  projectName,
  className,
  variant = "outline",
  size = "sm"
}: CalendarExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (!eventDateTime) {
      console.warn("No event date/time available for calendar export")
      return
    }

    setIsExporting(true)

    try {
      // Validate the date string before creating Date object
      const startDate = new Date(eventDateTime)
      
      // Check if the date is valid
      if (isNaN(startDate.getTime())) {
        console.error("Invalid event date/time:", eventDateTime)
        return
      }
      
      // Create calendar event
      const event: CalendarEvent = {
        title: taskTitle,
        description: taskDescription || `Task from ${projectName}`,
        startDate: startDate,
        endDate: new Date(startDate.getTime() + 60 * 60 * 1000), // Default 1 hour duration
        location: eventLocation
      }

      // Generate ICS content
      const icsContent = generateICS(event)
      
      // Generate filename
      const filename = generateICSFilename(projectName, taskTitle)
      
      // Download the file
      downloadICS(icsContent, filename)
      
    } catch (error) {
      console.error("Error exporting to calendar:", error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting || !eventDateTime}
      variant={variant}
      size={size}
      className={className}
      title="Add to Calendar"
    >
      {isExporting ? (
        <Download className="h-4 w-4 animate-spin" />
      ) : (
        <Calendar className="h-4 w-4" />
      )}
      <span className="ml-1.5">Add to Calendar</span>
    </Button>
  )
}
