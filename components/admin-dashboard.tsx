"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, ChevronRight, MessageCircle, Trash2, Settings, Plus, Users, X, CheckCircle2 } from "lucide-react"
import { useTask, type TaskStatus } from "@/contexts/TaskContextWithSupabase"
import { useSession } from "next-auth/react"

// Note: teamMembers will be replaced with dynamic contributor data from the context

export default function AdminDashboard() {
  const { data: session } = useSession()
  const { 
    tasks, 
    projectSettings, 
    addTasks, 
    deleteTask, 
    reassignTask, 
    addComment, 
    updateProjectSettings,
    activeContributors,
    addContributorName,
    removeContributorName 
  } = useTask()
  
  // Use actual contributors from the system, with fallback for empty projects
  // Always include the host's name from the session
  const hostName = session?.user?.name || session?.user?.email || "Host"
  const availableContributors = useMemo(() => {
    const contributors = [...activeContributors]
    // Add host name if not already in the list
    if (!contributors.includes(hostName)) {
      contributors.unshift(hostName) // Add host at the beginning
    }
    return contributors.length > 0 ? contributors : [hostName, "Team Member"]
  }, [activeContributors, hostName])
  
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [newComments, setNewComments] = useState<Record<string, string>>({})

  const [taskInput, setTaskInput] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [showAddSuccess, setShowAddSuccess] = useState(false)

  // Reassign task state
  const [reassignSelections, setReassignSelections] = useState<Record<string, string>>({})
  
  // Contributor management state
  const [newContributorName, setNewContributorName] = useState("")
  const [isAddingContributor, setIsAddingContributor] = useState(false)

  const handleAddTasks = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!taskInput.trim()) return

    // Parse input - handle both line breaks and commas
    const taskNames = taskInput
      .split(/[\n,]+/)
      .map((task) => task.trim())
      .filter((task) => task.length > 0)

    if (taskNames.length === 0) return

    addTasks(taskNames, taskDescription.trim() || undefined, true)
    setTaskInput("")
    setTaskDescription("")
    setShowAddSuccess(true)

    // Hide success message after 3 seconds
    setTimeout(() => setShowAddSuccess(false), 3000)
  }


  const handleReassignTask = (taskId: string) => {
    const newAssignee = reassignSelections[taskId]
    if (!newAssignee) return

    reassignTask(taskId, newAssignee)

    // Clear the selection
    setReassignSelections((prev) => ({ ...prev, [taskId]: "" }))
  }

  const handleDeleteTask = (taskId: string) => {
    if (confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      deleteTask(taskId)
    }
  }

  const handleAddContributor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newContributorName.trim()) return

    setIsAddingContributor(true)
    try {
      await addContributorName(newContributorName.trim(), true)
      setNewContributorName("")
    } catch (error) {
      console.error('Failed to add contributor:', error)
      alert('Failed to add contributor. Please try again.')
    } finally {
      setIsAddingContributor(false)
    }
  }

  const handleRemoveContributor = async (name: string) => {
    if (confirm(`Remove "${name}" from the contributor list?`)) {
      try {
        await removeContributorName(name)
      } catch (error) {
        console.error('Failed to remove contributor:', error)
        alert('Failed to remove contributor. Please try again.')
      }
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

    addComment(taskId, commentText, "Admin")
    setNewComments((prev) => ({ ...prev, [taskId]: "" }))
    
    // Close the comment section after posting
    setExpandedComments((prev) => {
      const newSet = new Set(prev)
      newSet.delete(taskId)
      return newSet
    })
  }


  const getStatusBadge = (status: TaskStatus, claimedBy: string[] | null, maxContributors?: number) => {
    switch (status) {
      case "available":
        if (projectSettings.allowMultipleContributors && maxContributors && maxContributors > 1) {
          return (
            <Badge className="status-available text-base px-4 py-1.5 font-medium rounded-full shadow-sm whitespace-nowrap">
              Available ({maxContributors} spots)
            </Badge>
          )
        }
        return (
          <Badge className="status-available text-base px-4 py-1.5 font-medium rounded-full shadow-sm whitespace-nowrap">Available</Badge>
        )
      case "claimed":
        if (projectSettings.allowMultipleContributors && maxContributors && claimedBy) {
          const spotsLeft = maxContributors - claimedBy.length
          if (spotsLeft > 0) {
            return (
              <Badge className="status-claimed text-base px-4 py-1.5 font-medium rounded-full shadow-md whitespace-nowrap">
                Claimed ({spotsLeft} spots left)
              </Badge>
            )
          }
        }
        return (
          <Badge className="status-claimed text-base px-4 py-1.5 font-medium rounded-full shadow-md whitespace-nowrap">Claimed</Badge>
        )
    }
  }

  return (
    <div className="space-y-8">
      <div className="card-admin p-8 text-center">
        <div className="flex items-center justify-center mb-6">
          <svg className="header-icon text-green-600 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h1 className="header-admin mb-0">Admin Dashboard</h1>
        </div>
        <p className="text-xl text-muted-foreground mb-4">
          {session?.user?.name ? `Welcome back, ${session.user.name}!` : 'Welcome!'} Manage tasks, assignments, and team coordination with style
        </p>
        <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-secondary to-secondary/80 rounded-full shadow-lg hover:shadow-lg hover:shadow-primary/25">
          <div className="w-3 h-3 bg-white rounded-full mr-3 animate-pulse"></div>
          <span className="text-base font-semibold text-white">Administrator Access</span>
        </div>
      </div>

      <Card className="shadow-lg shadow-black/8 hover:shadow-xl hover:shadow-black/12 border-2 border-secondary/20">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">⚙️ Project Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label htmlFor="project-name" className="text-lg font-bold text-gray-900 block">
                📋 Project Name
              </label>
              <Input
                id="project-name"
                type="text"
                value={projectSettings.projectName}
                onChange={(e) => updateProjectSettings({ projectName: e.target.value })}
                placeholder="e.g., Smith Family Potluck"
                maxLength={50}
                className="h-14 text-lg border-2 border-gray-300/50 focus:ring-primary/50 focus:border-primary rounded-xl bg-white/80 hover:shadow-lg hover:shadow-primary/25 transition-all duration-200"
              />
              <p className="text-sm text-gray-600 mt-1">
                {projectSettings.projectName.length}/50 characters
              </p>
            </div>

            <div className="space-y-4">
              <label htmlFor="task-label" className="text-lg font-bold text-gray-900 block">
                🏷️ Task Label
              </label>
              <Input
                id="task-label"
                type="text"
                value={projectSettings.taskLabel}
                onChange={(e) => updateProjectSettings({ taskLabel: e.target.value })}
                placeholder="e.g., Food Dishes, Volunteer Roles, Equipment"
                maxLength={30}
                className="h-14 text-lg border-2 border-gray-300/50 focus:ring-primary/50 focus:border-primary rounded-xl bg-white/80 hover:shadow-lg hover:shadow-primary/25 transition-all duration-200"
              />
              <p className="text-sm text-gray-600 mt-1">
                {projectSettings.taskLabel.length}/30 characters
              </p>
              <p className="text-sm text-muted-foreground font-medium">
                Task Label will replace 'Task Name' in your table
              </p>
            </div>
          </div>

          <div className="mt-8">
            <div className="space-y-4">
              <label htmlFor="project-description" className="text-lg font-bold text-gray-900 block">
                📝 Project Description <span className="text-sm font-normal text-muted-foreground">(Optional)</span>
              </label>
              <textarea
                id="project-description"
                value={projectSettings.projectDescription || ""}
                onChange={(e) => updateProjectSettings({ projectDescription: e.target.value || undefined })}
                placeholder="Describe your project for contributors (e.g., 'Annual company potluck - please bring dishes to share!')"
                className="w-full h-24 text-lg border-2 border-gray-300/50 focus:ring-primary/50 focus:border-primary rounded-xl bg-white/80 hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 p-4 resize-none"
                rows={3}
              />
              <p className="text-sm text-muted-foreground font-medium">
                This description will be shown to contributors under the project title
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
                  checked={projectSettings.allowMultipleClaims}
                  onChange={(e) => updateProjectSettings({ allowMultipleClaims: e.target.checked })}
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

          <div className="mt-10 pt-8 border-t-2 border-gray-300/50">
            <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-8">
              🔒 Contributor Permissions
            </h3>
            <div className="space-y-6">
              <div className="flex items-start gap-6 p-6 bg-gradient-to-br from-card to-muted rounded-xl border border-gray-300/30 hover:-translate-y-1 transition-transform duration-200">
                <input
                  type="checkbox"
                  id="allow-contributors-add-names"
                  checked={projectSettings.allowContributorsAddNames}
                  onChange={(e) => updateProjectSettings({ allowContributorsAddNames: e.target.checked })}
                  className="w-8 h-8 mt-1 scale-125 accent-primary rounded-lg border-2 border-gray-300/50 focus:ring-4 focus:ring-primary/30 transition-all duration-200"
                />
                <div className="space-y-2 flex-1">
                  <label
                    htmlFor="allow-contributors-add-names"
                    className="text-lg font-bold text-gray-900 cursor-pointer"
                  >
                    👤 Allow contributors to add their own names
                  </label>
                  <p className="text-base text-muted-foreground">
                    When enabled, contributors can add new names to the contributor list when claiming tasks. When disabled, only you can manage the contributor list.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6 p-6 bg-gradient-to-br from-card to-muted rounded-xl border border-gray-300/30 hover:-translate-y-1 transition-transform duration-200">
                <input
                  type="checkbox"
                  id="allow-contributors-add-tasks"
                  checked={projectSettings.allowContributorsAddTasks}
                  onChange={(e) => updateProjectSettings({ allowContributorsAddTasks: e.target.checked })}
                  className="w-8 h-8 mt-1 scale-125 accent-secondary rounded-lg border-2 border-gray-300/50 focus:ring-4 focus:ring-secondary/30 transition-all duration-200"
                />
                <div className="space-y-2 flex-1">
                  <label
                    htmlFor="allow-contributors-add-tasks"
                    className="text-lg font-bold text-gray-900 cursor-pointer"
                  >
                    ➕ Allow contributors to add custom tasks
                  </label>
                  <p className="text-base text-muted-foreground">
                    When enabled, contributors can add new tasks to the project. When disabled, only you can add tasks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg shadow-black/8 hover:shadow-xl hover:shadow-black/12 border-2 border-accent/20">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">👥 Contributor Names</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <p className="text-lg text-muted-foreground">
              Add contributor names that will appear in the task claiming dropdown. This makes it easy for team members to select their names when claiming tasks.
            </p>
            
            {/* Current Contributors */}
            {projectSettings.contributorNames.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">📋 Current Contributors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {projectSettings.contributorNames.map((name) => (
                    <div key={name} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                      <span className="text-gray-900 font-medium">{name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveContributor(name)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Add New Contributor */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">➕ Add New Contributor</h3>
              <form onSubmit={handleAddContributor} className="flex gap-3">
                <Input
                  type="text"
                  value={newContributorName}
                  onChange={(e) => setNewContributorName(e.target.value)}
                  placeholder="Enter contributor name..."
                  className="flex-1 h-12 text-lg border-2 border-gray-300/50 focus:ring-accent/50 focus:border-accent rounded-xl bg-white/80 hover:shadow-lg hover:shadow-primary/25 transition-all duration-200"
                  disabled={isAddingContributor}
                />
                <Button
                  type="submit"
                  disabled={!newContributorName.trim() || isAddingContributor}
                  className="bg-gradient-to-r from-accent to-accent/80 text-accent-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 px-6 h-12"
                >
                  {isAddingContributor ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Add
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg shadow-black/8 hover:shadow-xl hover:shadow-black/12 border-2 border-warning/20">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">➕ Add Tasks</CardTitle>
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
                  📝 Tasks
                </label>
                <textarea
                  id="task-input"
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  placeholder="Add one or multiple tasks (separate by new lines or commas):&#10;Apple pie&#10;Green salad, Garlic bread, Soda drinks"
                  maxLength={2000}
                  className="w-full px-6 py-4 text-lg border-2 border-gray-300/50 rounded-2xl bg-white/80 text-gray-900 placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-warning/30 focus:border-warning transition-all duration-200 resize-none shadow-lg hover:shadow-lg hover:shadow-primary/25"
                  rows={6}
                />
                <p className="text-sm text-gray-600 mt-1">
                  {taskInput.length}/2000 characters
                </p>
                <p className="text-base text-muted-foreground font-medium">
                  💡 Enter one task per line, or separate multiple tasks with commas
                </p>
              </div>

              <div className="space-y-4">
                <label htmlFor="task-description" className="text-xl font-bold text-gray-900 block">
                  📄 Task Description (optional, applies to all tasks)
                </label>
                <textarea
                  id="task-description"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Enter task description (optional)..."
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
                Add Tasks
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
                  <h3 className="text-xl font-bold text-white">📋 Task Name</h3>
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
                      <p className="text-lg font-bold text-gray-900 break-words leading-tight">{task.name}</p>
                      {task.description && <p className="text-base text-muted-foreground mt-2">{task.description}</p>}
                    </div>
                    <div className="col-span-2">
                      <p className="text-lg font-semibold text-muted-foreground">
                        {task.claimedBy ? task.claimedBy.join(", ") : "—"}
                      </p>
                    </div>
                    <div className="col-span-2 flex items-start justify-start">{getStatusBadge(task.status, task.claimedBy, task.maxContributors)}</div>
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
                        {task.status === "available" && (
                          <Button
                            onClick={() => {
                              // Set the host as the assignee and then reassign
                              setReassignSelections((prev) => ({ ...prev, [task.id]: hostName }))
                              reassignTask(task.id, hostName)
                            }}
                            className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-lg px-6 py-3 h-auto min-h-[48px]"
                          >
                            <Users className="w-5 h-5 mr-2" />
                            Claim for Host
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
                              <SelectContent className="rounded-xl border-2 border-gray-300/50 max-h-80 overflow-y-auto">
                                {availableContributors
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
                    <h3 className="text-xl font-bold text-gray-900 break-words leading-tight">{task.name}</h3>
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
                        {getStatusBadge(task.status, task.claimedBy, task.maxContributors)}
                      </div>
                    </div>
                  </div>

                  {/* Admin Actions */}
                  <div className="space-y-4 pt-4 border-t-2 border-gray-300/50">
                    {task.status === "available" && (
                      <Button
                        onClick={() => {
                          // Set the host as the assignee and then reassign
                          setReassignSelections((prev) => ({ ...prev, [task.id]: hostName }))
                          reassignTask(task.id, hostName)
                        }}
                        className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 w-full text-lg py-4 h-auto min-h-[52px]"
                      >
                        <Users className="w-6 h-6 mr-3" />
                        Claim for Host
                      </Button>
                    )}
                    
                    {task.status === "claimed" && (
                      <div className="space-y-4">

                        <div className="space-y-3">
                          <Select
                            value={reassignSelections[task.id] || ""}
                            onValueChange={(value) => setReassignSelections((prev) => ({ ...prev, [task.id]: value }))}
                          >
                            <SelectTrigger className="h-14 text-lg border-2 border-gray-300/50 focus:ring-secondary/50 rounded-xl bg-white/80 hover:shadow-lg hover:shadow-primary/25 transition-all duration-200">
                              <SelectValue placeholder="Reassign to..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-2 border-gray-300/50 max-h-80 overflow-y-auto">
                              {availableContributors
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
