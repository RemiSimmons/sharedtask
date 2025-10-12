"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Edit3, MapPin, Calendar, Users, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { TimePicker } from "@/components/ui/time-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface EventDetailsCardProps {
  eventName: string
  eventDescription?: string
  eventLocation?: string
  eventDate?: Date
  eventTime?: Date
  eventAttire?: string
  maxContributors?: number
  onUpdate: (updates: {
    eventName?: string
    eventDescription?: string
    eventLocation?: string
    eventDate?: Date
    eventTime?: Date
    eventAttire?: string
    maxContributors?: number
  }) => void
  isOwner?: boolean
}

export function EventDetailsCard({
  eventName,
  eventDescription,
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
    eventName,
    eventDescription: eventDescription || "",
    eventLocation: eventLocation || "",
    eventDate: eventDate || new Date(),
    eventTime: eventTime || new Date(),
    eventAttire: eventAttire || "",
    maxContributors: maxContributors || 1
  })

  const handleSave = () => {
    onUpdate(editedData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedData({
      eventName,
      eventDescription: eventDescription || "",
      eventLocation: eventLocation || "",
      eventDate: eventDate || new Date(),
      eventTime: eventTime || new Date(),
      eventAttire: eventAttire || "",
      maxContributors: maxContributors || 1
    })
    setIsEditing(false)
  }

  const formatEventDateTime = (date: Date | undefined, time: Date | undefined) => {
    if (!date || !time) return "Not set"
    const combinedDateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 
                                     time.getHours(), time.getMinutes(), 0, 0)
    return format(combinedDateTime, "EEE, MMM d, yyyy 'at' h:mm a")
  }

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
              onClick={() => setIsEditing(true)}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Name
              </label>
              <Input
                value={editedData.eventName}
                onChange={(e) => setEditedData(prev => ({ ...prev, eventName: e.target.value }))}
                placeholder="Enter event name..."
                maxLength={60}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Textarea
                value={editedData.eventDescription}
                onChange={(e) => setEditedData(prev => ({ ...prev, eventDescription: e.target.value }))}
                placeholder="Add event description..."
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Event Date
                </label>
                <DatePicker
                  date={editedData.eventDate}
                  setDate={(date) => setEditedData(prev => ({ ...prev, eventDate: date || new Date() }))}
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
                  setTime={(time) => setEditedData(prev => ({ ...prev, eventTime: time || new Date() }))}
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
                onChange={(e) => setEditedData(prev => ({ ...prev, eventLocation: e.target.value }))}
                placeholder="Enter location..."
              />
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
                  👥 Max Contributors per Task
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
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{eventName}</h3>
              {eventDescription && (
                <p className="text-gray-600 mt-1">{eventDescription}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Date & Time</p>
                  <p className="text-sm text-gray-600">{formatEventDateTime(eventDate, eventTime)}</p>
                </div>
              </div>

              {eventLocation && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Location</p>
                    <p className="text-sm text-gray-600">{eventLocation}</p>
                  </div>
                </div>
              )}

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
                  <p className="text-sm font-medium text-gray-900">Max Contributors</p>
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
