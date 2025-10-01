"use client"

import React, { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown, ChevronRight, MessageCircle, Edit2, Save, X, Trash2 } from "lucide-react"
import { useTask, type TaskStatus } from "@/contexts/TaskContextWithSupabase"

export default function TaskTable() {
  const { 
    tasks, 
    projectSettings, 
    claimTask, 
    addComment, 
    updateTask,
    deleteTask,
    selectedTasksForClaiming,
    addTaskToClaimingSelection,
    removeTaskFromClaimingSelection
  } = useTask()
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

    addComment(taskId, commentText, "You")
    setNewComments((prev) => ({ ...prev, [taskId]: "" }))
    
    // Close the comment section after posting
    setExpandedComments((prev) => {
      const newSet = new Set(prev)
      newSet.delete(taskId)
      return newSet
    })
  }

  const handleDeleteTask = async (taskId: string, taskName: string) => {
    if (confirm(`Are you sure you want to delete the task "${taskName}"? This action cannot be undone.`)) {
      try {
        await deleteTask(taskId)
      } catch (error) {
        console.error('Failed to delete task:', error)
        alert('Failed to delete task. Please try again.')
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
    switch (status) {
      case "available":
        if (projectSettings.allowMultipleContributors && maxContributors && maxContributors > 1) {
          return (
            <Badge
              variant="outline"
              className="bg-muted text-muted-foreground border-muted-foreground/20 text-base px-4 py-1.5 font-medium"
            >
              Available ({maxContributors} spots)
            </Badge>
          )
        }
        return (
          <Badge
            variant="outline"
            className="bg-muted text-muted-foreground border-muted-foreground/20 text-base px-4 py-1.5 font-medium"
          >
            Available
          </Badge>
        )
      case "claimed":
        if (projectSettings.allowMultipleContributors && maxContributors && claimedBy) {
          const spotsLeft = maxContributors - claimedBy.length
          if (spotsLeft > 0) {
            return (
              <Badge className="bg-secondary text-secondary-foreground text-base px-4 py-1.5 font-medium">
                Claimed ({spotsLeft} spots left)
              </Badge>
            )
          }
        }
        return (
          <Badge className="bg-secondary text-secondary-foreground text-base px-4 py-1.5 font-medium">Claimed</Badge>
        )
      case "completed":
        return <Badge className="bg-accent text-accent-foreground text-base px-4 py-1.5 font-medium">Completed</Badge>
    }
  }

  return (
    <div className="card-table p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <svg className="section-icon text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <h2 className="header-table mb-0">Active Tasks</h2>
        </div>
        <div className="text-sm text-blue-600 font-medium">
          {selectedTasksForClaiming.length > 0 ? (
            `${selectedTasksForClaiming.length} selected`
          ) : (
            "Select Multiple Tasks at Once"
          )}
        </div>
      </div>
      <div>
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <div className="table-header rounded-t-lg">
            <div className="grid grid-cols-12 gap-6 px-8 py-4">
              <div className="col-span-3">
                <h3 className="text-lg font-semibold text-gray-900">Task Name</h3>
              </div>
              <div className="col-span-2">
                <h3 className="text-lg font-semibold text-gray-900">Claimed By</h3>
              </div>
              <div className="col-span-3">
                <h3 className="text-lg font-semibold text-gray-900">Status</h3>
              </div>
              <div className="col-span-2">
                <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
              </div>
              <div className="col-span-2">
                <h3 className="text-lg font-semibold text-gray-900">Action</h3>
              </div>
            </div>
          </div>

          <div className="divide-y divide-border">
            {tasks.map((task) => (
              <div key={task.id}>
                <div className="table-row grid grid-cols-12 gap-6 px-8 py-6">
                  <div className="col-span-3">
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
                            <p className="text-lg font-medium text-gray-900 text-pretty">{task.name}</p>
                            {task.description && (
                              <div className="mt-1">
                                <p className="text-sm text-muted-foreground">{task.description}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(task.id, task.name, task.description)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTask(task.id, task.name)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete task"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="col-span-2">
                    <p className="text-lg text-muted-foreground">
                      {formatClaimedBy(task.claimedBy, task.maxContributors)}
                    </p>
                  </div>
                  <div className="col-span-3 flex items-center">{getStatusBadge(task.status, task.claimedBy, task.maxContributors)}</div>
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
                  <div className="col-span-2">
                    {editingTasks.has(task.id) ? (
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => saveTaskEdit(task.id)}
                          size="sm"
                          className="text-base px-3 py-2 h-auto min-h-[36px] font-medium"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          onClick={() => cancelEditing(task.id)}
                          variant="outline"
                          size="sm"
                          className="text-base px-3 py-2 h-auto min-h-[36px] font-medium"
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
                        <label htmlFor={`comment-${task.id}`} className="text-sm font-medium text-gray-900">
                          Add a comment:
                        </label>
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
            ))}
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4 p-6">
          {tasks.map((task) => (
            <div key={task.id} className="card-beautiful p-6 space-y-4">
                <div className="space-y-3">
                  {editingTasks.has(task.id) ? (
                    <div className="space-y-3">
                      <Input
                        value={editValues[task.id]?.name || ''}
                        onChange={(e) => setEditValues(prev => ({
                          ...prev,
                          [task.id]: { ...prev[task.id], name: e.target.value }
                        }))}
                        className="text-lg font-semibold"
                        placeholder="Task name"
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
                          className="w-full text-base py-2 h-auto min-h-[44px] font-medium"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button
                          onClick={() => cancelEditing(task.id)}
                          variant="outline"
                          size="sm"
                          className="w-full text-base py-2 h-auto min-h-[44px] font-medium"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 text-pretty">{task.name}</h3>
                        {task.description && (
                          <div className="mt-1">
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(task.id, task.name, task.description)}
                          className="p-2 h-auto"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id, task.name)}
                          className="p-2 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Claimed By</p>
                      <p className="text-base text-gray-900">
                        {formatClaimedBy(task.claimedBy, task.maxContributors)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Status</p>
                      {getStatusBadge(task.status, task.claimedBy, task.maxContributors)}
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleComments(task.id)}
                      className="text-base px-3 py-2 h-auto min-h-[44px] font-medium text-muted-foreground hover:text-gray-900 w-full justify-start"
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

                    <div className="space-y-3">
                      <label htmlFor={`mobile-comment-${task.id}`} className="text-sm font-medium text-gray-900">
                        Add a comment:
                      </label>
                      <textarea
                        id={`mobile-comment-${task.id}`}
                        value={newComments[task.id] || ""}
                        onChange={(e) => setNewComments((prev) => ({ ...prev, [task.id]: e.target.value }))}
                        placeholder="Type your comment here..."
                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                        rows={3}
                      />
                      <Button
                        onClick={() => handleAddComment(task.id)}
                        disabled={!newComments[task.id]?.trim()}
                        className="w-full text-base py-3 h-auto min-h-[44px] font-medium"
                      >
                        Post Comment
                      </Button>
                    </div>
                  </div>
                )}

                {!editingTasks.has(task.id) && task.status === "available" && (
                  <Button
                    onClick={() => handleSelectTaskForClaiming(task.id)}
                    className={`w-full text-base py-3 h-auto min-h-[44px] font-medium ${
                      selectedTasksForClaiming.includes(task.id) 
                        ? 'btn-primary' 
                        : 'bg-blue-500 text-white hover:bg-blue-600 border-0'
                    }`}
                  >
                    {selectedTasksForClaiming.includes(task.id) ? 'Selected' : 'Select Task'}
                  </Button>
                )}
                {!editingTasks.has(task.id) && task.status === "claimed" &&
                  projectSettings.allowMultipleContributors &&
                  task.claimedBy &&
                  (!task.maxContributors || task.claimedBy.length < task.maxContributors) && (
                    <Button
                      onClick={() => handleSelectTaskForClaiming(task.id)}
                      className={`w-full text-base py-3 h-auto min-h-[44px] font-medium ${
                        selectedTasksForClaiming.includes(task.id) 
                          ? 'btn-primary' 
                          : 'bg-blue-500 text-white hover:bg-blue-600 border-0'
                      }`}
                    >
                      {selectedTasksForClaiming.includes(task.id) ? 'Selected' : 'Select to Join'}
                    </Button>
                  )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
