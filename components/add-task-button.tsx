"use client"

import React, { useState } from "react"
import { useSession } from "next-auth/react"
import { useTask } from "@/contexts/TaskContextWithSupabase"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function AddTaskButton() {
  const { data: session } = useSession()
  const { currentProject, addTasks } = useTask()
  const [isOpen, setIsOpen] = useState(false)
  const [taskName, setTaskName] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if current user is the project owner
  const isOwner = session?.user?.id && currentProject?.user_id === session.user.id

  // Don't show button if not the owner
  if (!isOwner) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!taskName.trim()) {
      setError("Task name is required")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Add task with isHostAction = true to bypass permission checks
      await addTasks([taskName.trim()], taskDescription.trim() || undefined, true)
      
      // Reset form and close dialog
      setTaskName("")
      setTaskDescription("")
      setIsOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add task")
      console.error("Failed to add task:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      // Reset form when dialog closes
      setTaskName("")
      setTaskDescription("")
      setError(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          className="w-full md:w-auto text-xl md:text-base py-6 md:py-3 h-auto md:h-auto font-semibold md:font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
        >
          <svg 
            className="w-6 h-6 md:w-5 md:h-5 mr-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-w-[95vw] p-6 md:p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl md:text-xl font-bold">Add New Task</DialogTitle>
          <DialogDescription className="text-lg md:text-sm">
            Create a new task for contributors to claim
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-4 mt-4">
          <div className="space-y-3 md:space-y-2">
            <Label htmlFor="task-name" className="text-xl md:text-sm font-semibold md:font-medium">
              Task Name *
            </Label>
            <Input
              id="task-name"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Enter task name..."
              maxLength={100}
              className="text-xl md:text-base py-6 md:py-2 px-4 md:px-3 h-auto"
              autoFocus
              disabled={isSubmitting}
            />
            <p className="text-base md:text-xs text-gray-600">
              {taskName.length}/100 characters
            </p>
          </div>

          <div className="space-y-3 md:space-y-2">
            <Label htmlFor="task-description" className="text-xl md:text-sm font-semibold md:font-medium">
              Description (optional)
            </Label>
            <Textarea
              id="task-description"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Add any additional details..."
              maxLength={500}
              rows={4}
              className="text-xl md:text-base py-4 md:py-2 px-4 md:px-3 resize-none"
              disabled={isSubmitting}
            />
            <p className="text-base md:text-xs text-gray-600">
              {taskDescription.length}/500 characters
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 md:p-3">
              <p className="text-base md:text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-3 md:gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || !taskName.trim()}
              className="w-full md:flex-1 text-xl md:text-base py-6 md:py-2 h-auto font-semibold md:font-medium"
            >
              {isSubmitting ? "Adding..." : "Add Task"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              className="w-full md:flex-1 text-xl md:text-base py-6 md:py-2 h-auto font-semibold md:font-medium border-2 md:border"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

