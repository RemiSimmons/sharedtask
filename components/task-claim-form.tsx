"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTask } from "@/contexts/TaskContextWithSupabase"

export default function TaskClaimForm() {
  const { 
    tasks, 
    projectSettings, 
    claimTask, 
    addTasks,
    addTaskAndClaim, 
    activeContributors,
    selectedTasksForClaiming,
    currentContributorName,
    setCurrentContributorName,
    clearClaimingSelection,
    claimSelectedTasks
  } = useTask()
  const [selectedName, setSelectedName] = useState<string>("")
  const [selectedTask, setSelectedTask] = useState<string>("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customName, setCustomName] = useState<string>("")
  const [customTask, setCustomTask] = useState<string>("")

  const [showMultipleClaimPrompt, setShowMultipleClaimPrompt] = useState(false)
  const [claimedTaskName, setClaimedTaskName] = useState("")

  // Get available tasks from context (including tasks that can accept more contributors)
  const availableTasks = tasks.filter(task => {
    if (task.status === "available") {
      return true
    }
    if (task.status === "claimed" && projectSettings.allowMultipleContributors) {
      // If no max limit is set, or if under the limit
      if (!task.maxContributors) {
        return true
      }
      return task.claimedBy && task.claimedBy.length < task.maxContributors
    }
    return false
  }).map(task => {
    const currentCount = task.claimedBy?.length || 0
    const isFull = task.maxContributors ? currentCount >= task.maxContributors : false
    const alreadyJoined = currentContributorName && task.claimedBy?.includes(currentContributorName)
    
    return {
      id: task.id,
      name: task.name,
      status: task.status,
      claimedBy: task.claimedBy,
      maxContributors: task.maxContributors,
      currentCount,
      isFull,
      alreadyJoined
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const finalName = selectedName === "new" ? customName : selectedName
    const finalTask = selectedTask === "custom" ? customTask : selectedTask

    if (!finalName || !finalTask) {
      return
    }

    setIsSubmitting(true)

    // Update the shared contributor name
    setCurrentContributorName(finalName)

    try {
      // Check if user is adding a new name and if they're allowed to
      if (selectedName === "new" && !projectSettings.allowContributorsAddNames) {
        throw new Error('You are not allowed to add new names to this project. Please select an existing name.')
      }

      if (selectedTask === "custom") {
        // Check if contributors are allowed to add tasks
        if (!projectSettings.allowContributorsAddTasks) {
          throw new Error('You are not allowed to add custom tasks to this project')
        }
        
        // Add new custom task and claim it atomically
        await addTaskAndClaim(customTask, finalName)
        setClaimedTaskName(customTask)
      } else {
        // Claim existing task
        await claimTask(selectedTask, finalName)
        const taskName = availableTasks.find((t) => t.id === selectedTask)?.name || ""
        setClaimedTaskName(taskName)
      }

      if (projectSettings.allowMultipleClaims) {
        setShowMultipleClaimPrompt(true)
      } else {
        setShowSuccess(true)
        // Reset form after 3 seconds for single claim mode
        setTimeout(() => {
          setShowSuccess(false)
          setSelectedName("")
          setSelectedTask("")
          setCustomName("")
          setCustomTask("")
        }, 3000)
      }
    } catch (error) {
      console.error('Failed to claim task:', error)
      alert(`Failed to claim task: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle claiming selected tasks from task table
  const handleClaimSelectedTasks = async () => {
    if (selectedTasksForClaiming.length === 0) {
      return
    }

    if (!currentContributorName.trim()) {
      alert('Please enter your name first')
      return
    }

    setIsSubmitting(true)

    try {
      await claimSelectedTasks()
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to claim selected tasks:', error)
      alert(`Failed to claim tasks: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClaimAnother = () => {
    setShowMultipleClaimPrompt(false)
    // Only reset task selection, keep name
    setSelectedTask("")
    setCustomTask("")
  }

  const handleFinishClaiming = () => {
    setShowMultipleClaimPrompt(false)
    setShowSuccess(true)
    // Reset entire form after 3 seconds
    setTimeout(() => {
      setShowSuccess(false)
      setSelectedName("")
      setSelectedTask("")
      setCustomName("")
      setCustomTask("")
    }, 3000)
  }

  const isFormValid = () => {
    const hasValidName = selectedName && (selectedName !== "new" || customName.trim())
    const hasValidTask = selectedTask && (selectedTask !== "custom" || customTask.trim())
    return hasValidName && hasValidTask
  }

  return (
    <div className="max-w-2xl mx-auto px-3" data-task-claim-form="true">
      <div className="card-form p-7 md:p-8">
        <div className="flex items-center justify-center mb-8 md:mb-8">
          <svg className="w-10 h-10 md:w-8 md:h-8 text-blue-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h2 className="text-3xl md:text-2xl font-bold text-gray-900 text-center mb-0">Pick a Task</h2>
        </div>
        <div className="space-y-8 md:space-y-8">
          {showSuccess ? (
            <div className="text-center py-10 md:py-8 space-y-5 md:space-y-4">
              <div className="w-20 h-20 md:w-16 md:h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 md:w-8 md:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-3xl md:text-xl font-bold md:font-semibold text-gray-900">Success!</h3>
              <p className="text-2xl md:text-lg text-gray-700 md:text-muted-foreground">You claimed the task</p>
            </div>
          ) : showMultipleClaimPrompt ? (
            <div className="text-center py-10 md:py-8 space-y-7 md:space-y-6">
              <div className="w-20 h-20 md:w-16 md:h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 md:w-8 md:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="space-y-3 md:space-y-2">
                <h3 className="text-3xl md:text-xl font-bold md:font-semibold text-gray-900">Success!</h3>
                <p className="text-2xl md:text-lg text-gray-700 md:text-muted-foreground">
                  You claimed: <span className="font-bold text-gray-900">{claimedTaskName}</span>
                </p>
              </div>
              <div className="space-y-5 md:space-y-3">
                <p className="text-xl md:text-base text-gray-700 md:text-muted-foreground font-medium">Want to claim another?</p>
                <div className="flex flex-col md:flex-row gap-4 md:gap-3 justify-center">
                  <Button
                    onClick={handleClaimAnother}
                    className="text-xl md:text-base px-8 py-6 md:px-6 md:py-3 h-auto md:h-12 font-semibold md:font-medium bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Claim Another Task
                  </Button>
                  <Button
                    onClick={handleFinishClaiming}
                    variant="outline"
                    className="text-xl md:text-base px-8 py-6 md:px-6 md:py-3 h-auto md:h-12 font-semibold md:font-medium border-2 md:border"
                  >
                    I'm Done
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">

              {/* Selected Tasks from Table */}
              {selectedTasksForClaiming.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      Selected Tasks ({selectedTasksForClaiming.length})
                    </h3>
                    <p className="text-sm text-blue-700">
                      Add your name below to claim all selected tasks at once.
                    </p>
                  </div>
                  <div className="space-y-2 mb-4">
                    {selectedTasksForClaiming.map(taskId => {
                      const task = tasks.find(t => t.id === taskId)
                      return task ? (
                        <div key={taskId} className="flex items-center justify-between bg-white rounded p-3 border border-blue-200">
                          <span className="font-medium">{task.name}</span>
                          <button
                            type="button"
                            onClick={() => {/* Remove task from selection - this functionality needs to be implemented */}}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ) : null
                    })}
                  </div>
                  {currentContributorName.trim() && (
                    <div className="mb-4">
                      <p className="text-sm text-blue-700">
                        Claiming as: <strong>{currentContributorName}</strong>
                      </p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={handleClaimSelectedTasks}
                      disabled={isSubmitting || !currentContributorName.trim()}
                      className="flex-1"
                    >
                      {isSubmitting ? 'Claiming...' : `Claim ${selectedTasksForClaiming.length} Task${selectedTasksForClaiming.length !== 1 ? 's' : ''}`}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearClaimingSelection}
                      disabled={isSubmitting}
                    >
                      Clear
                    </Button>
                  </div>
                  <hr className="my-6 border-blue-200" />
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8 md:space-y-8">
              <div className="space-y-4 md:space-y-3">
                <label htmlFor="name-select" className="text-2xl md:text-lg font-bold md:font-semibold text-gray-900 block">
                  Your Name
                </label>
                <Select 
                  value={selectedName} 
                  onValueChange={(value) => {
                    setSelectedName(value)
                    // Update shared name when selecting from existing contributors
                    if (value !== "new") {
                      setCurrentContributorName(value)
                    }
                  }}
                >
                  <SelectTrigger className="select-trigger">
                    <SelectValue placeholder="Choose your name..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-80 overflow-y-auto">
                    {activeContributors.length > 0 ? (
                      activeContributors.map((name) => (
                        <SelectItem key={name} value={name} className="text-base py-3">
                          {name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="placeholder" disabled className="text-base py-3 text-gray-500">
                        No contributors yet - add your name below
                      </SelectItem>
                    )}
                    {projectSettings.allowContributorsAddNames && (
                      <SelectItem value="new" className="text-base py-3 font-medium text-secondary">
                        {activeContributors.length > 0 ? "Add New Name" : "Add Your Name"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>

                {(selectedName === "new" || (activeContributors.length === 0 && projectSettings.allowContributorsAddNames)) && (
                  <div className="space-y-3 md:space-y-2">
                    <label htmlFor="custom-name" className="text-xl md:text-base font-bold md:font-medium text-gray-900 block">
                      Type Your Name
                    </label>
                    <input
                      id="custom-name"
                      type="text"
                      value={customName}
                      onChange={(e) => {
                        setCustomName(e.target.value)
                        setCurrentContributorName(e.target.value)
                      }}
                      placeholder="Your name..."
                      maxLength={50}
                      className="form-input text-xl md:text-base py-4 md:py-2 px-4 md:px-3"
                      autoFocus={activeContributors.length === 0}
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      {customName.length}/50 characters
                    </p>
                    {activeContributors.length === 0 && (
                      <p className="text-lg md:text-sm text-gray-700 md:text-gray-600 font-medium md:font-normal">
                        💡 You'll be the first person on this project
                      </p>
                    )}
                  </div>
                )}
                
                {/* Show message when contributors can't add names and list is empty */}
                {activeContributors.length === 0 && !projectSettings.allowContributorsAddNames && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      ⚠️ No contributor names are available yet. The host needs to add contributor names or enable the "Allow contributors to add their own names" permission.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4 md:space-y-3">
                <label htmlFor="task-select" className="text-2xl md:text-lg font-bold md:font-semibold text-gray-900 block">
                  Pick a Task
                </label>
                <Select value={selectedTask} onValueChange={setSelectedTask}>
                  <SelectTrigger className="select-trigger">
                    <SelectValue placeholder="Select a task to claim..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-80 overflow-y-auto">
                    {availableTasks.map((task) => (
                      <SelectItem key={task.id} value={task.id} className="text-base py-3" disabled={task.isFull || task.alreadyJoined}>
                        <div className="flex items-center justify-between w-full gap-2">
                          <span className={task.alreadyJoined ? "font-semibold" : ""}>{task.name}</span>
                          <div className="flex items-center gap-2">
                            {task.alreadyJoined && (
                              <span className="text-xs text-green-600 font-semibold">✓ Joined</span>
                            )}
                            {task.isFull && !task.alreadyJoined && (
                              <span className="text-xs text-red-600 font-semibold">FULL</span>
                            )}
                            {task.maxContributors && (
                              <span className="text-xs text-muted-foreground">
                                ({task.currentCount}/{task.maxContributors})
                              </span>
                            )}
                            {!task.maxContributors && task.status === "claimed" && (
                              <span className="text-xs text-muted-foreground">
                                ({task.currentCount} joined)
                              </span>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                    {projectSettings.allowContributorsAddTasks && (
                      <SelectItem value="custom" className="text-base py-3 font-medium text-secondary">
                        Add Custom Task
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>

                {/* Show message when no tasks available and can't add custom tasks */}
                {availableTasks.length === 0 && !projectSettings.allowContributorsAddTasks && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      ⚠️ No tasks are available to claim. The host needs to add tasks or enable the "Allow contributors to add custom tasks" permission.
                    </p>
                  </div>
                )}

                {selectedTask === "custom" && (
                  <div className="space-y-3 md:space-y-2">
                    <label htmlFor="custom-task" className="text-xl md:text-base font-bold md:font-medium text-gray-900 block">
                      What task do you want to do?
                    </label>
                    <input
                      id="custom-task"
                      type="text"
                      value={customTask}
                      onChange={(e) => setCustomTask(e.target.value)}
                      placeholder="Type your task..."
                      maxLength={100}
                      className="form-input text-xl md:text-base py-4 md:py-2 px-4 md:px-3"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      {customTask.length}/100 characters
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!isFormValid() || isSubmitting}
                className={`w-full btn-primary text-2xl md:text-base py-6 md:py-3 font-bold md:font-medium min-h-[64px] md:min-h-0 whitespace-nowrap ${(!isFormValid() || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? "Claiming..." : "Claim This Task"}
              </button>
            </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
