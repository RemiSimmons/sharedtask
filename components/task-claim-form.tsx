"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"
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
    claimSelectedTasks,
    addAttendingOnlyRsvp
  } = useTask()
  const [selectedName, setSelectedName] = useState<string>("")
  const [selectedTask, setSelectedTask] = useState<string>("")
  const [headcount, setHeadcount] = useState<number>(1)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customName, setCustomName] = useState<string>("")
  const [customTask, setCustomTask] = useState<string>("")
  const [isAttendingOnly, setIsAttendingOnly] = useState(false)

  const [showMultipleClaimPrompt, setShowMultipleClaimPrompt] = useState(false)
  const [claimedTaskName, setClaimedTaskName] = useState("")
  const [showFinalSummary, setShowFinalSummary] = useState(false)
  const [claimedTasks, setClaimedTasks] = useState<string[]>([])
  
  // New state for name selection flow
  const [nameConfirmed, setNameConfirmed] = useState(false)
  const [showNameSuccess, setShowNameSuccess] = useState(false)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const hasShownSuccessRef = useRef(false)
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Check if name is confirmed (either selected from dropdown or custom name entered)
  const hasValidName = () => {
    if (selectedName === "new" || (selectedName === "" && customName.trim().length > 0)) {
      return customName.trim().length > 0
    }
    return selectedName.length > 0
  }

  // Handle name confirmation - show success message when name is first confirmed
  useEffect(() => {
    const isValid = hasValidName()
    if (isValid && !hasShownSuccessRef.current) {
      hasShownSuccessRef.current = true
      setNameConfirmed(true)
      setShowNameSuccess(true)
      setIsFadingOut(false)
      
      // Clear any existing timer
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current)
        fadeTimerRef.current = null
      }
      
      // Auto-fade after 3 seconds
      fadeTimerRef.current = setTimeout(() => {
        setIsFadingOut(true)
        setTimeout(() => {
          setShowNameSuccess(false)
        }, 300) // Animation duration
      }, 3000)
    }
  }, [selectedName, customName])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current)
        fadeTimerRef.current = null
      }
    }
  }, [])

  // Handle manual dismiss of success message
  const handleDismissNameSuccess = () => {
    // Clear any existing timer
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current)
      fadeTimerRef.current = null
    }
    setIsFadingOut(true)
    setTimeout(() => {
      setShowNameSuccess(false)
    }, 300)
  }

  // Get available tasks from context (including tasks that can accept more guests)
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

    // Determine final name: if "new" selected or if customName has value but selectedName is empty, use customName
    const finalName = (selectedName === "new" || (selectedName === "" && customName.trim().length > 0)) 
      ? customName 
      : selectedName
    // Determine final task: if customTask has value, use it; otherwise use selectedTask from dropdown
    const finalTask = customTask.trim().length > 0 ? customTask : selectedTask

    if (!finalName) {
      return
    }
    
    // For attending only, task is not required
    if (!isAttendingOnly && !finalTask) {
      return
    }

    setIsSubmitting(true)

    // Update the shared guest name
    setCurrentContributorName(finalName)

    try {
      // Check if user is adding a new name and if they're allowed to
      const isAddingNewName = selectedName === "new" || (selectedName === "" && customName.trim().length > 0)
      if (isAddingNewName && !projectSettings.allowContributorsAddNames) {
        throw new Error('You are not allowed to add new names to this project. Please select an existing name.')
      }

      // Determine the task name that will be claimed
      let taskNameToClaim = ""
      
      // Handle attending only RSVP
      if (isAttendingOnly) {
        await addAttendingOnlyRsvp(finalName, headcount)
        taskNameToClaim = "Attending Only"
      } else if (customTask.trim().length > 0) {
        // Check if guests are allowed to add tasks
        if (!projectSettings.allowContributorsAddTasks) {
          throw new Error('You are not allowed to add custom tasks to this project')
        }
        
        // Add new custom task and claim it atomically
        await addTaskAndClaim(customTask, finalName)
        taskNameToClaim = customTask
      } else if (selectedTask) {
        // Claim existing task with headcount
        await claimTask(selectedTask, finalName, headcount)
        taskNameToClaim = availableTasks.find((t) => t.id === selectedTask)?.name || ""
      }

      // Update claimed tasks list using the actual task name (not state variable)
      const newClaimedTasks = [...claimedTasks, taskNameToClaim]
      setClaimedTasks(newClaimedTasks)
      setClaimedTaskName(taskNameToClaim)
      
      // Always show success modal after claiming
      setShowMultipleClaimPrompt(true)
    } catch (error) {
      console.error('Failed to claim task:', error)
      alert(`Couldn't complete your request. Try again or refresh the page.`)
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
      
      // Get names of claimed tasks for the summary
      const claimedTaskNames = selectedTasksForClaiming
        .map(taskId => tasks.find(t => t.id === taskId)?.name)
        .filter(Boolean) as string[]
      
      // Update claimed tasks list
      const newClaimedTasks = [...claimedTasks, ...claimedTaskNames]
      setClaimedTasks(newClaimedTasks)
      
      // Set the latest claimed task name for display
      if (claimedTaskNames.length > 0) {
        setClaimedTaskName(claimedTaskNames[claimedTaskNames.length - 1])
      }
      
      // Show success modal
      setShowMultipleClaimPrompt(true)
      
      // Clear selection after claiming
      clearClaimingSelection()
    } catch (error) {
      console.error('Failed to claim selected tasks:', error)
      alert(`Couldn't claim tasks. Try again or refresh the page.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClaimAnother = () => {
    setShowMultipleClaimPrompt(false)
    // Reset task selection, keep name and headcount
    setSelectedTask("")
    setCustomTask("")
    setIsAttendingOnly(false)
    
    // Sync selectedName with currentContributorName if it exists in activeContributors
    // If not, ensure customName is set if currentContributorName exists
    if (currentContributorName) {
      if (activeContributors.includes(currentContributorName)) {
        setSelectedName(currentContributorName)
        setCustomName("")
      } else {
        // It's a custom name
        setSelectedName("new")
        setCustomName(currentContributorName)
      }
      // Ensure nameConfirmed is true so task selection shows
      setNameConfirmed(true)
    }
    
    // Scroll to task list
    setTimeout(() => {
      const taskTableElement = document.querySelector('[data-task-table]')
      if (taskTableElement) {
        taskTableElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const handleFinishClaiming = () => {
    setShowMultipleClaimPrompt(false)
    setShowFinalSummary(true)
  }

  const handleCloseFinalSummary = () => {
    setShowFinalSummary(false)
    // Reset entire form
    setSelectedName("")
    setSelectedTask("")
    setHeadcount(1)
    setCustomName("")
    setCustomTask("")
    setIsAttendingOnly(false)
    setNameConfirmed(false)
    hasShownSuccessRef.current = false
    setClaimedTasks([])
    // Clear any existing fade timer
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current)
      fadeTimerRef.current = null
    }
    setShowNameSuccess(false)
    setIsFadingOut(false)
  }

  const isFormValid = () => {
    // Check if name is valid: either selected from dropdown, or custom name entered
    const hasValidName = selectedName && (selectedName !== "new" || customName.trim()) || 
                        (selectedName === "" && customName.trim().length > 0 && projectSettings.allowContributorsAddNames)
    
    // For attending only, only name is required
    if (isAttendingOnly) {
      return hasValidName
    }
    
    // For task claiming, both name and task are required
    // Task is valid if: selectedTask is set (from dropdown) OR customTask has value
    const hasValidTask = (selectedTask && selectedTask !== "custom") || (customTask.trim().length > 0)
    return hasValidName && hasValidTask
  }

  return (
    <div className="max-w-2xl mx-auto px-3" data-task-claim-form="true">
      <div className="card-form p-4 md:p-8">
        <div className="flex items-center justify-center mb-4 md:mb-8">
          <svg className="w-7 h-7 md:w-8 md:h-8 text-blue-600 mr-2 md:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-0">Pick a Task</h2>
        </div>
        <div className="space-y-4 md:space-y-8">
            {showSuccess ? (
            <div className="text-center py-6 md:py-8 space-y-3 md:space-y-4">
              <div className="w-14 h-14 md:w-16 md:h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 md:w-8 md:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl md:text-xl font-bold md:font-semibold text-gray-900">Success!</h3>
              <p className="text-base md:text-lg text-gray-700 md:text-muted-foreground">
                {claimedTaskName === "Attending Only" ? "You're on the list!" : "You've been added to the list!"}
              </p>
            </div>
          ) : showFinalSummary ? (
            <div className="text-center py-6 md:py-8 space-y-4 md:space-y-6">
              <div className="w-14 h-14 md:w-16 md:h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 md:w-8 md:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="space-y-3 md:space-y-4">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900">You're All Set!</h3>
                {claimedTasks.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-base md:text-lg font-semibold text-gray-900">You're bringing:</p>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 md:p-6 max-w-md mx-auto">
                      <ul className="space-y-2 text-left">
                        {claimedTasks.map((task, index) => (
                          <li key={index} className="flex items-center gap-2 text-base md:text-lg text-gray-900">
                            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col md:flex-row gap-2 md:gap-3 justify-center pt-4">
                <Button
                  onClick={handleCloseFinalSummary}
                  className="text-base md:text-base px-6 py-3 md:px-6 md:py-3 h-auto md:h-12 font-semibold md:font-medium bg-blue-600 text-white hover:bg-blue-700"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : showMultipleClaimPrompt ? (
            <div className="text-center py-6 md:py-8 space-y-4 md:space-y-6">
              <div className="w-14 h-14 md:w-16 md:h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 md:w-8 md:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="space-y-2 md:space-y-3">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900">✅ All set for this event!</h3>
                <p className="text-base md:text-lg text-gray-700 md:text-muted-foreground">
                  You can claim another or finish.
                </p>
              </div>
              <div className="flex flex-col md:flex-row gap-2 md:gap-3 justify-center pt-2">
                <Button
                  onClick={handleClaimAnother}
                  className="text-base md:text-base px-6 py-3 md:px-6 md:py-3 h-auto md:h-12 font-semibold md:font-medium bg-blue-600 text-white hover:bg-blue-700"
                >
                  Claim Another
                </Button>
                <Button
                  onClick={handleFinishClaiming}
                  variant="outline"
                  className="text-base md:text-base px-6 py-3 md:px-6 md:py-3 h-auto md:h-12 font-semibold md:font-medium border-2 md:border"
                >
                  I'm Done
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Selected Tasks from Table */}
              {selectedTasksForClaiming.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      Selected Tasks ({selectedTasksForClaiming.length})
                    </h3>
                    <p className="text-sm text-blue-700">
                      Enter your name to claim selected tasks
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

              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-8">
              {/* NAME PICKER SECTION */}
              <div className="space-y-2 md:space-y-3">
                <label htmlFor="name-select" className="text-base md:text-lg font-bold md:font-semibold text-gray-900 block">
                  Your Name
                </label>
                {activeContributors.length > 0 ? (
                  <Select 
                    value={selectedName} 
                    onValueChange={(value) => {
                      setSelectedName(value)
                      // Update shared name when selecting from existing guests
                      if (value !== "new") {
                        setCurrentContributorName(value)
                        setCustomName("") // Clear custom name when selecting existing
                      } else {
                        setCustomName("") // Clear when selecting "new"
                      }
                    }}
                  >
                    <SelectTrigger className="select-trigger">
                      <SelectValue placeholder="Choose your name..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-80 overflow-y-auto">
                      {activeContributors.map((name) => (
                        <SelectItem key={name} value={name} className="text-base py-3">
                          {name}
                        </SelectItem>
                      ))}
                      {projectSettings.allowContributorsAddNames && (
                        <SelectItem value="new" className="text-base py-3 font-medium text-secondary">
                          Add New Name
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                ) : null}

                {/* Show name input if: guests can add names, OR if no guests exist and adding is allowed, OR if "new" is selected */}
                {(projectSettings.allowContributorsAddNames && (selectedName === "new" || selectedName === "" || activeContributors.length === 0)) && (
                  <div className="space-y-2 md:space-y-2">
                    <label htmlFor="custom-name" className="text-sm md:text-base font-bold md:font-medium text-gray-900 block">
                      {activeContributors.length > 0 ? "Type Your Name" : "Type Your Name"}
                    </label>
                    <input
                      id="custom-name"
                      type="text"
                      value={customName}
                      onChange={(e) => {
                        const value = e.target.value
                        setCustomName(value)
                        setCurrentContributorName(value)
                        // Auto-select "new" when user starts typing (if not already selected and guests can add names)
                        if (value.trim().length > 0 && selectedName !== "new" && projectSettings.allowContributorsAddNames) {
                          setSelectedName("new")
                        }
                        // Clear selection if user deletes all text and there are existing contributors
                        if (value.trim().length === 0 && activeContributors.length > 0) {
                          setSelectedName("")
                        }
                      }}
                      onFocus={() => {
                        // Auto-select "new" when user focuses on the input (if guests can add names)
                        if (projectSettings.allowContributorsAddNames && selectedName !== "new" && customName.trim().length === 0) {
                          setSelectedName("new")
                        }
                      }}
                      placeholder="Your name..."
                      maxLength={50}
                      className="form-input text-base md:text-base py-2.5 md:py-2 px-3 md:px-3"
                      autoFocus={activeContributors.length === 0}
                    />
                    <p className="text-xs md:text-sm text-gray-600">
                      {customName.length}/50 characters
                    </p>
                    {activeContributors.length === 0 && (
                      <p className="text-sm md:text-sm text-gray-700 md:text-gray-600">
                        💡 You'll be the first person on this project
                      </p>
                    )}
                  </div>
                )}
                
                {/* Show message when guests can't add names and list is empty */}
                {activeContributors.length === 0 && !projectSettings.allowContributorsAddNames && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Contact the host to add your name
                    </p>
                  </div>
                )}
              </div>

              {/* SUCCESS MESSAGE - Shows after name selection */}
              {showNameSuccess && (
                <div 
                  className={`bg-green-50 border border-green-200 rounded-lg p-4 md:p-4 transition-opacity duration-300 ${
                    isFadingOut ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm md:text-base text-green-800 font-medium">
                      ✅ You're added — now choose your contribution
                    </p>
                    <button
                      type="button"
                      onClick={handleDismissNameSuccess}
                      className="flex-shrink-0 text-green-700 hover:text-green-900 hover:bg-green-100 rounded p-1 transition-colors"
                      aria-label="Dismiss message"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* TASK SECTION - Shows as soon as name is entered */}
              {hasValidName() && (
                <div className="space-y-4 md:space-y-6">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">
                    Choose a task or item below
                  </h2>

                  <div className="space-y-2 md:space-y-3">
                    {/* Task dropdown - show when there are available tasks */}
                    {tasks.length > 0 && availableTasks.length > 0 && (
                      <div className="space-y-2 md:space-y-2">
                        <label htmlFor="task-select" className="text-sm md:text-base font-bold md:font-medium text-gray-900 block">
                          Select from existing tasks
                        </label>
                        <Select 
                          value={selectedTask && selectedTask !== "custom" ? selectedTask : undefined} 
                          onValueChange={(value) => {
                            setSelectedTask(value)
                            // If user selects a task from dropdown, turn off attending-only mode and clear custom task
                            if (value) {
                              setIsAttendingOnly(false)
                              setCustomTask("")
                            }
                          }}
                        >
                          <SelectTrigger 
                            className="select-trigger w-full bg-white border-2 border-gray-300 rounded-md px-3 py-2 text-base h-auto min-h-[44px] flex items-center justify-between" 
                            id="task-select"
                          >
                            <SelectValue placeholder="Select a task to claim..." />
                          </SelectTrigger>
                          <SelectContent 
                            className="max-h-80 overflow-y-auto z-[100] bg-white border-2 border-gray-200 shadow-xl rounded-md"
                            position="popper"
                            sideOffset={4}
                          >
                            {availableTasks.map((task) => (
                              <SelectItem 
                                key={task.id} 
                                value={task.id} 
                                className="text-base py-3 cursor-pointer hover:bg-gray-100" 
                                disabled={Boolean(task.isFull || task.alreadyJoined)}
                              >
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
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Show message when no tasks available and can't add custom tasks */}
                    {availableTasks.length === 0 && !projectSettings.allowContributorsAddTasks && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                          ⚠️ No tasks available. Contact the host.
                        </p>
                      </div>
                    )}

                    {/* Show custom task input field if guests can add tasks */}
                    {projectSettings.allowContributorsAddTasks && (
                      <div className="space-y-2 md:space-y-2">
                        <label htmlFor="custom-task" className="text-sm md:text-base font-bold md:font-medium text-gray-900 block">
                          {availableTasks.length > 0 ? "Or add a custom task" : "What task do you want to do?"}
                        </label>
                        <input
                          id="custom-task"
                          type="text"
                          value={customTask}
                          onChange={(e) => {
                            const value = e.target.value
                            setCustomTask(value)
                            // Auto-select "custom" when user starts typing (if not already selected and guests can add tasks)
                            if (value.trim().length > 0 && selectedTask !== "custom" && projectSettings.allowContributorsAddTasks) {
                              setSelectedTask("custom")
                              // Clear any selected task from dropdown when typing custom task
                              if (selectedTask && selectedTask !== "custom") {
                                // Keep custom selected, dropdown will show empty
                              }
                            }
                            // Clear custom selection if user deletes all text
                            if (value.trim().length === 0 && selectedTask === "custom") {
                              setSelectedTask("")
                            }
                          }}
                          onFocus={() => {
                            // Auto-select "custom" when user focuses on the input (if guests can add tasks)
                            if (projectSettings.allowContributorsAddTasks && customTask.trim().length > 0 && selectedTask !== "custom") {
                              setSelectedTask("custom")
                            }
                          }}
                          placeholder="Type your task..."
                          maxLength={100}
                          className="form-input text-base md:text-base py-2.5 md:py-2 px-3 md:px-3"
                        />
                        <p className="text-xs md:text-sm text-gray-600">
                          {customTask.length}/100 characters
                        </p>
                      </div>
                    )}
                  </div>
              </div>
              )}

              {/* OR Divider and Attending Only Button - Only show when name is entered */}
              {hasValidName() && (
                <>
                  {!isAttendingOnly && (
                    <>
                      <div className="flex items-center gap-3 my-3 md:my-5">
                        <div className="flex-1 border-t border-gray-300"></div>
                        <span className="text-gray-500 font-semibold text-sm md:text-base">OR</span>
                        <div className="flex-1 border-t border-gray-300"></div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsAttendingOnly(true)
                          setSelectedTask("")
                        }}
                        className="w-full text-base md:text-base py-3 md:py-3 h-auto border-2 hover:bg-blue-100 hover:border-blue-400 hover:text-blue-700 transition-all duration-200 font-medium"
                      >
                        No task — I'm just joining
                      </Button>
                    </>
                  )}

                  {/* Show cancel attending only button */}
                  {isAttendingOnly && (
                    <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3 md:p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm md:text-base text-blue-900 font-semibold">
                          ✓ Attending only
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsAttendingOnly(false)}
                          className="text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                        >
                          Change
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Headcount Input */}
                  <div className="space-y-2 md:space-y-3">
                    <label htmlFor="headcount" className="text-base md:text-lg font-bold md:font-semibold text-gray-900 block">
                      How many attending?
                    </label>
                    <input
                      id="headcount"
                      type="number"
                      inputMode="numeric"
                      min="1"
                      max="99"
                      value={headcount}
                      onChange={(e) => setHeadcount(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
                      className="form-input text-base md:text-base py-2.5 md:py-2 px-3 md:px-3"
                      placeholder="1"
                    />
                    <p className="text-sm md:text-sm text-gray-700 md:text-gray-600">
                      💡 Including you
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={!isFormValid() || isSubmitting}
                    className={`w-full btn-primary text-base md:text-base py-3 md:py-3 font-bold md:font-medium whitespace-nowrap ${(!isFormValid() || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? "Submitting..." : (isAttendingOnly ? "Confirm Attendance" : "Claim This Task")}
                  </button>
                </>
              )}
            </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
