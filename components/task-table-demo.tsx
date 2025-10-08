"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, MessageCircle, User, Users2 } from "lucide-react"
import { useDemo } from "@/contexts/DemoContext"

export default function TaskTableDemo() {
  const { tasks, projectSettings, claimTask, addComment } = useDemo()
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [newComments, setNewComments] = useState<Record<string, string>>({})
  const [selectedTasksForClaiming, setSelectedTasksForClaiming] = useState<string[]>([])

  const handleSelectTaskForClaiming = (taskId: string) => {
    if (selectedTasksForClaiming.includes(taskId)) {
      setSelectedTasksForClaiming(prev => prev.filter(id => id !== taskId))
    } else {
      setSelectedTasksForClaiming(prev => [...prev, taskId])
    }
  }

  const handleClaimTask = (taskId: string) => {
    claimTask(taskId, "You")
    // Remove from selection after claiming
    setSelectedTasksForClaiming(prev => prev.filter(id => id !== taskId))
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
    if (newComments[taskId] && newComments[taskId].trim()) {
      addComment(taskId, "You", newComments[taskId].trim())
      setNewComments((prev) => ({ ...prev, [taskId]: "" }))
      
      // Close the comment section after posting
      setExpandedComments((prev) => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
    }
  }

  const getStatusBadge = (task: { status: string; claimedBy: string[] | null; maxContributors?: number }) => {
    const maxContributors = task.maxContributors || projectSettings.maxContributorsPerTask || 1
    const currentContributors = task.claimedBy?.length || 0
    const spotsLeft = maxContributors - currentContributors

    switch (task.status) {
      case "available":
        return (
          <Badge className="status-available text-base px-4 py-1.5 font-medium rounded-full shadow-sm whitespace-nowrap">
            Available
          </Badge>
        )
      case "claimed":
        if (projectSettings.allowMultipleContributors && maxContributors > 1) {
          if (spotsLeft > 0) {
            return (
              <Badge className="status-claimed text-base px-4 py-1.5 font-medium rounded-full shadow-md whitespace-nowrap">
                Claimed ({spotsLeft} spots left)
              </Badge>
            )
          }
        }
        return (
          <Badge className="status-claimed text-base px-4 py-1.5 font-medium rounded-full shadow-md whitespace-nowrap">
            Claimed
          </Badge>
        )
      case "completed":
        return (
          <Badge className="status-completed text-base px-4 py-1.5 font-medium rounded-full shadow-md whitespace-nowrap">
            Completed
          </Badge>
        )
      default:
        return (
          <Badge className="status-available text-base px-4 py-1.5 font-medium rounded-full shadow-sm whitespace-nowrap">
            Available
          </Badge>
        )
    }
  }

  // Get available tasks that can be claimed
  const availableTasks = tasks.filter(task => {
    if (task.status === "available") return true
    if (task.status === "claimed" && projectSettings.allowMultipleContributors) {
      const maxContributors = task.maxContributors || projectSettings.maxContributorsPerTask || 1
      const currentContributors = task.claimedBy?.length || 0
      return currentContributors < maxContributors
    }
    return false
  })

  return (
    <div className="space-y-8">
      {/* Task Claiming Interface */}
      {selectedTasksForClaiming.length > 0 && (
        <Card className="shadow-lg shadow-black/8 hover:shadow-xl hover:shadow-black/12 border-2 border-primary/20">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              🎯 Selected Tasks ({selectedTasksForClaiming.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6">
              {selectedTasksForClaiming.map(taskId => {
                const task = tasks.find(t => t.id === taskId)
                return task ? (
                  <div key={taskId} className="flex items-center justify-between bg-gradient-to-br from-card to-muted rounded-xl p-4 border border-gray-300/30">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                      <span className="font-semibold text-gray-900">{task.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectTaskForClaiming(taskId)}
                      className="text-red-500 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ) : null
              })}
            </div>
            <div className="flex gap-4">
              <Button
                onClick={() => {
                  selectedTasksForClaiming.forEach(taskId => handleClaimTask(taskId))
                  setSelectedTasksForClaiming([])
                }}
                className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-lg px-8 py-4 h-auto"
              >
                <User className="w-5 h-5 mr-2" />
                Claim Selected ({selectedTasksForClaiming.length})
              </Button>
              <Button
                onClick={() => setSelectedTasksForClaiming([])}
                variant="outline"
                className="text-lg px-8 py-4 h-auto font-medium"
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Task Table */}
      <Card className="shadow-lg shadow-black/8 hover:shadow-xl hover:shadow-black/12 border-2 border-secondary/20">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            📋 {projectSettings.projectName} - {projectSettings.taskLabel}s
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="border-b-2 border-primary/20 bg-gradient-to-r from-secondary to-secondary/80 rounded-t-2xl">
              <div className="grid grid-cols-12 gap-4 px-8 py-6">
                <div className="col-span-1">
                  <h3 className="text-lg font-bold text-white">Select</h3>
                </div>
                <div className="col-span-4">
                  <h3 className="text-lg font-bold text-white">📋 {projectSettings.taskLabel} Name</h3>
                </div>
                <div className="col-span-2">
                  <h3 className="text-lg font-bold text-white">👤 Claimed By</h3>
                </div>
                <div className="col-span-2">
                  <h3 className="text-lg font-bold text-white">🎯 Status</h3>
                </div>
                <div className="col-span-2">
                  <h3 className="text-lg font-bold text-white">💬 Comments</h3>
                </div>
                <div className="col-span-1">
                  <h3 className="text-lg font-bold text-white">⚡ Action</h3>
                </div>
              </div>
            </div>

            <div className="divide-y-2 divide-border/20">
              {tasks.map((task) => (
                <div key={task.id} className="hover:-translate-y-1 transition-transform duration-200">
                  <div className="grid grid-cols-12 gap-4 px-8 py-8 hover:bg-gradient-to-r hover:from-muted/5 hover:to-primary/5 transition-all duration-300">
                    <div className="col-span-1 flex items-start">
                      {availableTasks.some(t => t.id === task.id) && (
                        <input
                          type="checkbox"
                          checked={selectedTasksForClaiming.includes(task.id)}
                          onChange={() => handleSelectTaskForClaiming(task.id)}
                          className="w-5 h-5 mt-1 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                        />
                      )}
                    </div>
                    <div className="col-span-4">
                      <p className="text-lg font-bold text-gray-900 break-words leading-tight">{task.name}</p>
                      {task.description && <p className="text-base text-muted-foreground mt-2">{task.description}</p>}
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center">
                        {task.claimedBy && task.claimedBy.length > 1 ? (
                          <Users2 className="w-4 h-4 mr-2 text-muted-foreground" />
                        ) : task.claimedBy && task.claimedBy.length === 1 ? (
                          <User className="w-4 h-4 mr-2 text-muted-foreground" />
                        ) : null}
                        <p className="text-lg font-semibold text-muted-foreground">
                          {task.claimedBy && task.claimedBy.length > 0 ? task.claimedBy.join(", ") : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center justify-start">{getStatusBadge(task)}</div>
                    <div className="col-span-2 flex items-start">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleComments(task.id)}
                        className="text-lg px-4 py-3 h-auto min-h-[48px] font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
                      >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        {task.comments.length}
                        {expandedComments.has(task.id) ? (
                          <ChevronDown className="w-5 h-5 ml-2" />
                        ) : (
                          <ChevronRight className="w-5 h-5 ml-2" />
                        )}
                      </Button>
                    </div>
                    <div className="col-span-1">
                      {availableTasks.some(t => t.id === task.id) && (
                        <Button
                          onClick={() => handleClaimTask(task.id)}
                          className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-base px-4 py-2 h-auto"
                        >
                          {task.status === "available" ? "Claim" : "Join"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {expandedComments.has(task.id) && (
                    <div className="px-8 pb-8 bg-gradient-to-r from-muted/10 to-primary/5 animate-in slide-in-from-bottom-4 duration-400">
                      <div className="max-w-4xl">
                        {task.comments.length > 0 && (
                          <div className="space-y-4 mb-6">
                            {task.comments.map((comment) => (
                              <div
                                key={comment.id}
                                className="bg-gradient-to-br from-card to-muted border-2 border-gray-300/30 rounded-2xl p-6 shadow-lg hover:-translate-y-1 transition-transform duration-200"
                              >
                                <div className="mb-3">
                                  <span className="text-base font-bold text-gray-900">{comment.author}</span>
                                </div>
                                <p className="text-lg text-gray-900">{comment.text}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="space-y-4">
                          <label htmlFor={`comment-${task.id}`} className="text-lg font-bold text-gray-900">
                            💬 Add your comment:
                          </label>
                          <textarea
                            id={`comment-${task.id}`}
                            value={newComments[task.id] || ""}
                            onChange={(e) => setNewComments((prev) => ({ ...prev, [task.id]: e.target.value }))}
                            placeholder="Share your thoughts or ask questions..."
                            className="w-full px-6 py-4 text-lg border-2 border-gray-300/50 rounded-2xl bg-white/80 text-gray-900 placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary transition-all duration-200 resize-none shadow-lg hover:shadow-lg hover:shadow-primary/25"
                            rows={3}
                          />
                          <Button
                            onClick={() => handleAddComment(task.id)}
                            disabled={!newComments[task.id]?.trim()}
                            className="bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-lg px-8 py-3 h-auto min-h-[48px]"
                          >
                            <MessageCircle className="w-5 h-5 mr-2" />
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
          <div className="lg:hidden space-y-6 p-6">
            {tasks.map((task) => (
              <Card key={task.id} className="shadow-lg shadow-black/8 hover:shadow-xl hover:shadow-black/12 border-2 border-primary/20 hover:-translate-y-1 transition-transform duration-200">
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 break-words leading-tight">{task.name}</h3>
                        {task.description && <p className="text-lg text-muted-foreground mt-2">{task.description}</p>}
                      </div>
                      {availableTasks.some(t => t.id === task.id) && (
                        <input
                          type="checkbox"
                          checked={selectedTasksForClaiming.includes(task.id)}
                          onChange={() => handleSelectTaskForClaiming(task.id)}
                          className="w-5 h-5 mt-1 ml-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                        />
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-bold text-muted-foreground mb-2">👤 Claimed By</p>
                        <div className="flex items-center">
                          {task.claimedBy && task.claimedBy.length > 1 ? (
                            <Users2 className="w-4 h-4 mr-2 text-muted-foreground" />
                          ) : task.claimedBy && task.claimedBy.length === 1 ? (
                            <User className="w-4 h-4 mr-2 text-muted-foreground" />
                          ) : null}
                          <p className="text-lg font-semibold text-gray-900">
                            {task.claimedBy && task.claimedBy.length > 0 ? task.claimedBy.join(", ") : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-muted-foreground mb-3">🎯 Status</p>
                        {getStatusBadge(task)}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-4 pt-4 border-t-2 border-gray-300/50">
                    {availableTasks.some(t => t.id === task.id) && (
                      <Button
                        onClick={() => handleClaimTask(task.id)}
                        className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 w-full text-lg py-4 h-auto min-h-[52px]"
                      >
                        <User className="w-6 h-6 mr-3" />
                        {task.status === "available" ? `Claim ${projectSettings.taskLabel}` : `Join ${projectSettings.taskLabel}`}
                      </Button>
                    )}

                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleComments(task.id)}
                        className="text-lg px-4 py-3 h-auto min-h-[48px] font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
                      >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Comments ({task.comments.length})
                        {expandedComments.has(task.id) ? (
                          <ChevronDown className="w-5 h-5 ml-2" />
                        ) : (
                          <ChevronRight className="w-5 h-5 ml-2" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {expandedComments.has(task.id) && (
                    <div className="space-y-6 pt-4 border-t-2 border-gray-300/50 animate-in slide-in-from-bottom-4 duration-400">
                      {task.comments.length > 0 && (
                        <div className="space-y-4">
                          {task.comments.map((comment) => (
                            <div
                              key={comment.id}
                              className="bg-gradient-to-br from-card to-muted rounded-2xl p-6 border-2 border-gray-300/30 shadow-lg"
                            >
                              <div className="mb-3">
                                <span className="text-base font-bold text-gray-900">{comment.author}</span>
                              </div>
                              <p className="text-lg text-gray-900">{comment.text}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="space-y-4">
                        <label
                          htmlFor={`mobile-comment-${task.id}`}
                          className="text-lg font-bold text-gray-900"
                        >
                          💬 Add your comment:
                        </label>
                        <textarea
                          id={`mobile-comment-${task.id}`}
                          value={newComments[task.id] || ""}
                          onChange={(e) => setNewComments((prev) => ({ ...prev, [task.id]: e.target.value }))}
                          placeholder="Share your thoughts or ask questions..."
                          className="w-full px-6 py-4 text-lg border-2 border-gray-300/50 rounded-2xl bg-white/80 text-gray-900 placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary transition-all duration-200 resize-none shadow-lg hover:shadow-lg hover:shadow-primary/25"
                          rows={3}
                        />
                        <Button
                          onClick={() => handleAddComment(task.id)}
                          disabled={!newComments[task.id]?.trim()}
                          className="bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 w-full text-lg py-4 h-auto min-h-[52px]"
                        >
                          <MessageCircle className="w-6 h-6 mr-3" />
                          Post Comment
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

