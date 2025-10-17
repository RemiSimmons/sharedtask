"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  setDate: (date: Date | undefined) => void
  minDate?: Date
  maxDate?: Date
  className?: string
  variant?: "default" | "quick"
}

export function DatePicker({
  date,
  setDate,
  minDate,
  maxDate,
  className,
  variant = "default",
}: DatePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)

  React.useEffect(() => {
    setSelectedDate(date)
  }, [date])

  const handleDateSelect = (newDate: Date | undefined) => {
    setSelectedDate(newDate)
    setDate(newDate)
    // Close the popover after selection
    setIsCalendarOpen(false)
  }


  if (variant === "quick") {
    return (
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
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
              format(date, "EEE, MMM d, yyyy")
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[380px] p-0" align="start">
          <div className="p-6">
            <h3 className="font-semibold text-xl mb-6 text-center">Choose Date</h3>
            
            {/* Custom Calendar Header */}
            <div className="mb-4">
              <div className="flex items-center justify-center gap-4 mb-4">
                <button
                  onClick={() => {
                    const newDate = new Date(selectedDate || new Date())
                    newDate.setMonth(newDate.getMonth() - 1)
                    handleDateSelect(newDate)
                  }}
                  className="h-8 w-8 bg-transparent p-0 opacity-60 hover:opacity-100 hover:bg-accent rounded-md transition-all flex items-center justify-center"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <h3 className="text-lg font-semibold min-w-[120px] text-center">
                  {selectedDate ? format(selectedDate, "MMMM yyyy") : format(new Date(), "MMMM yyyy")}
                </h3>
                
                <button
                  onClick={() => {
                    const newDate = new Date(selectedDate || new Date())
                    newDate.setMonth(newDate.getMonth() + 1)
                    handleDateSelect(newDate)
                  }}
                  className="h-8 w-8 bg-transparent p-0 opacity-60 hover:opacity-100 hover:bg-accent rounded-md transition-all flex items-center justify-center"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Large Calendar View */}
            <div className="mb-6">
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
                className="rounded-md border-0"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4",
                  caption: "hidden", // Hide default caption
                  caption_label: "hidden",
                  nav: "hidden", // Hide default navigation
                  nav_button: "hidden",
                  nav_button_previous: "hidden",
                  nav_button_next: "hidden",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-9 font-normal text-sm",
                  row: "flex w-full mt-2",
                  cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: cn(
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  ),
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                  day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  // Default calendar variant
  return (
    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
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
            format(date, "EEE, MMM d, yyyy")
          ) : (
            <span>Pick a date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={(date) => {
            if (minDate && date < minDate) return true
            if (maxDate && date > maxDate) return true
            return false
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
