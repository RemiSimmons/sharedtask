"use client"

import { MapPin, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface ClickableLocationProps {
  location: string
  className?: string
  showIcon?: boolean
  showExternalIcon?: boolean
}

export function ClickableLocation({
  location,
  className,
  showIcon = true,
  showExternalIcon = true
}: ClickableLocationProps) {
  if (!location || location.trim() === "") {
    return null
  }

  const handleClick = () => {
    const encodedLocation = encodeURIComponent(location.trim())
    const mapsUrl = `https://maps.google.com/maps?q=${encodedLocation}`
    window.open(mapsUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-sm",
        className
      )}
      title={`View ${location} on Google Maps`}
    >
      {showIcon && <MapPin className="h-3 w-3 flex-shrink-0" />}
      <span className="truncate">{location}</span>
      {showExternalIcon && <ExternalLink className="h-3 w-3 flex-shrink-0" />}
    </button>
  )
}
