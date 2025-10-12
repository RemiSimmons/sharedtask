import { format } from "date-fns"

export interface CalendarEvent {
  title: string
  description?: string
  startDate: Date
  endDate?: Date
  location?: string
}

/**
 * Generate ICS (iCalendar) content for a calendar event
 */
export function generateICS(event: CalendarEvent): string {
  const { title, description, startDate, endDate, location } = event
  
  // Format dates for ICS (YYYYMMDDTHHMMSSZ)
  const formatDateForICS = (date: Date): string => {
    return format(date, "yyyyMMdd'T'HHmmss'Z'")
  }
  
  const startDateFormatted = formatDateForICS(startDate)
  const endDateFormatted = endDate ? formatDateForICS(endDate) : formatDateForICS(new Date(startDate.getTime() + 60 * 60 * 1000)) // Default 1 hour duration
  
  // Escape special characters for ICS format
  const escapeICS = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '')
  }
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SharedTask//Event Calendar//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}-${Math.random().toString(36).substr(2, 9)}@sharedtask.app`,
    `DTSTAMP:${formatDateForICS(new Date())}`,
    `DTSTART:${startDateFormatted}`,
    `DTEND:${endDateFormatted}`,
    `SUMMARY:${escapeICS(title)}`,
    description ? `DESCRIPTION:${escapeICS(description)}` : '',
    location ? `LOCATION:${escapeICS(location)}` : '',
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(line => line !== '').join('\r\n')
  
  return icsContent
}

/**
 * Download ICS file
 */
export function downloadICS(icsContent: string, filename: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Clean up the URL object
  URL.revokeObjectURL(url)
}

/**
 * Generate filename for ICS file
 */
export function generateICSFilename(projectName: string, taskTitle: string): string {
  // Clean up names for filename
  const cleanProject = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  
  const cleanTask = taskTitle
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  
  return `${cleanProject}-${cleanTask}.ics`
}
