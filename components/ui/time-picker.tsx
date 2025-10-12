"use client"

import * as React from "react"
import { format } from "date-fns"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TimePickerProps {
  time?: Date
  setTime: (time: Date | undefined) => void
  className?: string
}

export function TimePicker({
  time,
  setTime,
  className,
}: TimePickerProps) {
  // Generate time slots
  const generateTimeSlots = () => {
    const slots = []
    
    // Generate every 15 minutes from 6 AM to 11 PM
    for (let hour = 6; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        if (hour === 23 && minute > 45) break // Stop at 11:45 PM
        
        const slotDate = new Date()
        slotDate.setHours(hour, minute, 0, 0)
        
        slots.push({
          date: slotDate,
          time: format(slotDate, "h:mm a"),
          hour: hour,
          minute: minute,
          period: hour >= 12 ? "PM" : "AM"
        })
      }
    }
    
    return slots
  }

  const timeSlots = generateTimeSlots()

  const handleTimeSelect = (selectedTime: Date) => {
    setTime(selectedTime)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !time && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {time ? (
            format(time, "h:mm a")
          ) : (
            <span>Pick a time</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-4">Choose time</h3>
          <ScrollArea className="h-[300px]">
            <div className="space-y-1">
              {timeSlots.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => handleTimeSelect(slot.date)}
                  className={cn(
                    "w-full text-left px-4 py-2 rounded-lg transition-colors",
                    "hover:bg-accent",
                    time && format(time, "HH:mm") === format(slot.date, "HH:mm")
                      ? "bg-primary text-primary-foreground font-medium"
                      : "bg-transparent"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{slot.time}</span>
                    {time && format(time, "HH:mm") === format(slot.date, "HH:mm") && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}
