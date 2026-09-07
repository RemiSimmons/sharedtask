"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useTask } from "@/contexts/TaskContextWithSupabase"

interface TaskClaimFormProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  pendingTaskId?: string | null
  pendingCustomTask?: string | null
}

export default function TaskClaimForm({
  open = false,
  onOpenChange,
  pendingTaskId,
  pendingCustomTask,
}: TaskClaimFormProps) {
  const {
    tasks,
    projectSettings,
    claimTask,
    addTaskAndClaim,
    activeContributors,
    currentContributorName,
    setCurrentContributorName,
  } = useTask()

  const [selectedName, setSelectedName] = useState<string>("")
  const [customName, setCustomName] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    if (currentContributorName) {
      if (activeContributors.includes(currentContributorName)) {
        setSelectedName(currentContributorName)
        setCustomName("")
      } else {
        setSelectedName("new")
        setCustomName(currentContributorName)
      }
    } else {
      setSelectedName("")
      setCustomName("")
    }
  }, [open, currentContributorName, activeContributors])

  const getFinalName = () => {
    if (selectedName === "new" || (selectedName === "" && customName.trim().length > 0)) {
      return customName.trim()
    }
    return selectedName.trim()
  }

  const hasValidName = () => {
    if (selectedName === "new" || (selectedName === "" && customName.trim().length > 0)) {
      return customName.trim().length > 0
    }
    return selectedName.length > 0
  }

  const pendingTaskName = pendingTaskId
    ? tasks.find((task) => task.id === pendingTaskId)?.name
    : pendingCustomTask

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalName = getFinalName()
    if (!finalName) return

    const isAddingNewName = selectedName === "new" || (selectedName === "" && customName.trim().length > 0)
    if (isAddingNewName && !projectSettings.allowContributorsAddNames) {
      setError("You are not allowed to add new names to this project. Please select an existing name.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setCurrentContributorName(finalName)

    try {
      if (pendingCustomTask?.trim()) {
        if (!projectSettings.allowContributorsAddTasks) {
          throw new Error("You are not allowed to add custom tasks to this project")
        }
        await addTaskAndClaim(pendingCustomTask.trim(), finalName)
      } else if (pendingTaskId) {
        await claimTask(pendingTaskId, finalName)
      }
      onOpenChange?.(false)
    } catch (err) {
      console.error("Failed to claim task:", err)
      setError("Couldn't complete your request. Try again or refresh the page.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8 max-h-[85vh] overflow-y-auto">
        <SheetHeader className="px-0 pt-2">
          <SheetTitle className="text-left text-lg">Your name</SheetTitle>
          <SheetDescription className="text-left">
            {pendingTaskName ? `Claiming “${pendingTaskName}”` : "Enter your name to continue"}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2" data-task-claim-form="true">
          {activeContributors.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 block">Choose your name</label>
              <Select
                value={selectedName}
                onValueChange={(value) => {
                  setSelectedName(value)
                  if (value !== "new") {
                    setCurrentContributorName(value)
                    setCustomName("")
                  } else {
                    setCustomName("")
                  }
                }}
              >
                <SelectTrigger className="min-h-[44px] text-base">
                  <SelectValue placeholder="Choose your name..." />
                </SelectTrigger>
                <SelectContent className="max-h-80 overflow-y-auto">
                  {activeContributors.map((name) => (
                    <SelectItem key={name} value={name} className="text-base py-3">
                      {name}
                    </SelectItem>
                  ))}
                  {projectSettings.allowContributorsAddNames && (
                    <SelectItem value="new" className="text-base py-3 font-medium">
                      Add New Name
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {(projectSettings.allowContributorsAddNames &&
            (selectedName === "new" || selectedName === "" || activeContributors.length === 0)) && (
            <div className="space-y-2">
              <label htmlFor="custom-name" className="text-sm font-medium text-gray-900 block">
                Type your name
              </label>
              <input
                id="custom-name"
                type="text"
                value={customName}
                onChange={(e) => {
                  const value = e.target.value
                  setCustomName(value)
                  if (value.trim().length > 0 && selectedName !== "new" && projectSettings.allowContributorsAddNames) {
                    setSelectedName("new")
                  }
                  if (value.trim().length === 0 && activeContributors.length > 0) {
                    setSelectedName("")
                  }
                }}
                placeholder="Your name..."
                maxLength={50}
                className="w-full min-h-[44px] px-3 text-base border border-gray-300 rounded-lg"
                autoFocus={activeContributors.length === 0}
              />
            </div>
          )}

          {activeContributors.length === 0 && !projectSettings.allowContributorsAddNames && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Contact the host to add your name.
            </p>
          )}

          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || !hasValidName()}
            className="w-full min-h-[44px] text-base font-semibold"
          >
            {isSubmitting ? "Saving..." : "Claim"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
