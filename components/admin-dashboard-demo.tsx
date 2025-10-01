"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, ChevronRight, MessageCircle, Trash2, Settings, Plus, CheckCircle2, Users } from "lucide-react"
import { useDemo } from "@/contexts/DemoContext"

const teamMembers = ["Sarah Johnson", "Mike Chen", "Jordan Lee", "Emma Davis", "Taylor Brown", "Alex Rivera", "Casey Park"]

export default function AdminDashboardDemo() {
  const {
    tasks,
    projectSettings,
    addTasks,
    deleteTask,
    markTaskComplete,
    reassignTask,
    addComment,
    updateProjectSettings
  } = useDemo()

  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [newComments, setNewComments] = useState<Record<string, string>>({})
  
  const [taskInput, setTaskInput] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [showAddSuccess, setShowAddSuccess] = useState(false)

  // Reassign task state
  const [reassignSelections, setReassignSelections] = useState<Record<string, string>>({})

  const handleAddTasks = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!taskInput.trim()) return

    // Parse input - handle both line breaks and commas
    const taskNames = taskInput
      .split(/[\n,]+/)
      .map((task) => task.trim())
      .filter((task) => task.length > 0)

    if (taskNames.length === 0) return

    addTasks(taskNames, taskDescription.trim() || undefined)
    setTaskInput("")
    setTaskDescription("")
    setShowAddSuccess(true)

    // Hide success message after 3 seconds
    setTimeout(() => setShowAddSuccess(false), 3000)
  }

  const handleMarkComplete = (taskId: string) => {
    markTaskComplete(taskId)
  }

  const handleReassignTask = (taskId: string) => {
    const newAssignee = reassignSelections[taskId]
    if (!newAssignee) return

    // Find current assignee to replace
    const task = tasks.find(t => t.id === taskId)
    if (task && task.claimedBy && task.claimedBy.length > 0) {
      reassignTask(taskId, task.claimedBy[0], newAssignee)
    }

    // Clear the selection
    setReassignSelections((prev) => ({ ...prev, [taskId]: "" }))
  }

  const handleDeleteTask = (taskId: string) => {
    if (confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      deleteTask(taskId)
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

    addComment(taskId, "Admin", commentText)
    setNewComments((prev) => ({ ...prev, [taskId]: "" }))
    
    // Close the comment section after posting
    setExpandedComments((prev) => {
      const newSet = new Set(prev)
      newSet.delete(taskId)
      return newSet
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return (
          <Badge className="status-available text-base px-4 py-1.5 font-medium rounded-full shadow-sm">Available</Badge>
        )
      case "claimed":
        return (
          <Badge className="status-claimed text-base px-4 py-1.5 font-medium rounded-full shadow-md">Claimed</Badge>
        )
      case "completed":
        return (
          <Badge className="status-completed text-base px-4 py-1.5 font-medium rounded-full shadow-md">Completed</Badge>
        )
      default:
        return (
          <Badge className="status-available text-base px-4 py-1.5 font-medium rounded-full shadow-sm">Available</Badge>
        )
    }
  }

  // Get active contributors for display
  const activeContributors = Array.from(new Set(
    tasks
      .filter(task => task.claimedBy && task.claimedBy.length > 0)
      .flatMap(task => task.claimedBy || [])
  ))

  return (
    <div className="space-y-8">
      <div className="card-admin p-8 text-center">
        <div className="flex items-center justify-center mb-6">
          <svg className="header-icon text-green-600 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h1 className="header-admin mb-0">Demo Admin Dashboard</h1>
        </div>
        <p className="text-xl text-muted-foreground mb-4">
          Experience the full power of our task management system with realistic demo data
        </p>
        <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full shadow-lg hover:shadow-xl hover:shadow-orange-500/25 transition-all duration-300">
          <div className="w-3 h-3 bg-white rounded-full mr-3 animate-pulse"></div>
          <span className="text-white text-lg font-semibold">Demo Admin Mode</span>
        </div>
        
        {/* Demo Notice */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-6">
          <p className="text-orange-800 text-sm">
            <strong>Demo Mode:</strong> All changes are temporary and stored in memory only. 
            Create a real project to save your data permanently!
          </p>
        </div>
      </div>

      {/* Active Contributors Section */}
      {activeContributors.length > 0 && (
        <Card className="shadow-lg shadow-black/8 hover:shadow-xl hover:shadow-black/12 border-2 border-accent/20">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">👥 Active Contributors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeContributors.map((contributor) => {
                const contributorTasks = tasks.filter(task => 
                  task.claimedBy && task.claimedBy.includes(contributor)
                )
                return (
                  <div key={contributor} className="bg-gradient-to-br from-card to-muted border-2 border-gray-300/30 rounded-2xl p-6 shadow-lg hover:-translate-y-1 transition-transform duration-200">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                        {contributor.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{contributor}</h3>
                        <p className="text-sm text-muted-foreground">{contributorTasks.length} active {contributorTasks.length === 1 ? 'task' : 'tasks'}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {contributorTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700 truncate flex-1 mr-2">{task.name}</span>
                          {getStatusBadge(task.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg shadow-black/8 hover:shadow-xl hover:shadow-black/12 border-2 border-secondary/20">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">⚙️ Project Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label htmlFor="project-name" className="block text-lg font-semibold text-gray-900 mb-2">
                📋 Project Name
              </label>
              <Input
                id="project-name"
                type="text"
                value={projectSettings.projectName}
                onChange={(e) => updateProjectSettings({ projectName: e.target.value })}
                placeholder="e.g., Smith Family Potluck"
                className="h-14 text-lg border-2 border-gray-300/50 focus:ring-primary/50 focus:border-primary rounded-xl bg-white/80 hover:shadow-lg hover:shadow-primary/25 transition-all duration-200"
              />
            </div>

            <div className="space-y-4">
              <label htmlFor="task-label" className="block text-lg font-semibold text-gray-900 mb-2">
                🏷️ Task Label
              </label>
              <Input
                id="task-label"
                type="text"
                value={projectSettings.taskLabel}
                onChange={(e) => updateProjectSettings({ taskLabel: e.target.value })}
                placeholder="e.g., Food Dishes, Volunteer Roles, Equipment"
                className="h-14 text-lg border-2 border-gray-300/50 focus:ring-primary/50 focus:border-primary rounded-xl bg-white/80 hover:shadow-lg hover:shadow-primary/25 transition-all duration-200"
              />
              <p className="text-sm text-muted-foreground font-medium">
                Task Label will replace 'Task Name' in your table
              </p>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t-2 border-gray-300/50">
            <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-8">
              🎯 Assignment Settings
            </h3>
            <div className="space-y-8">
              <div className="flex items-start gap-6 p-6 bg-gradient-to-br from-card to-muted rounded-xl border border-gray-300/30 hover:-translate-y-1 transition-transform duration-200">
                <input
                  type="checkbox"
                  id="allow-multiple-claims"
                  checked={projectSettings.allowMultipleTasks}
                  onChange={(e) => updateProjectSettings({ allowMultipleTasks: e.target.checked })}
                  className="w-8 h-8 mt-1 scale-125 accent-primary rounded-lg border-2 border-gray-300/50 focus:ring-4 focus:ring-primary/30 transition-all duration-200"
                />
                <div className="space-y-2 flex-1">
                  <label
                    htmlFor="allow-multiple-claims"
                    className="text-lg font-bold text-gray-900 flex items-center cursor-pointer"
                  >
                    <Users className="w-5 h-5 mr-2 text-primary" />☑ Let people claim multiple tasks
                  </label>
                  <p className="text-base text-muted-foreground">One person can take several different tasks</p>
                </div>
              </div>

              <div className="flex items-start gap-6 p-6 bg-gradient-to-br from-card to-muted rounded-xl border border-gray-300/30 hover:-translate-y-1 transition-transform duration-200">
                <input
                  type="checkbox"
                  id="allow-multiple-contributors"
                  checked={projectSettings.allowMultipleContributors}
                  onChange={(e) => updateProjectSettings({ allowMultipleContributors: e.target.checked })}
                  className="w-8 h-8 mt-1 scale-125 accent-accent rounded-lg border-2 border-gray-300/50 focus:ring-4 focus:ring-accent/30 transition-all duration-200"
                />
                <div className="space-y-2 flex-1">
                  <label
                    htmlFor="allow-multiple-contributors"
                    className="text-lg font-bold text-gray-900 flex items-center cursor-pointer"
                  >
                    <Users className="w-5 h-5 mr-2 text-accent" />☑ Allow team tasks (multiple people per task)
                  </label>
                  <p className="text-base text-muted-foreground">Multiple people can work together on one task</p>
                </div>
              </div>

              {projectSettings.allowMultipleContributors && (
                <div className="ml-6 space-y-4 animate-in zoom-in-95 duration-600">
                  <label htmlFor="max-contributors" className="text-lg font-bold text-gray-900 block">
                    🔢 Max contributors per task (optional)
                  </label>
                  <Input
                    id="max-contributors"
                    type="number"
                    min="2"
                    max="20"
                    value={projectSettings.maxContributorsPerTask || ""}
                    onChange={(e) =>
                      updateProjectSettings({ 
                        maxContributorsPerTask: e.target.value ? Number.parseInt(e.target.value) : undefined 
                      })
                    }
                    placeholder="Leave empty for unlimited"
                    className="h-14 text-lg border-2 border-gray-300/50 focus:ring-accent/50 focus:border-accent max-w-xs rounded-xl bg-white/80 hover:shadow-lg hover:shadow-primary/25 transition-all duration-200"
                  />
                  <p className="text-sm text-muted-foreground font-medium">Leave empty for unlimited contributors</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg shadow-black/8 hover:shadow-xl hover:shadow-black/12 border-2 border-warning/20">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">➕ Project Setup - Bulk Add Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {showAddSuccess ? (
            <div className="text-center py-12 space-y-6 animate-in zoom-in-95 duration-600">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-accent to-accent/80 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-accent to-warning bg-clip-text text-transparent">
                🎉 Tasks added successfully!
              </h3>
              <p className="text-xl text-muted-foreground">All tasks are now available for claiming.</p>
            </div>
          ) : (
            <form onSubmit={handleAddTasks} className="space-y-8">
              <div className="space-y-4">
                <label htmlFor="task-input" className="text-xl font-bold text-gray-900 block">
                  📝 {projectSettings.taskLabel}s
                </label>
                <textarea
                  id="task-input"
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  placeholder={`Add one or multiple ${projectSettings.taskLabel.toLowerCase()}s (separate by new lines or commas):&#10;Apple pie&#10;Green salad, Garlic bread, Soda drinks`}
                  className="w-full px-6 py-4 text-lg border-2 border-gray-300/50 rounded-2xl bg-white/80 text-gray-900 placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-warning/30 focus:border-warning transition-all duration-200 resize-none shadow-lg hover:shadow-lg hover:shadow-primary/25"
                  rows={6}
                />
                <p className="text-base text-muted-foreground font-medium">
                  💡 Enter one {projectSettings.taskLabel.toLowerCase()} per line, or separate multiple {projectSettings.taskLabel.toLowerCase()}s with commas
                </p>
              </div>

              <div className="space-y-4">
                <label htmlFor="task-description" className="text-xl font-bold text-gray-900 block">
                  📄 {projectSettings.taskLabel} Description (optional, applies to all {projectSettings.taskLabel.toLowerCase()}s)
                </label>
                <textarea
                  id="task-description"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder={`Enter ${projectSettings.taskLabel.toLowerCase()} description (optional)...`}
                  className="w-full px-6 py-4 text-lg border-2 border-gray-300/50 rounded-2xl bg-white/80 text-gray-900 placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-warning/30 focus:border-warning transition-all duration-200 resize-none shadow-lg hover:shadow-lg hover:shadow-primary/25"
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                disabled={!taskInput.trim()}
                className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 w-full text-xl px-8 py-4 h-16 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-6 h-6 mr-3" />
                Add {projectSettings.taskLabel}s
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="card-admin">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">📊 Manage Tasks</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="border-b-2 border-primary/20 bg-gradient-to-r from-secondary to-secondary/80 rounded-t-2xl">
              <div className="grid grid-cols-12 gap-4 px-8 py-6">
                <div className="col-span-3">
                  <h3 className="text-xl font-bold text-white">📋 {projectSettings.taskLabel} Name</h3>
                </div>
                <div className="col-span-2">
                  <h3 className="text-xl font-bold text-white">👤 Claimed By</h3>
                </div>
                <div className="col-span-2">
                  <h3 className="text-xl font-bold text-white">🎯 Status</h3>
                </div>
                <div className="col-span-2">
                  <h3 className="text-xl font-bold text-white">💬 Comments</h3>
                </div>
                <div className="col-span-3">
                  <h3 className="text-xl font-bold text-white">⚡ Admin Actions</h3>
                </div>
              </div>
            </div>

            <div className="divide-y-2 divide-border/20">
              {tasks.map((task) => (
                <div key={task.id} className="hover:-translate-y-1 transition-transform duration-200">
                  <div className="grid grid-cols-12 gap-4 px-8 py-8 hover:bg-gradient-to-r hover:from-muted/5 hover:to-primary/5 transition-all duration-300">
                    <div className="col-span-3">
                      <p className="text-lg font-bold text-gray-900 text-pretty">{task.name}</p>
                      {task.description && <p className="text-base text-muted-foreground mt-2">{task.description}</p>}
                    </div>
                    <div className="col-span-2">
                      <p className="text-lg font-semibold text-muted-foreground">
                        {task.claimedBy ? task.claimedBy.join(", ") : "—"}
                      </p>
                    </div>
                    <div className="col-span-2 flex items-start">{getStatusBadge(task.status)}</div>
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
                    <div className="col-span-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        {task.status === "claimed" && (
                          <Button
                            onClick={() => handleMarkComplete(task.id)}
                            className="bg-gradient-to-r from-accent to-accent/80 text-accent-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-lg px-6 py-3 h-auto min-h-[48px]"
                          >
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                            Mark Complete
                          </Button>
                        )}

                        {task.status === "claimed" && (
                          <div className="flex items-center gap-3">
                            <Select
                              value={reassignSelections[task.id] || ""}
                              onValueChange={(value) =>
                                setReassignSelections((prev) => ({ ...prev, [task.id]: value }))
                              }
                            >
                              <SelectTrigger className="h-12 text-lg border-2 border-gray-300/50 focus:ring-secondary/50 min-w-[180px] rounded-xl bg-white/80 hover:shadow-lg hover:shadow-primary/25 transition-all duration-200">
                                <SelectValue placeholder="Reassign to..." />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-2 border-gray-300/50">
                                {teamMembers
                                  .filter((member) => !task.claimedBy || !task.claimedBy.includes(member))
                                  .map((member) => (
                                    <SelectItem key={member} value={member} className="text-lg py-4 rounded-lg">
                                      {member}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            {reassignSelections[task.id] && (
                              <Button
                                onClick={() => handleReassignTask(task.id)}
                                className="bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-lg px-6 py-3 h-12"
                              >
                                Reassign
                              </Button>
                            )}
                          </div>
                        )}

                        <Button
                          onClick={() => handleDeleteTask(task.id)}
                          variant="ghost"
                          size="sm"
                          className="text-lg px-4 py-3 h-auto min-h-[48px] font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-200"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
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
                          <label htmlFor={`admin-comment-${task.id}`} className="text-lg font-bold text-gray-900">
                            💬 Add admin comment:
                          </label>
                          <textarea
                            id={`admin-comment-${task.id}`}
                            value={newComments[task.id] || ""}
                            onChange={(e) => setNewComments((prev) => ({ ...prev, [task.id]: e.target.value }))}
                            placeholder="Type your admin comment here..."
                            className="w-full px-6 py-4 text-lg border-2 border-gray-300/50 rounded-2xl bg-white/80 text-gray-900 placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary transition-all duration-200 resize-none shadow-lg hover:shadow-lg hover:shadow-primary/25"
                            rows={3}
                          />
                          <Button
                            onClick={() => handleAddComment(task.id)}
                            disabled={!newComments[task.id]?.trim()}
                            className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-lg px-8 py-3 h-auto min-h-[48px]"
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
                    <h3 className="text-xl font-bold text-gray-900 text-pretty">{task.name}</h3>
                    {task.description && <p className="text-lg text-muted-foreground">{task.description}</p>}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-bold text-muted-foreground mb-2">👤 Claimed By</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {task.claimedBy ? task.claimedBy.join(", ") : "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-muted-foreground mb-3">🎯 Status</p>
                        {getStatusBadge(task.status)}
                      </div>
                    </div>
                  </div>

                  {/* Admin Actions */}
                  <div className="space-y-4 pt-4 border-t-2 border-gray-300/50">
                    {task.status === "claimed" && (
                      <div className="space-y-4">
                        <Button
                          onClick={() => handleMarkComplete(task.id)}
                          className="bg-gradient-to-r from-accent to-accent/80 text-accent-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 w-full text-lg py-4 h-auto min-h-[52px]"
                        >
                          <CheckCircle2 className="w-6 h-6 mr-3" />
                          Mark Complete
                        </Button>

                        <div className="space-y-3">
                          <Select
                            value={reassignSelections[task.id] || ""}
                            onValueChange={(value) => setReassignSelections((prev) => ({ ...prev, [task.id]: value }))}
                          >
                            <SelectTrigger className="h-14 text-lg border-2 border-gray-300/50 focus:ring-secondary/50 rounded-xl bg-white/80 hover:shadow-lg hover:shadow-primary/25 transition-all duration-200">
                              <SelectValue placeholder="Reassign to..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-2 border-gray-300/50">
                              {teamMembers
                                .filter((member) => !task.claimedBy || !task.claimedBy.includes(member))
                                .map((member) => (
                                  <SelectItem key={member} value={member} className="text-lg py-4 rounded-lg">
                                    {member}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          {reassignSelections[task.id] && (
                            <Button
                              onClick={() => handleReassignTask(task.id)}
                              className="bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 w-full text-lg py-4 h-14"
                            >
                              Reassign Task
                            </Button>
                          )}
                        </div>
                      </div>
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

                      <Button
                        onClick={() => handleDeleteTask(task.id)}
                        variant="ghost"
                        size="sm"
                        className="text-lg px-4 py-3 h-auto min-h-[48px] font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-200"
                      >
                        <Trash2 className="w-5 h-5" />
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
                          htmlFor={`mobile-admin-comment-${task.id}`}
                          className="text-lg font-bold text-gray-900"
                        >
                          💬 Add admin comment:
                        </label>
                        <textarea
                          id={`mobile-admin-comment-${task.id}`}
                          value={newComments[task.id] || ""}
                          onChange={(e) => setNewComments((prev) => ({ ...prev, [task.id]: e.target.value }))}
                          placeholder="Type your admin comment here..."
                          className="w-full px-6 py-4 text-lg border-2 border-gray-300/50 rounded-2xl bg-white/80 text-gray-900 placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary transition-all duration-200 resize-none shadow-lg hover:shadow-lg hover:shadow-primary/25"
                          rows={3}
                        />
                        <Button
                          onClick={() => handleAddComment(task.id)}
                          disabled={!newComments[task.id]?.trim()}
                          className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 w-full text-lg py-4 h-auto min-h-[52px]"
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
