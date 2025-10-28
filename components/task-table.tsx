"use client"

import React, { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown, ChevronRight, MessageCircle, Edit2, Save, X, Trash2, UserX } from "lucide-react"
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
    currentProject
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
    if (!claimedBy || claimedBy.length === 0) return "—"

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

  const getStatusBadge = (status: TaskStatus, claimedBy: string[] | null, maxContributors?: number) => {
    // Check if task is full
    const isFull = maxContributors && claimedBy && claimedBy.length >= maxContributors
    const isPartiallyFilled = claimedBy && claimedBy.length > 0
    
    switch (status) {
      case "available":
        if (!isPartiallyFilled) {
          // Unclaimed task - show as "Draft" if owner, "Available" if participant
          return (
            <Badge
              variant="outline"
              className={`text-base px-4 py-1.5 font-medium whitespace-nowrap ${
                isOwner 
                  ? "bg-orange-50 text-orange-700 border-orange-200" 
                  : "bg-muted text-muted-foreground border-muted-foreground/20"
              }`}
            >
              {isOwner ? "Draft" : "Available"}
            </Badge>
          )
        }
        
        if (projectSettings.allowMultipleContributors && maxContributors && maxContributors > 1) {
          return (
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 text-base px-4 py-1.5 font-medium whitespace-nowrap"
            >
              In Progress ({claimedBy?.length || 0}/{maxContributors})
            </Badge>
          )
        }
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200 text-base px-4 py-1.5 font-medium whitespace-nowrap"
          >
            In Progress
          </Badge>
        )
        
      case "claimed":
        if (isFull) {
          return (
            <Badge className="bg-green-500 text-white text-base px-4 py-1.5 font-medium whitespace-nowrap flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Complete
            </Badge>
          )
        }
        if (projectSettings.allowMultipleContributors && maxContributors && claimedBy) {
          const spotsLeft = maxContributors - claimedBy.length
          if (spotsLeft > 0) {
            return (
              <Badge className="bg-blue-500 text-white text-base px-4 py-1.5 font-medium whitespace-nowrap">
                In Progress ({spotsLeft} spots left)
              </Badge>
            )
          }
        }
        return (
          <Badge className="bg-blue-500 text-white text-base px-4 py-1.5 font-medium whitespace-nowrap">In Progress</Badge>
        )
    }
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

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Mobile: Simple heading without card wrapper */}
      <div className="md:hidden px-2">
        <div className="flex flex-col items-start justify-between mb-4 gap-3">
          <div className="flex items-center">
            <svg className="w-10 h-10 text-blue-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h2 className="text-3xl font-bold text-gray-900 mb-0">Tasks</h2>
          </div>
          {!isAdminView && (
            <div className="text-lg text-blue-600 font-bold">
              {selectedTasksForClaiming.length > 0 ? (
                `${selectedTasksForClaiming.length} selected`
              ) : (
                <span>Select Multiple Tasks at Once</span>
              )}
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
          {!isAdminView && (
            <div className="text-sm text-blue-600 font-medium">
              {selectedTasksForClaiming.length > 0 ? (
                `${selectedTasksForClaiming.length} selected`
              ) : (
                <span>Select Multiple Tasks at Once</span>
              )}
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div>
          <div className="table-header rounded-t-lg">
            <div className={`grid gap-6 px-8 py-4 ${isAdminView ? 'grid-cols-9' : 'grid-cols-12'}`}>
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
              {!isAdminView && (
                <div className="col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900">Action</h3>
                </div>
              )}
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
              const isUnclaimed = !task.claimedBy || task.claimedBy.length === 0
              const isFull = task.maxContributors && task.claimedBy && task.claimedBy.length >= task.maxContributors
              const isPartiallyFilled = task.claimedBy && task.claimedBy.length > 0
              
              // Determine row styling based on task state
              let rowClass = `table-row grid gap-6 px-8 py-6 ${isAdminView ? 'grid-cols-9' : 'grid-cols-12'}`
              if (isUnclaimed && isOwner) {
                rowClass += " bg-orange-50 border-l-4 border-orange-200" // Draft state
              } else if (isFull) {
                rowClass += " bg-green-50 border-l-4 border-green-200" // Complete state
              } else if (isPartiallyFilled) {
                rowClass += " bg-blue-50 border-l-4 border-blue-200" // In Progress state
              }
              
              return (
              <div key={task.id}>
                <div className={rowClass}>
                  <div className={isAdminView ? "col-span-3" : "col-span-4 sm:col-span-3"}>
                    {editingTasks.has(task.id) ? (
                      <div className="space-y-2">
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
                      <div className="space-y-1">
                        {task.claimedBy.map((name, idx) => (
                          <div key={idx} className="flex items-center gap-2 group/contributor">
                            <span className="text-base text-gray-700">{name}</span>
                            {!isAdminView && (
                              <button
                                onClick={() => handleUnclaimTask(task.id, name, task.name)}
                                className="opacity-0 group-hover/contributor:opacity-100 text-xs text-red-600 hover:text-red-700 hover:underline transition-opacity"
                                title="Remove yourself"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                        {task.maxContributors && (
                          <span className="text-sm text-muted-foreground">
                            ({task.claimedBy.length}/{task.maxContributors})
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-lg text-muted-foreground">—</p>
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
                  {!isAdminView && (
                  <div className="col-span-2">
                    {editingTasks.has(task.id) ? (
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => saveTaskEdit(task.id)}
                          size="sm"
                          className="text-base px-3 py-2 h-auto min-h-[44px] font-medium"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          onClick={() => cancelEditing(task.id)}
                          variant="outline"
                          size="sm"
                          className="text-base px-3 py-2 h-auto min-h-[44px] font-medium"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        {task.status === "available" && (
                          <Button
                            onClick={() => handleSelectTaskForClaiming(task.id)}
                            className={`text-base px-6 py-2 h-auto min-h-[44px] font-medium ${
                              selectedTasksForClaiming.includes(task.id) 
                                ? 'btn-primary' 
                                : 'bg-blue-500 text-white hover:bg-blue-600 border-0'
                            }`}
                          >
                            {selectedTasksForClaiming.includes(task.id) ? 'Selected' : 'Select Task'}
                          </Button>
                        )}
                        {task.status === "claimed" &&
                          projectSettings.allowMultipleContributors &&
                          task.claimedBy &&
                          (!task.maxContributors || task.claimedBy.length < task.maxContributors) && (
                            <Button
                              onClick={() => handleSelectTaskForClaiming(task.id)}
                              className={`text-base px-6 py-2 h-auto min-h-[44px] font-medium ${
                                selectedTasksForClaiming.includes(task.id) 
                                  ? 'btn-primary' 
                                  : 'bg-blue-500 text-white hover:bg-blue-600 border-0'
                              }`}
                            >
                              {selectedTasksForClaiming.includes(task.id) ? 'Selected' : 'Select to Join'}
                            </Button>
                          )}
                      </>
                    )}
                  </div>
                  )}
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

      {/* Mobile: Task cards without wrapper */}
      <div className="md:hidden space-y-4 px-2">
          {tasks.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No tasks yet</h3>
              <p className="text-gray-600">{isOwner ? "Add tasks to get started" : "The host will add tasks soon"}</p>
            </div>
          ) : tasks.map((task) => {
            const isUnclaimed = !task.claimedBy || task.claimedBy.length === 0
            const isFull = task.maxContributors && task.claimedBy && task.claimedBy.length >= task.maxContributors
            const isPartiallyFilled = task.claimedBy && task.claimedBy.length > 0
            
            // Determine card styling based on task state
            let cardClass = "bg-white border border-gray-200 rounded-lg p-5 space-y-4 shadow-sm"
            if (isUnclaimed && isOwner) {
              cardClass += " bg-orange-50 border-l-4 border-orange-200" // Draft state
            } else if (isFull) {
              cardClass += " bg-green-50 border-l-4 border-green-200" // Complete state
            } else if (isPartiallyFilled) {
              cardClass += " bg-blue-50 border-l-4 border-blue-200" // In Progress state
            }
            
            return (
            <div key={task.id} className={cardClass}>
                  {editingTasks.has(task.id) ? (
                    <div className="space-y-4">
                      <Input
                        value={editValues[task.id]?.name || ''}
                        onChange={(e) => setEditValues(prev => ({
                          ...prev,
                          [task.id]: { ...prev[task.id], name: e.target.value }
                        }))}
                        className="text-xl font-bold py-4 px-4"
                        placeholder="Task name"
                        maxLength={100}
                      />
                      <div className="space-y-2">
                        <Textarea
                          value={editValues[task.id]?.description || ''}
                          onChange={(e) => setEditValues(prev => ({
                            ...prev,
                            [task.id]: { ...prev[task.id], description: e.target.value }
                          }))}
                          className="text-lg resize-none py-3 px-4"
                          placeholder="Task description (optional)"
                          rows={3}
                        />
                        {editValues[task.id]?.description && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditValues(prev => ({
                              ...prev,
                              [task.id]: { ...prev[task.id], description: '' }
                            }))}
                            className="text-base text-muted-foreground hover:text-red-600 h-auto p-2 w-full justify-start"
                          >
                            Clear description
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-col gap-3">
                        <Button
                          onClick={() => saveTaskEdit(task.id)}
                          size="sm"
                          className="w-full text-xl py-5 h-auto min-h-[56px] font-bold"
                        >
                          <Save className="w-5 h-5 mr-2" />
                          Save Changes
                        </Button>
                        <Button
                          onClick={() => cancelEditing(task.id)}
                          variant="outline"
                          size="sm"
                          className="w-full text-xl py-5 h-auto min-h-[56px] font-bold border-2"
                        >
                          <X className="w-5 h-5 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-gray-900 task-name leading-tight">{task.name}</h3>
                          {task.description && (
                            <div className="mt-2">
                              <p className="text-base text-gray-700 leading-relaxed break-words">{task.description}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {isOwner && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(task.id, task.name, task.description)}
                              className="p-3 h-auto min-w-[48px] min-h-[48px] border border-gray-200 hover:border-gray-300 rounded-lg"
                              title={!task.claimedBy || task.claimedBy.length === 0 ? "Add details" : "Edit task"}
                            >
                              <Edit2 className="w-5 h-5" />
                            </Button>
                          )}
                          {isOwner && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTask(task.id, task.name, task.claimedBy)}
                              className="p-3 h-auto min-w-[48px] min-h-[48px] text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 hover:border-red-300 rounded-lg"
                              title="Delete task"
                            >
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-600 mb-2">Claimed By</p>
                          {task.claimedBy && task.claimedBy.length > 0 ? (
                            <div className="space-y-2">
                              {task.claimedBy.map((name, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-2 group/contributor">
                                  <span className="text-base text-gray-900 font-medium">{name}</span>
                                  {!isAdminView && (
                                    <button
                                      onClick={() => handleUnclaimTask(task.id, name, task.name)}
                                      className="text-sm text-red-600 hover:text-red-700 hover:underline font-medium px-2 py-1"
                                      title="Remove yourself"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              ))}
                              {task.maxContributors && (
                                <span className="text-sm text-muted-foreground">
                                  {task.claimedBy.length}/{task.maxContributors} filled
                                </span>
                              )}
                            </div>
                          ) : (
                            <p className="text-base text-muted-foreground">—</p>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-600 mb-2">Status</p>
                          <div className="flex flex-wrap gap-1">
                            {getStatusBadge(task.status, task.claimedBy, task.maxContributors)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleComments(task.id)}
                          className="text-base px-3 py-2 h-auto min-h-[44px] font-medium text-muted-foreground hover:text-gray-900 w-full justify-start border border-gray-200 hover:border-gray-300 rounded-lg"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Comments ({task.comments.length})
                          {expandedComments.has(task.id) ? (
                            <ChevronDown className="w-4 h-4 ml-auto" />
                          ) : (
                            <ChevronRight className="w-4 h-4 ml-auto" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                {expandedComments.has(task.id) && (
                  <div className="space-y-4 pt-2 border-t border-gray-300">
                    {task.comments.length > 0 && (
                      <div className="space-y-3">
                        {task.comments.map((comment) => (
                          <div key={comment.id} className="bg-muted/30 rounded-lg p-4">
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-900">{comment.author}</span>
                            </div>
                            <p className="text-base text-gray-900">{comment.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <label htmlFor={`mobile-comment-${task.id}`} className="text-xl font-bold text-gray-900">
                          Add a comment:
                        </label>
                        <span className="text-sm text-muted-foreground">
                          Posting as: {session?.user?.name || session?.user?.email || "You'll be asked for your name"}
                        </span>
                      </div>
                      <textarea
                        id={`mobile-comment-${task.id}`}
                        value={newComments[task.id] || ""}
                        onChange={(e) => setNewComments((prev) => ({ ...prev, [task.id]: e.target.value }))}
                        placeholder="Type your comment..."
                        className="w-full px-5 py-4 text-xl border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                        rows={4}
                      />
                      <Button
                        onClick={() => handleAddComment(task.id)}
                        disabled={!newComments[task.id]?.trim()}
                        className="w-full text-xl py-5 h-auto min-h-[56px] font-bold"
                      >
                        Post Comment
                      </Button>
                    </div>
                  </div>
                )}

                {!isAdminView && !editingTasks.has(task.id) && task.status === "available" && (
                  <div className="pt-3 border-t border-gray-200">
                    <Button
                      onClick={() => handleSelectTaskForClaiming(task.id)}
                      className={`w-full text-lg py-4 h-auto min-h-[56px] font-semibold ${
                        selectedTasksForClaiming.includes(task.id) 
                          ? 'btn-primary' 
                          : 'bg-blue-500 text-white hover:bg-blue-600 border-0'
                      }`}
                    >
                      {selectedTasksForClaiming.includes(task.id) ? '✓ Selected' : 'Select This Task'}
                    </Button>
                  </div>
                )}
                {!isAdminView && !editingTasks.has(task.id) && task.status === "claimed" &&
                  projectSettings.allowMultipleContributors &&
                  task.claimedBy &&
                  (!task.maxContributors || task.claimedBy.length < task.maxContributors) && (
                    <div className="pt-3 border-t border-gray-200">
                      <Button
                        onClick={() => handleSelectTaskForClaiming(task.id)}
                        className={`w-full text-base py-3 h-auto min-h-[48px] font-medium ${
                          selectedTasksForClaiming.includes(task.id) 
                            ? 'btn-primary' 
                            : 'bg-blue-500 text-white hover:bg-blue-600 border-0'
                        }`}
                      >
                        {selectedTasksForClaiming.includes(task.id) ? 'Selected' : 'Select to Join'}
                      </Button>
                    </div>
                  )}
              </div>
            )}
          )}
        </div>
    </div>
  )
}
