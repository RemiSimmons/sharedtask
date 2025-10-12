"use client"

import * as React from "react"
import { format, addDays, startOfDay } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DateTimePickerProps {
  date?: Date
  setDate: (date: Date | undefined) => void
  minDate?: Date
  className?: string
  variant?: "default" | "mobile"
}

export function DateTimePicker({
  date,
  setDate,
  minDate,
  className,
  variant = "default",
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)
  const [hours, setHours] = React.useState<number>(date ? date.getHours() : 18)
  const [minutes, setMinutes] = React.useState<number>(date ? date.getMinutes() : 0)
  const [period, setPeriod] = React.useState<"AM" | "PM">(
    date ? (date.getHours() >= 12 ? "PM" : "AM") : "PM"
  )

  React.useEffect(() => {
    if (date) {
      setSelectedDate(date)
      setHours(date.getHours())
      setMinutes(date.getMinutes())
      setPeriod(date.getHours() >= 12 ? "PM" : "AM")
    }
  }, [date])

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) return
    
    // Preserve the time when selecting a new date
    newDate.setHours(hours, minutes, 0, 0)
    
    setSelectedDate(newDate)
    setDate(newDate)
  }

  const handleTimeChange = (newHours: number, newMinutes: number, newPeriod: "AM" | "PM") => {
    if (!selectedDate) return

    // Convert to 24-hour format
    let hour24 = newHours
    if (newPeriod === "PM" && newHours !== 12) {
      hour24 = newHours + 12
    } else if (newPeriod === "AM" && newHours === 12) {
      hour24 = 0
    }

    const newDate = new Date(selectedDate)
    newDate.setHours(hour24, newMinutes, 0, 0)

    setDate(newDate)
  }

  const handleHourChange = (newHour: number) => {
    setHours(newHour)
    handleTimeChange(newHour, minutes, period)
  }

  const handleMinuteChange = (newMinute: number) => {
    setMinutes(newMinute)
    handleTimeChange(hours, newMinute, period)
  }

  const handlePeriodChange = (newPeriod: "AM" | "PM") => {
    setPeriod(newPeriod)
    handleTimeChange(hours, minutes, newPeriod)
  }

  // Generate hour options (1-12)
  const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1)
  
  // Generate minute options (0, 5, 10, ..., 55)
  const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5)

  // Convert 24-hour to 12-hour for display
  const display12Hour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours

  // Generate time slots for mobile variant
  const generateTimeSlots = () => {
    const slots = []
    const today = new Date()
    const tomorrow = addDays(today, 1)
    
    // Add today's slots
    for (let hour = 6; hour < 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotDate = new Date(today)
        slotDate.setHours(hour, minute, 0, 0)
        
        if (minDate && slotDate < minDate) continue
        
        slots.push({
          date: slotDate,
          label: "Today",
          time: format(slotDate, "h:mm a"),
          full: format(slotDate, "EEE, MMM d, yyyy 'at' h:mm a")
        })
      }
    }
    
    // Add tomorrow's slots
    for (let hour = 6; hour < 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotDate = new Date(tomorrow)
        slotDate.setHours(hour, minute, 0, 0)
        
        slots.push({
          date: slotDate,
          label: "Tomorrow",
          time: format(slotDate, "h:mm a"),
          full: format(slotDate, "EEE, MMM d, yyyy 'at' h:mm a")
        })
      }
    }
    
    // Add next 5 days
    for (let dayOffset = 2; dayOffset <= 6; dayOffset++) {
      const dayDate = addDays(today, dayOffset)
      const startHour = 6
      const endHour = 22
      
      for (let hour = startHour; hour < endHour; hour += 2) {
        const slotDate = new Date(dayDate)
        slotDate.setHours(hour, 0, 0, 0)
        
        slots.push({
          date: slotDate,
          label: format(dayDate, "EEE MMM d"),
          time: format(slotDate, "h:mm a"),
          full: format(slotDate, "EEE, MMM d, yyyy 'at' h:mm a")
        })
      }
    }
    
    return slots
  }

  const timeSlots = generateTimeSlots()

  if (variant === "mobile") {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? (
              format(date, "EEE, MMM d, yyyy 'at' h:mm a")
            ) : (
              <span>Pick a date and time</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-4">Pick when you want to start</h3>
            <ScrollArea className="h-[300px]">
              <div className="space-y-1">
                {timeSlots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => setDate(slot.date)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-lg transition-colors",
                      "hover:bg-accent",
                      date && format(date, "yyyy-MM-dd-HH-mm") === format(slot.date, "yyyy-MM-dd-HH-mm")
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-transparent"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{slot.label} {slot.time}</div>
                        {slot.label === "Today" && (
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(), "EEE, MMM d")}
                          </div>
                        )}
                        {slot.label === "Tomorrow" && (
                          <div className="text-xs text-muted-foreground">
                            {format(addDays(new Date(), 1), "EEE, MMM d")}
                          </div>
                        )}
                      </div>
                      {date && format(date, "yyyy-MM-dd-HH-mm") === format(slot.date, "yyyy-MM-dd-HH-mm") && (
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

  // Default desktop variant (original design)
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, "EEE, MMM d, yyyy 'at' h:mm a")
          ) : (
            <span>Pick a date and time</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 space-y-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) => {
              if (minDate) {
                return date < minDate
              }
              return false
            }}
            initialFocus
          />
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Time</Label>
            </div>
            <div className="flex items-center gap-2">
              {/* Hour Select */}
              <div className="flex-1">
                <ScrollArea className="h-[120px] rounded-md border">
                  <div className="p-1">
                    {hourOptions.map((hour) => (
                      <button
                        key={hour}
                        onClick={() => handleHourChange(hour)}
                        className={cn(
                          "w-full px-3 py-2 text-sm rounded hover:bg-accent transition-colors",
                          display12Hour === hour && "bg-primary text-primary-foreground font-medium"
                        )}
                      >
                        {hour}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
                <p className="text-xs text-muted-foreground text-center mt-1">Hour</p>
              </div>

              <span className="text-2xl font-bold text-muted-foreground">:</span>

              {/* Minute Select */}
              <div className="flex-1">
                <ScrollArea className="h-[120px] rounded-md border">
                  <div className="p-1">
                    {minuteOptions.map((minute) => (
                      <button
                        key={minute}
                        onClick={() => handleMinuteChange(minute)}
                        className={cn(
                          "w-full px-3 py-2 text-sm rounded hover:bg-accent transition-colors",
                          minutes === minute && "bg-primary text-primary-foreground font-medium"
                        )}
                      >
                        {minute.toString().padStart(2, "0")}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
                <p className="text-xs text-muted-foreground text-center mt-1">Min</p>
              </div>

              {/* AM/PM Toggle */}
              <div className="flex-1">
                <div className="space-y-1">
                  <button
                    onClick={() => handlePeriodChange("AM")}
                    className={cn(
                      "w-full px-3 py-2 text-sm rounded border transition-colors",
                      period === "AM" 
                        ? "bg-primary text-primary-foreground font-medium" 
                        : "hover:bg-accent"
                    )}
                  >
                    AM
                  </button>
                  <button
                    onClick={() => handlePeriodChange("PM")}
                    className={cn(
                      "w-full px-3 py-2 text-sm rounded border transition-colors",
                      period === "PM" 
                        ? "bg-primary text-primary-foreground font-medium" 
                        : "hover:bg-accent"
                    )}
                  >
                    PM
                  </button>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-1">Period</p>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

