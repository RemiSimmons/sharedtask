"use client"

import React, { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown, ChevronRight, MessageCircle, Edit2, Save, X, Trash2, UserX, Check, CheckCircle2 } from "lucide-react"
import { useTask, type TaskStatus } from "@/contexts/TaskContextWithSupabase"
import { useSession } from "next-auth/react"
import { CalendarExportButton } from "@/components/calendar-export-button"
import { ClickableLocation } from "@/components/clickable-location"

interface TaskTableProps {
  isAdminView?: boolean
}

export default function TaskTable({ isAdminView = false }: TaskTableProps) {
  const { data: session } = useSession()
  const { 
    tasks, 
    projectSettings, 
    claimTask, 
    unclaimTask,
    addComment, 
    updateTask,
    deleteTask,
    selectedTasksForClaiming,
    addTaskToClaimingSelection,
    removeTaskFromClaimingSelection,
    currentProject,
    currentContributorName
  } = useTask()
  
  // Check if current user is the project owner
  const isOwner = session?.user?.id && currentProject?.user_id === session.user.id
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [newComments, setNewComments] = useState<Record<string, string>>({})
  const [editingTasks, setEditingTasks] = useState<Set<string>>(new Set())
  const [editValues, setEditValues] = useState<Record<string, { name: string; description: string }>>({})

  const handleSelectTaskForClaiming = (taskId: string) => {
    if (selectedTasksForClaiming.includes(taskId)) {
      removeTaskFromClaimingSelection(taskId)
    } else {
      addTaskToClaimingSelection(taskId)
    }
  }

  const toggleComments = (taskId: string) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  const handleAddComment = (taskId: string) => {
    const commentText = newComments[taskId]?.trim()
    if (!commentText) return

    // Determine author name
    let authorName = "Anonymous"
    
    if (session?.user?.email) {
      // Use authenticated user's email or name
      authorName = session.user.name || session.user.email
    } else {
      // Prompt anonymous user for their name
      const inputName = prompt("What's your name? (This will be shown with your comment)")
      if (!inputName?.trim()) {
        alert("Please enter your name to post a comment")
        return
      }
      authorName = inputName.trim()
    }

    addComment(taskId, commentText, authorName)
    setNewComments((prev) => ({ ...prev, [taskId]: "" }))
    
    // Close the comment section after posting
    setExpandedComments((prev) => {
      const newSet = new Set(prev)
      newSet.delete(taskId)
      return newSet
    })
  }

  const handleDeleteTask = async (taskId: string, taskName: string, claimedBy: string[] | null) => {
    const participantCount = claimedBy?.length || 0
    const affectedMessage = participantCount > 0 
      ? ` This will affect ${participantCount} participant${participantCount === 1 ? '' : 's'}.`
      : ''
    
    if (confirm(`Delete "${taskName}" permanently?${affectedMessage}`)) {
      try {
        await deleteTask(taskId)
      } catch (error) {
        console.error('Failed to delete task:', error)
        alert('Couldn\'t delete task. Try again or refresh the page.')
      }
    }
  }

  const startEditing = (taskId: string, currentName: string, currentDescription?: string) => {
    setEditingTasks((prev) => new Set(prev).add(taskId))
    setEditValues((prev) => ({
      ...prev,
      [taskId]: {
        name: currentName,
        description: currentDescription || ''
      }
    }))
  }

  const cancelEditing = (taskId: string) => {
    setEditingTasks((prev) => {
      const newSet = new Set(prev)
      newSet.delete(taskId)
      return newSet
    })
    setEditValues((prev) => {
      const newValues = { ...prev }
      delete newValues[taskId]
      return newValues
    })
  }

  const saveTaskEdit = async (taskId: string) => {
    const values = editValues[taskId]
    if (!values || !values.name.trim()) return

    try {
      await updateTask(taskId, {
        name: values.name.trim(),
        description: values.description.trim() || undefined
      })
      
      // Clear editing state
      cancelEditing(taskId)
    } catch (error) {
      console.error('Failed to update task:', error)
      // You could add a toast notification here
    }
  }


  const formatClaimedBy = (claimedBy: string[] | null, maxContributors?: number) => {
    if (!claimedBy || claimedBy.length === 0) return "Available"

    if (claimedBy.length === 1) {
      return claimedBy[0]
    } else if (claimedBy.length === 2) {
      return `${claimedBy[0]}, ${claimedBy[1]}`
    } else if (claimedBy.length <= 3) {
      return `${claimedBy[0]}, ${claimedBy[1]} +${claimedBy.length - 2} more`
    } else {
      return `${claimedBy[0]}, ${claimedBy[1]} +${claimedBy.length - 2} more`
    }
  }

  // Helper functions to determine task states
  const isTaskAvailable = (claimedBy: string[] | null) => {
    return !claimedBy || claimedBy.length === 0
  }

  const isTaskFullyClaimed = (claimedBy: string[] | null, maxContributors?: number) => {
    if (!maxContributors) return false
    return claimedBy ? claimedBy.length >= maxContributors : false
  }

  const isTaskPartiallyClaimed = (claimedBy: string[] | null, maxContributors?: number) => {
    if (!claimedBy || claimedBy.length === 0) return false
    if (!maxContributors) return claimedBy.length > 0
    return claimedBy.length > 0 && claimedBy.length < maxContributors
  }

  const isUserClaimedTask = (claimedBy: string[] | null) => {
    if (!currentContributorName || !claimedBy) return false
    return claimedBy.includes(currentContributorName)
  }

  const getRemainingSpots = (claimedBy: string[] | null, maxContributors?: number) => {
    if (!maxContributors || !claimedBy) return null
    const remaining = maxContributors - claimedBy.length
    return remaining > 0 ? remaining : 0
  }

  const getClaimedByStatus = (claimedBy: string[] | null, maxContributors?: number) => {
    if (!claimedBy || claimedBy.length === 0) {
      return { text: "Available", hasCheckmark: false }
    }
    
    const isFull = isTaskFullyClaimed(claimedBy, maxContributors)
    if (isFull) {
      return { text: "Fully claimed", hasCheckmark: true }
    }
    
    if (maxContributors && maxContributors > 1) {
      return { text: `${claimedBy.length} of ${maxContributors} claimed`, hasCheckmark: false }
    }
    
    return null
  }

  const getStatusBadge = (status: TaskStatus, claimedBy: string[] | null, maxContributors?: number, isMobile = false) => {
    const isFull = isTaskFullyClaimed(claimedBy, maxContributors)
    const isPartiallyClaimed = isTaskPartiallyClaimed(claimedBy, maxContributors)
    const isAvailable = isTaskAvailable(claimedBy)
    
    // For fully claimed tasks, show "Fully claimed" with checkmark
    if (isFull) {
      return (
        <Badge
          variant="outline"
          className={`bg-gray-100 text-gray-700 border-gray-300 font-medium whitespace-nowrap flex items-center gap-1 ${isMobile ? 'text-[13px] px-2 py-0.5' : 'text-base px-4 py-1.5'}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" aria-label="Fully claimed" />
          <span>Fully claimed</span>
        </Badge>
      )
    }
    
    // For partially claimed tasks, show "X of Y claimed"
    if (isPartiallyClaimed && maxContributors && maxContributors > 1) {
      return (
        <Badge
          variant="outline"
          className={`bg-amber-50 text-amber-700 border-amber-300 font-medium whitespace-nowrap ${isMobile ? 'text-[13px] px-2 py-0.5' : 'text-base px-4 py-1.5'}`}
        >
          {claimedBy?.length || 0} of {maxContributors} claimed
        </Badge>
      )
    }
    
    // For available tasks, show "Available" in neutral/gray text
    if (isAvailable) {
      return (
        <Badge
          variant="outline"
          className={`bg-gray-50 text-gray-600 border-gray-200 font-medium whitespace-nowrap ${isMobile ? 'text-[13px] px-2 py-0.5' : 'text-base px-4 py-1.5'}`}
        >
          Available
        </Badge>
      )
    }
    
    // Default: show "Open"
    return (
      <Badge
        variant="outline"
        className={`bg-blue-50 text-blue-700 border-blue-200 font-medium whitespace-nowrap ${isMobile ? 'text-[13px] px-2 py-0.5' : 'text-base px-4 py-1.5'}`}
      >
        Open
      </Badge>
    )
  }
  
  const handleUnclaimTask = async (taskId: string, contributorName: string, taskName: string) => {
    if (confirm(`Leave this task? You will be removed from "${taskName}".`)) {
      try {
        await unclaimTask(taskId, contributorName)
      } catch (error) {
        console.error('Failed to unclaim task:', error)
        alert('Couldn\'t leave task. Try again or refresh the page.')
      }
    }
  }

  const handleUnassignGuest = async (taskId: string, guestName: string) => {
    if (confirm(`Remove ${guestName} from this task?`)) {
      try {
        await unclaimTask(taskId, guestName)
      } catch (error) {
        console.error('Failed to unassign guest:', error)
        alert('Failed to unassign guest. Please try again.')
      }
    }
  }

  return (
    <div className="space-y-6 md:space-y-8" data-task-table>
      {/* Mobile: Simple heading without card wrapper */}
      <div className="md:hidden px-2">
        <div className="flex flex-col items-start justify-between mb-4 gap-3">
          <div className="flex items-center">
            <svg className="w-10 h-10 text-blue-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h2 className="text-3xl font-bold text-gray-900 mb-0">Tasks</h2>
          </div>
          {!isAdminView && selectedTasksForClaiming.length > 0 && (
            <div className="text-lg text-blue-600 font-bold">
              {selectedTasksForClaiming.length} selected
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Nested card structure with header */}
      <div className="hidden md:block card-table p-8">
        <div className="flex flex-row items-center justify-between mb-8 gap-0">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-blue-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-0">All Tasks</h2>
          </div>
          {!isAdminView && selectedTasksForClaiming.length > 0 && (
            <div className="text-sm text-blue-600 font-medium">
              {selectedTasksForClaiming.length} selected
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div>
          <div className="table-header rounded-t-lg">
            <div className={`grid gap-6 px-8 py-4 ${isAdminView ? 'grid-cols-9' : 'grid-cols-10'}`}>
              <div className={isAdminView ? "col-span-3" : "col-span-4 sm:col-span-3"}>
                <h3 className="text-lg font-semibold text-gray-900">Task Name</h3>
              </div>
              <div className="col-span-2">
                <h3 className="text-lg font-semibold text-gray-900">Claimed By</h3>
              </div>
              <div className={isAdminView ? "col-span-2" : "col-span-3"}>
                <h3 className="text-lg font-semibold text-gray-900">Status</h3>
              </div>
              <div className="col-span-2">
                <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
              </div>
            </div>
          </div>

          <div className="divide-y divide-border">
            {tasks.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-b-lg">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No tasks yet</h3>
                <p className="text-gray-600">{isOwner ? "Add tasks to get started" : "The host will add tasks soon"}</p>
              </div>
            ) : tasks.map((task) => {
              const isAvailable = isTaskAvailable(task.claimedBy)
              const isFull = isTaskFullyClaimed(task.claimedBy, task.maxContributors)
              const isPartiallyClaimed = isTaskPartiallyClaimed(task.claimedBy, task.maxContributors)
              const isUserClaimed = isUserClaimedTask(task.claimedBy)
              
              // Determine row styling based on task state
              let rowClass = `table-row grid gap-6 px-8 py-6 ${isAdminView ? 'grid-cols-9' : 'grid-cols-10'} transition-all`
              
              // Fully claimed: grayed out appearance
              if (isFull) {
                rowClass += " opacity-60 bg-gray-50 border-l-4 border-gray-300"
              }
              // Partially claimed: orange/amber tint
              else if (isPartiallyClaimed) {
                rowClass += " bg-amber-50/50 border-l-4 border-amber-300"
              }
              // Available: standard/neutral background
              else if (isAvailable) {
                rowClass += " bg-white"
              }
              // Default: standard background
              else {
                rowClass += " bg-white"
              }
              
              // User claimed indicator: add border or background highlight
              if (isUserClaimed && !isAdminView) {
                rowClass += " ring-2 ring-blue-400 ring-offset-1"
              }
              
              return (
              <div key={task.id}>
                <div className={rowClass}>
                  <div className={isAdminView ? "col-span-3" : "col-span-4 sm:col-span-3"}>
                    {editingTasks.has(task.id) ? (
                      <div className="space-y-3">
                      <Input
                        value={editValues[task.id]?.name || ''}
                        onChange={(e) => setEditValues(prev => ({
                          ...prev,
                          [task.id]: { ...prev[task.id], name: e.target.value }
                        }))}
                        className="text-lg font-medium"
                        placeholder="Task name"
                        maxLength={100}
                      />
                        <div className="space-y-1">
                          <Textarea
                            value={editValues[task.id]?.description || ''}
                            onChange={(e) => setEditValues(prev => ({
                              ...prev,
                              [task.id]: { ...prev[task.id], description: e.target.value }
                            }))}
                            className="text-sm resize-none"
                            placeholder="Task description (optional)"
                            rows={2}
                          />
                          {editValues[task.id]?.description && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditValues(prev => ({
                                ...prev,
                                [task.id]: { ...prev[task.id], description: '' }
                              }))}
                              className="text-xs text-muted-foreground hover:text-red-600 h-auto p-1"
                            >
                              Clear description
                            </Button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => saveTaskEdit(task.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            onClick={() => cancelEditing(task.id)}
                            size="sm"
                            variant="outline"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="group">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <p className="text-lg font-medium text-gray-900 task-name leading-tight">{task.name}</p>
                            {task.description && (
                              <div className="mt-1">
                                <p className="text-sm text-muted-foreground">{task.description}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {isOwner && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditing(task.id, task.name, task.description)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                                title={!task.claimedBy || task.claimedBy.length === 0 ? "Add details" : "Edit task"}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            )}
                            {isOwner && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTask(task.id, task.name, task.claimedBy)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Delete task"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 flex items-center">
                    {task.claimedBy && task.claimedBy.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2 items-center">
                          {task.claimedBy.map((name, idx) => {
                            const isCurrentUser = name === currentContributorName
                            return (
                            <div
                              key={idx}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all duration-200 ${
                                isCurrentUser && !isAdminView
                                  ? "bg-blue-100 border-2 border-blue-400 hover:bg-blue-200"
                                  : "bg-muted/50 hover:bg-muted"
                              }`}
                            >
                              {isCurrentUser && !isAdminView && (
                                <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" aria-label="You claimed this" />
                              )}
                              <span className={`text-base font-semibold ${isCurrentUser && !isAdminView ? "text-blue-900" : "text-gray-900"}`}>
                                {name}
                              </span>
                              {isOwner && (
                                <button
                                  onClick={() => handleUnassignGuest(task.id, name)}
                                  className="opacity-60 hover:opacity-100 transition-opacity ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                                  title={`Remove ${name}`}
                                >
                                  <X className="w-4 h-4 text-destructive" />
                                </button>
                              )}
                              {!isAdminView && !isOwner && (
                                <button
                                  onClick={() => handleUnclaimTask(task.id, name, task.name)}
                                  className="opacity-60 hover:opacity-100 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full p-1 transition-all"
                                  title="Remove yourself"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )})}
                        </div>
                        {(() => {
                          const status = getClaimedByStatus(task.claimedBy, task.maxContributors)
                          const isFull = isTaskFullyClaimed(task.claimedBy, task.maxContributors)
                          if (status) {
                            return (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                {status.hasCheckmark && (
                                  <CheckCircle2 className="w-4 h-4 text-green-600" aria-label="Fully claimed" />
                                )}
                                <span className={isFull ? "text-gray-600" : ""}>{status.text}</span>
                              </div>
                            )
                          }
                          return null
                        })()}
                      </div>
                    ) : (
                      <p className="text-lg text-muted-foreground">Available</p>
                    )}
                  </div>
                  <div className={`${isAdminView ? 'col-span-2' : 'col-span-3'} flex items-center justify-start`}>{getStatusBadge(task.status, task.claimedBy, task.maxContributors)}</div>
                  <div className="col-span-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleComments(task.id)}
                      className="text-base px-3 py-2 h-auto min-h-[44px] font-medium text-muted-foreground hover:text-gray-900"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      {task.comments.length}
                      {expandedComments.has(task.id) ? (
                        <ChevronDown className="w-4 h-4 ml-2" />
                      ) : (
                        <ChevronRight className="w-4 h-4 ml-2" />
                      )}
                    </Button>
                  </div>
                </div>

                {expandedComments.has(task.id) && (
                  <div className="px-8 pb-6 bg-muted/10">
                    <div className="max-w-2xl">
                      {task.comments.length > 0 && (
                        <div className="space-y-3 mb-4">
                          {task.comments.map((comment) => (
                            <div key={comment.id} className="bg-white border border-gray-300/50 rounded-lg p-4">
                              <div className="mb-2">
                                <span className="text-sm font-medium text-gray-900">{comment.author}</span>
                              </div>
                              <p className="text-base text-gray-900">{comment.text}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label htmlFor={`comment-${task.id}`} className="text-sm font-medium text-gray-900">
                            Add a comment:
                          </label>
                          <span className="text-xs text-muted-foreground">
                            Posting as: {session?.user?.name || session?.user?.email || "You'll be asked for your name"}
                          </span>
                        </div>
                        <textarea
                          id={`comment-${task.id}`}
                          value={newComments[task.id] || ""}
                          onChange={(e) => setNewComments((prev) => ({ ...prev, [task.id]: e.target.value }))}
                          placeholder="Type your comment here..."
                          className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                          rows={3}
                        />
                        <Button
                          onClick={() => handleAddComment(task.id)}
                          disabled={!newComments[task.id]?.trim()}
                          className="text-base px-6 py-2 h-auto min-h-[44px] font-medium"
                        >
                          Post Comment
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          )}
          </div>
        </div>
      </div>

      {/* Mobile: Task cards without wrapper - Optimized for compact viewing */}
      <div className="md:hidden space-y-2.5 px-2">
          {tasks.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No tasks yet</h3>
              <p className="text-sm text-gray-600">{isOwner ? "Add tasks to get started" : "The host will add tasks soon"}</p>
            </div>
          ) : tasks.map((task) => {
            const isAvailable = isTaskAvailable(task.claimedBy)
            const isFull = isTaskFullyClaimed(task.claimedBy, task.maxContributors)
            const isPartiallyClaimed = isTaskPartiallyClaimed(task.claimedBy, task.maxContributors)
            const isUserClaimed = isUserClaimedTask(task.claimedBy)
            
            // Determine card styling based on task state
            let cardClass = "bg-white border border-gray-200 rounded-lg px-4 py-3 space-y-1.5 shadow-sm transition-all"
            
            // Fully claimed: grayed out appearance (reduced opacity ~60%)
            if (isFull) {
              cardClass += " opacity-60 bg-gray-50 border-l-4 border-gray-300"
            }
            // Partially claimed: subtle orange/amber tint or left border accent
            else if (isPartiallyClaimed) {
              cardClass += " bg-amber-50/50 border-l-4 border-amber-300"
            }
            // Available: standard/neutral background
            else if (isAvailable) {
              cardClass += " bg-white"
            }
            
            // User claimed indicator: add visual highlight
            if (isUserClaimed && !isAdminView) {
              cardClass += " ring-2 ring-blue-400"
            }
            
            // Format claimed by text for compact display
            const formatClaimedByCompact = (claimedBy: string[] | null, maxContributors?: number) => {
              if (!claimedBy || claimedBy.length === 0) return null
              if (claimedBy.length === 1) return claimedBy[0]
              if (claimedBy.length === 2) return `${claimedBy[0]}, ${claimedBy[1]}`
              return `${claimedBy[0]}, ${claimedBy[1]} +${claimedBy.length - 2}`
            }
            
            const claimedByText = formatClaimedByCompact(task.claimedBy, task.maxContributors)
            
            return (
            <div key={task.id} className={cardClass}>
                  {editingTasks.has(task.id) ? (
                    <div className="space-y-2">
                      <Input
                        value={editValues[task.id]?.name || ''}
                        onChange={(e) => setEditValues(prev => ({
                          ...prev,
                          [task.id]: { ...prev[task.id], name: e.target.value }
                        }))}
                        className="text-base font-bold py-2 px-3"
                        placeholder="Task name"
                        maxLength={100}
                      />
                      <div className="space-y-1">
                        <Textarea
                          value={editValues[task.id]?.description || ''}
                          onChange={(e) => setEditValues(prev => ({
                            ...prev,
                            [task.id]: { ...prev[task.id], description: e.target.value }
                          }))}
                          className="text-sm resize-none py-2 px-3"
                          placeholder="Task description (optional)"
                          rows={2}
                        />
                        {editValues[task.id]?.description && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditValues(prev => ({
                              ...prev,
                              [task.id]: { ...prev[task.id], description: '' }
                            }))}
                            className="text-xs text-muted-foreground hover:text-red-600 h-auto p-1 w-full justify-start"
                          >
                            Clear description
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => saveTaskEdit(task.id)}
                          size="sm"
                          className="w-full text-sm py-2 h-auto font-semibold"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Save Changes
                        </Button>
                        <Button
                          onClick={() => cancelEditing(task.id)}
                          variant="outline"
                          size="sm"
                          className="w-full text-sm py-2 h-auto font-semibold"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {/* Task name - single line, truncated */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-bold text-gray-900 task-name leading-tight truncate flex-1 min-w-0">
                          {task.name}
                        </h3>
                        <div className="flex gap-1 flex-shrink-0">
                          {/* Comment icon for fully claimed tasks - show on same line as name */}
                          {isFull && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleComments(task.id)}
                              className="p-1.5 h-auto min-w-[44px] min-h-[44px] text-muted-foreground hover:text-gray-900 relative"
                              title={`${task.comments.length} comment${task.comments.length !== 1 ? 's' : ''}`}
                              aria-label={`${task.comments.length} comment${task.comments.length !== 1 ? 's' : ''}`}
                            >
                              <MessageCircle className="w-4 h-4" />
                              {task.comments.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                  {task.comments.length > 9 ? '9+' : task.comments.length}
                                </span>
                              )}
                            </Button>
                          )}
                          {isOwner && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(task.id, task.name, task.description)}
                              className="p-1.5 h-auto min-w-[44px] min-h-[44px]"
                              title={!task.claimedBy || task.claimedBy.length === 0 ? "Add details" : "Edit task"}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          )}
                          {isOwner && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTask(task.id, task.name, task.claimedBy)}
                              className="p-1.5 h-auto min-w-[44px] min-h-[44px] text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete task"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Status and claimed by on same line */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(task.status, task.claimedBy, task.maxContributors, true)}
                        {claimedByText && (
                          <span className="text-base text-gray-600">
                            • {claimedByText}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                {expandedComments.has(task.id) && (
                  <div className="space-y-2 pt-2 border-t border-gray-300">
                    {task.comments.length > 0 && (
                      <div className="space-y-2">
                        {task.comments.map((comment) => (
                          <div key={comment.id} className="bg-muted/30 rounded p-2">
                            <div className="mb-1">
                              <span className="text-xs font-medium text-gray-900">{comment.author}</span>
                            </div>
                            <p className="text-sm text-gray-900">{comment.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex flex-col gap-0.5">
                        <label htmlFor={`mobile-comment-${task.id}`} className="text-sm font-bold text-gray-900">
                          Add a comment:
                        </label>
                        <span className="text-xs text-muted-foreground">
                          Posting as: {session?.user?.name || session?.user?.email || "You'll be asked for your name"}
                        </span>
                      </div>
                      <textarea
                        id={`mobile-comment-${task.id}`}
                        value={newComments[task.id] || ""}
                        onChange={(e) => setNewComments((prev) => ({ ...prev, [task.id]: e.target.value }))}
                        placeholder="Type your comment..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white text-gray-900 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                        rows={3}
                      />
                      <Button
                        onClick={() => handleAddComment(task.id)}
                        disabled={!newComments[task.id]?.trim()}
                        className="w-full text-sm py-2 h-auto font-semibold"
                      >
                        Post Comment
                      </Button>
                    </div>
                  </div>
                )}

                {/* Claim This Task button - only show for available or partially claimed tasks */}
                {!isAdminView && !editingTasks.has(task.id) && !isFull && (
                  <div className="pt-2 border-t border-gray-200">
                    {/* Show remaining spots text for partially claimed tasks */}
                    {isPartiallyClaimed && (() => {
                      const remainingSpots = getRemainingSpots(task.claimedBy, task.maxContributors)
                      if (remainingSpots && remainingSpots > 0) {
                        return (
                          <p className="text-xs font-medium text-amber-700 text-center mb-1.5">
                            {remainingSpots} spot{remainingSpots !== 1 ? 's' : ''} remaining
                          </p>
                        )
                      }
                      return null
                    })()}
                    
                    {/* User claimed indicator badge */}
                    {isUserClaimed && (
                      <div className="flex items-center justify-center gap-1 mb-1.5">
                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-400 text-xs px-2 py-0.5">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          You claimed this
                        </Badge>
                      </div>
                    )}
                    
                    {/* Claim button and comment icon side by side */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSelectTaskForClaiming(task.id)}
                        className={`flex-1 h-9 text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-offset-2 ${
                          selectedTasksForClaiming.includes(task.id) 
                            ? 'bg-blue-700 text-white hover:bg-blue-800 border-0 focus-visible:ring-blue-400' 
                            : isPartiallyClaimed
                              ? 'bg-orange-500 text-white hover:bg-orange-600 border-0 focus-visible:ring-orange-400'
                              : 'bg-blue-600 text-white hover:bg-blue-700 border-0 focus-visible:ring-blue-400'
                        }`}
                        aria-label={
                          isPartiallyClaimed 
                            ? `Claim this task. ${getRemainingSpots(task.claimedBy, task.maxContributors) || 0} spot${getRemainingSpots(task.claimedBy, task.maxContributors) !== 1 ? 's' : ''} remaining.`
                            : 'Claim this task'
                        }
                      >
                        {selectedTasksForClaiming.includes(task.id) ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-1 inline" />
                            Selected
                          </>
                        ) : (
                          'Claim This Task'
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleComments(task.id)}
                        className="h-9 w-9 min-w-[44px] p-0 text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 relative"
                        title={`${task.comments.length} comment${task.comments.length !== 1 ? 's' : ''}`}
                        aria-label={`${task.comments.length} comment${task.comments.length !== 1 ? 's' : ''}`}
                      >
                        <MessageCircle className="w-4 h-4" />
                        {task.comments.length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                            {task.comments.length > 9 ? '9+' : task.comments.length}
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Fully claimed indicator - badge already shown in status line above, no redundant section needed */}
              </div>
            )}
          )}
        </div>
    </div>
  )
}
