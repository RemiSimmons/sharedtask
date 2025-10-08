"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"
import { supabase, supabaseAdmin, handleSupabaseError } from "@/lib/supabase"
import { useOptimizedPolling } from "@/lib/smart-polling"
import { Project, Task as DatabaseTask, TaskAssignment, TaskComment } from "@/types/database"
import { useSession } from "next-auth/react"

export type TaskStatus = "available" | "claimed" | "completed"

export interface Comment {
  id: string
  text: string
  author: string
  timestamp: Date
}

export interface Task {
  id: string
  name: string
  description?: string
  claimedBy: string[] | null
  status: TaskStatus
  comments: Comment[]
  maxContributors?: number
}

interface ProjectSettings {
  projectName: string
  projectDescription?: string
  taskLabel: string
  allowMultipleClaims: boolean
  allowMultipleContributors: boolean
  maxContributorsPerTask?: number
  contributorNames: string[]
  allowContributorsAddNames: boolean
  allowContributorsAddTasks: boolean
  eventLocation?: string | null
  eventTime?: string | null
  eventAttire?: string | null
}

interface TaskContextType {
  // State
  tasks: Task[]
  projectSettings: ProjectSettings
  loading: boolean
  error: string | null
  activeContributors: string[]
  
  // Quick claiming state
  selectedTasksForClaiming: string[]
  currentContributorName: string
  
  // Task management functions
  addTasks: (taskNames: string[], description?: string, isHostAction?: boolean) => Promise<void>
  addTaskAndClaim: (taskName: string, claimerName: string, description?: string, isHostAction?: boolean) => Promise<string>
  updateTask: (taskId: string, updates: { name?: string; description?: string }) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  markTaskComplete: (taskId: string) => Promise<void>
  reassignTask: (taskId: string, newAssignee: string) => Promise<void>
  
  // Task claiming functions
  claimTask: (taskId: string, claimerName: string) => Promise<void>
  unclaimTask: (taskId: string, claimerName: string) => Promise<void>
  
  // Comment functions
  addComment: (taskId: string, text: string, author: string) => Promise<void>
  
  // Settings functions
  updateProjectSettings: (settings: Partial<ProjectSettings>) => Promise<void>
  
  // Contributor management functions
  addContributorName: (name: string, isHostAction?: boolean) => Promise<void>
  addContributorNames: (names: string[]) => Promise<void>
  removeContributorName: (name: string) => Promise<void>
  
  // Quick claiming functions
  setCurrentContributorName: (name: string) => void
  addTaskToClaimingSelection: (taskId: string) => void
  removeTaskFromClaimingSelection: (taskId: string) => void
  clearClaimingSelection: () => void
  claimSelectedTasks: () => Promise<void>
  
  // Utility functions
  refreshTasks: () => Promise<void>
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

interface TaskProviderProps {
  children: ReactNode
  projectId?: string
}

export function TaskProvider({ children, projectId }: TaskProviderProps) {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>({
    projectName: "",
    projectDescription: undefined,
    taskLabel: "",
    allowMultipleClaims: false,
    allowMultipleContributors: false,
    maxContributorsPerTask: undefined,
    contributorNames: [],
    allowContributorsAddNames: true,
    allowContributorsAddTasks: true,
    eventLocation: null,
    eventTime: null,
    eventAttire: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  
  // Use admin client for authenticated operations, regular client for public operations
  const getSupabaseClient = () => {
    return session ? supabaseAdmin : supabase
  }
  
  // Quick claiming state
  const [selectedTasksForClaiming, setSelectedTasksForClaiming] = useState<string[]>([])
  const [currentContributorName, setCurrentContributorName] = useState<string>("")

  // Helper function to convert database task to UI task
  const convertDatabaseTaskToUITask = (
    dbTask: DatabaseTask,
    assignments: TaskAssignment[],
    comments: TaskComment[],
    project?: Project
  ): Task => {
    const taskAssignments = assignments.filter(a => a.task_id === dbTask.id)
    const taskComments = comments.filter(c => c.task_id === dbTask.id)
    const projectToUse = project || currentProject
    
    return {
      id: dbTask.id,
      name: dbTask.name,
      description: dbTask.description || undefined,
      claimedBy: taskAssignments.length > 0 ? taskAssignments.map(a => a.contributor_name) : null,
      status: (dbTask.status as TaskStatus) || "available",
      comments: taskComments.map(c => ({
        id: c.id,
        text: c.content,
        author: c.author_name,
        timestamp: c.created_at ? new Date(c.created_at) : new Date()
      })),
      maxContributors: projectToUse?.max_contributors_per_task || undefined
    }
  }

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [projectId])

  // Optimized polling for real-time updates
  const handlePolling = useCallback(async () => {
    if (!currentProject) return
    
    try {
      await Promise.all([
        refreshTasks(),
        refreshProjectSettings()
      ])
    } catch (error) {
      console.warn('Polling update failed:', error)
    }
  }, [currentProject])

  // Re-enabled with much longer intervals for real-time collaboration
  const { currentInterval, isPolling } = useOptimizedPolling(handlePolling, {
    baseInterval: 5 * 60 * 1000, // 5 minutes instead of 15 seconds
    maxInterval: 15 * 60 * 1000, // 15 minutes max
    backoffMultiplier: 1.5,
    resetOnActivity: true,
    enabled: !!currentProject
  })

  const refreshProjectSettings = async () => {
    if (!currentProject?.id) {
      console.warn('No current project ID available for refreshing settings')
      return
    }
    
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', currentProject.id)
        .maybeSingle() // Use maybeSingle() instead of single() to handle cases where no rows are found

      if (error) {
        console.error('Supabase error in fetching project settings:', error)
        // Don't throw error, just log it and continue
        return
      }

      if (project) {
        setCurrentProject(project)
        setProjectSettings({
          projectName: project.name || "My Project",
          projectDescription: project.description || undefined,
          taskLabel: project.task_label || "Task Name",
          allowMultipleClaims: project.allow_multiple_tasks || false,
          allowMultipleContributors: project.allow_multiple_contributors || false,
          maxContributorsPerTask: project.max_contributors_per_task || undefined,
          contributorNames: Array.isArray(project.contributor_names) 
          ? project.contributor_names 
          : (typeof project.contributor_names === 'string' 
              ? (function() {
                  try {
                    return JSON.parse(project.contributor_names || '[]')
                  } catch (e) {
                    console.warn('Failed to parse contributor_names JSON:', project.contributor_names)
                    return []
                  }
                })()
              : []),
          // Safe defaults for new permission fields
          allowContributorsAddNames: project.allow_contributors_add_names ?? true,
          allowContributorsAddTasks: project.allow_contributors_add_tasks ?? true,
          // Event details
          eventLocation: project.event_location || null,
          eventTime: project.event_time || null,
          eventAttire: project.event_attire || null,
        })
      }
    } catch (err) {
      console.error('Error refreshing project settings:', err)
    }
  }

  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)

      let project: Project

      if (projectId) {
        // Load specific project by ID - use admin client for authenticated users
        const client = getSupabaseClient()
        const { data: projectData, error: projectError } = await client
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .maybeSingle() // Use maybeSingle() to handle cases where project doesn't exist

        if (projectError) {
          console.error('Supabase error in loading project:', projectError)
          setError(`Failed to load project: ${projectError.message || 'Unknown error'}`)
          setLoading(false)
          return
        }

        if (!projectData) {
          setError('Project not found')
          setLoading(false)
          return
        }

        project = projectData
      } else {
        // No project ID provided - user needs to create a project through proper UI
        setError('No project specified. Please create a project first.')
        setLoading(false)
        return
      }
      
      setCurrentProject(project)

      // Update project settings with safe defaults for new fields
      setProjectSettings({
        projectName: project.name || "My Project",
        projectDescription: project.description || undefined,
        taskLabel: project.task_label || "Task Name",
        allowMultipleClaims: project.allow_multiple_tasks || false,
        allowMultipleContributors: project.allow_multiple_contributors || false,
        maxContributorsPerTask: project.max_contributors_per_task || undefined,
        contributorNames: Array.isArray(project.contributor_names) 
          ? project.contributor_names 
          : (typeof project.contributor_names === 'string' 
              ? (function() {
                  try {
                    return JSON.parse(project.contributor_names || '[]')
                  } catch (e) {
                    console.warn('Failed to parse contributor_names JSON:', project.contributor_names)
                    return []
                  }
                })()
              : []),
        // Safe defaults for new permission fields
        allowContributorsAddNames: project.allow_contributors_add_names ?? true,
        allowContributorsAddTasks: project.allow_contributors_add_tasks ?? true,
        // Event details
        eventLocation: project.event_location || null,
        eventTime: project.event_time || null,
        eventAttire: project.event_attire || null,
      })

      // Load tasks for this project
      await refreshTasks(project)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const refreshTasks = async (project?: Project) => {
    const projectToUse = project || currentProject
    if (!projectToUse) {
      return
    }

    try {
      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectToUse.id)
        .order('created_at', { ascending: true })

      if (tasksError) {
        handleSupabaseError(tasksError, 'fetching tasks')
      }

      // Fetch assignments for tasks in this project
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('task_assignments')
        .select(`
          *,
          tasks!inner(project_id)
        `)
        .eq('tasks.project_id', projectToUse.id)

      if (assignmentsError) {
        handleSupabaseError(assignmentsError, 'fetching assignments')
      }

      // Fetch comments for tasks in this project
      const { data: commentsData, error: commentsError } = await supabase
        .from('task_comments')
        .select(`
          *,
          tasks!inner(project_id)
        `)
        .eq('tasks.project_id', projectToUse.id)
        .order('created_at', { ascending: true })

      if (commentsError) {
        handleSupabaseError(commentsError, 'fetching comments')
      }

      // Convert to UI format
      const uiTasks = (tasksData || []).map(task => 
        convertDatabaseTaskToUITask(task, assignmentsData || [], commentsData || [], projectToUse)
      )

      setTasks(uiTasks)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh tasks')
    }
  }

  // Task management functions
  const addTasks = async (taskNames: string[], description?: string, isHostAction: boolean = false) => {
    if (!currentProject) throw new Error('No project loaded')

    // Check permissions: only allow if host action or contributors are allowed to add tasks
    if (!isHostAction && !projectSettings.allowContributorsAddTasks) {
      throw new Error('Contributors are not allowed to add new tasks to this project')
    }

    try {
      const tasksToInsert = taskNames.map(name => ({
        project_id: currentProject.id,
        name,
        description: description || null,
        status: 'available'
      }))

      const { error } = await supabase
        .from('tasks')
        .insert(tasksToInsert)

      if (error) {
        handleSupabaseError(error, 'adding tasks')
      }

      await refreshTasks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tasks')
      throw err
    }
  }

  const addTaskAndClaim = async (taskName: string, claimerName: string, description?: string, isHostAction: boolean = false) => {
    if (!currentProject) throw new Error('No project loaded')
    if (!taskName || !claimerName) throw new Error('Task name and claimer name are required')

    // Check permissions: only allow if host action or contributors are allowed to add tasks
    if (!isHostAction && !projectSettings.allowContributorsAddTasks) {
      throw new Error('Contributors are not allowed to add new tasks to this project')
    }

    // Check if user is adding a new name and if they're allowed to
    const isNewContributor = !projectSettings.contributorNames.includes(claimerName.trim())
    if (isNewContributor && !isHostAction && !projectSettings.allowContributorsAddNames) {
      throw new Error('You are not allowed to add new names to this project. Please select an existing name.')
    }

    try {
      // Step 1: Create the task
      const { data: newTask, error: taskError } = await supabase
        .from('tasks')
        .insert({
          project_id: currentProject.id,
          name: taskName,
          description: description || null,
          status: 'claimed' // Create it as claimed directly
        })
        .select()
        .single()

      if (taskError) {
        handleSupabaseError(taskError, 'adding task')
        throw taskError
      }

      // Step 2: Create the task assignment
      const { error: assignmentError } = await supabase
        .from('task_assignments')
        .insert({
          task_id: newTask.id,
          contributor_name: claimerName.trim()
        })

      if (assignmentError) {
        handleSupabaseError(assignmentError, 'claiming task')
        throw assignmentError
      }

      // Step 3: Add contributor name to project if it's new
      if (isNewContributor) {
        const updatedNames = [...projectSettings.contributorNames, claimerName.trim()]
        await updateProjectSettings({ contributorNames: updatedNames })
      }

      // Step 4: Refresh tasks to get the updated state
      await refreshTasks()

      return newTask.id
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add and claim task')
      throw err
    }
  }

  const updateTask = async (taskId: string, updates: { name?: string; description?: string }) => {
    try {
      const updateData: any = {}
      
      if (updates.name !== undefined) {
        updateData.name = updates.name
      }
      if (updates.description !== undefined) {
        updateData.description = updates.description ? updates.description.trim() || null : null
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)

      if (error) {
        handleSupabaseError(error, 'updating task')
      }

      await refreshTasks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
      throw err
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) {
        handleSupabaseError(error, 'deleting task')
      }

      await refreshTasks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task')
      throw err
    }
  }

  const markTaskComplete = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', taskId)

      if (error) {
        handleSupabaseError(error, 'marking task complete')
      }

      await refreshTasks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark task complete')
      throw err
    }
  }

  const reassignTask = async (taskId: string, newAssignee: string) => {
    try {
      // Remove existing assignments
      await supabase
        .from('task_assignments')
        .delete()
        .eq('task_id', taskId)

      // Add new assignment
      const { error } = await supabase
        .from('task_assignments')
        .insert({
          task_id: taskId,
          contributor_name: newAssignee
        })

      if (error) {
        handleSupabaseError(error, 'reassigning task')
      }

      // Update task status
      await supabase
        .from('tasks')
        .update({ status: 'claimed' })
        .eq('id', taskId)

      await refreshTasks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reassign task')
      throw err
    }
  }

  // Task claiming functions
  const claimTask = async (taskId: string, claimerName: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) throw new Error('Task not found')

      // Check if user already claimed this task
      if (task.claimedBy?.includes(claimerName)) {
        return // Already claimed by this user
      }

      // Check if task can accept more contributors
      if (task.status === 'claimed' && task.claimedBy) {
        if (!projectSettings.allowMultipleContributors) {
          throw new Error('Task is already claimed')
        }
        if (task.maxContributors && task.claimedBy.length >= task.maxContributors) {
          throw new Error('Task has reached maximum contributors')
        }
      }

      // Add assignment
      const { error: assignmentError } = await supabase
        .from('task_assignments')
        .insert({
          task_id: taskId,
          contributor_name: claimerName
        })

      if (assignmentError) {
        console.error('Error claiming task:', assignmentError)
        throw new Error(`Failed to claim task: ${assignmentError.message}`)
      }

      // Update task status to claimed
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ status: 'claimed' })
        .eq('id', taskId)

      if (taskError) {
        console.error('Error updating task status:', taskError)
        throw new Error(`Failed to update task status: ${taskError.message}`)
      }

      // Add contributor name to project if it's new
      const isNewContributor = !projectSettings.contributorNames.includes(claimerName.trim())
      if (isNewContributor) {
        const updatedNames = [...projectSettings.contributorNames, claimerName.trim()]
        await updateProjectSettings({ contributorNames: updatedNames })
      }

      await refreshTasks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim task')
      throw err
    }
  }

  const unclaimTask = async (taskId: string, claimerName: string) => {
    try {
      // Remove assignment
      const { error: assignmentError } = await supabase
        .from('task_assignments')
        .delete()
        .eq('task_id', taskId)
        .eq('contributor_name', claimerName)

      if (assignmentError) {
        handleSupabaseError(assignmentError, 'unclaiming task')
      }

      // Check if there are any remaining assignments
      const { data: remainingAssignments, error: checkError } = await supabase
        .from('task_assignments')
        .select('id')
        .eq('task_id', taskId)

      if (checkError) {
        handleSupabaseError(checkError, 'checking remaining assignments')
      }

      // If no assignments left, mark as available
      if (!remainingAssignments || remainingAssignments.length === 0) {
        const { error: taskError } = await supabase
          .from('tasks')
          .update({ status: 'available' })
          .eq('id', taskId)

        if (taskError) {
          handleSupabaseError(taskError, 'updating task status to available')
        }
      }

      await refreshTasks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unclaim task')
      throw err
    }
  }

  // Comment functions
  const addComment = async (taskId: string, text: string, author: string) => {
    try {
      const { error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          content: text.trim(),
          author_name: author
        })

      if (error) {
        handleSupabaseError(error, 'adding comment')
      }

      await refreshTasks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment')
      throw err
    }
  }

  // Settings functions
  const updateProjectSettings = async (settings: Partial<ProjectSettings>) => {
    if (!currentProject) throw new Error('No project loaded')

    try {
      const updateData: any = {}
      
      if (settings.projectName !== undefined) {
        updateData.name = settings.projectName
      }
      if (settings.taskLabel !== undefined) {
        updateData.task_label = settings.taskLabel
      }
      if (settings.allowMultipleClaims !== undefined) {
        updateData.allow_multiple_tasks = settings.allowMultipleClaims
      }
      if (settings.allowMultipleContributors !== undefined) {
        updateData.allow_multiple_contributors = settings.allowMultipleContributors
      }
      if (settings.maxContributorsPerTask !== undefined) {
        updateData.max_contributors_per_task = settings.maxContributorsPerTask
      }
      if (settings.contributorNames !== undefined) {
        updateData.contributor_names = JSON.stringify(settings.contributorNames)
      }
      if (settings.projectDescription !== undefined) {
        updateData.description = settings.projectDescription
      }
      if (settings.allowContributorsAddNames !== undefined) {
        updateData.allow_contributors_add_names = settings.allowContributorsAddNames
      }
      if (settings.allowContributorsAddTasks !== undefined) {
        updateData.allow_contributors_add_tasks = settings.allowContributorsAddTasks
      }
      if (settings.eventLocation !== undefined) {
        updateData.event_location = settings.eventLocation
      }
      if (settings.eventTime !== undefined) {
        updateData.event_time = settings.eventTime
      }
      if (settings.eventAttire !== undefined) {
        updateData.event_attire = settings.eventAttire
      }

      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', currentProject.id)

      if (error) {
        handleSupabaseError(error, 'updating project settings')
      }

      // Update local state
      setProjectSettings(prev => ({ ...prev, ...settings }))
      
      // Update current project reference
      setCurrentProject(prev => prev ? { ...prev, ...updateData } : prev)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project settings')
      throw err
    }
  }

  // Contributor management functions
  const addContributorName = async (name: string, isHostAction: boolean = false) => {
    if (!name.trim()) return
    
    // Check permissions: only allow if host action or contributors are allowed to add names
    if (!isHostAction && !projectSettings.allowContributorsAddNames) {
      throw new Error('Contributors are not allowed to add new names to this project')
    }
    
    const trimmedName = name.trim()
    const currentNames = projectSettings.contributorNames
    
    // Don't add if already exists
    if (currentNames.includes(trimmedName)) return
    
    const updatedNames = [...currentNames, trimmedName]
    
    try {
      await updateProjectSettings({ contributorNames: updatedNames })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add contributor name')
      throw err
    }
  }

  const addContributorNames = async (names: string[]) => {
    if (!names || names.length === 0) return
    
    const trimmedNames = names.map(name => name.trim()).filter(name => name.length > 0)
    if (trimmedNames.length === 0) return
    
    const currentNames = projectSettings.contributorNames
    console.log('addContributorNames:', { trimmedNames, currentNames })
    
    // Filter out names that already exist and add new ones
    const newNames = trimmedNames.filter(name => !currentNames.includes(name))
    if (newNames.length === 0) {
      console.log('addContributorNames: all contributors already exist, returning')
      return
    }
    
    const updatedNames = [...currentNames, ...newNames]
    console.log('addContributorNames: updating with names:', updatedNames)
    
    try {
      await updateProjectSettings({ contributorNames: updatedNames })
      console.log('addContributorNames: successfully updated project settings')
    } catch (err) {
      console.error('addContributorNames: error updating project settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to add contributor names')
      throw err
    }
  }

  const removeContributorName = async (name: string) => {
    const currentNames = projectSettings.contributorNames
    const updatedNames = currentNames.filter(n => n !== name)
    
    try {
      await updateProjectSettings({ contributorNames: updatedNames })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove contributor name')
      throw err
    }
  }

  // Quick claiming functions
  const setCurrentContributorNameHandler = (name: string) => {
    setCurrentContributorName(name)
  }

  const addTaskToClaimingSelection = (taskId: string) => {
    setSelectedTasksForClaiming(prev => {
      if (!prev.includes(taskId)) {
        return [...prev, taskId]
      }
      return prev
    })
  }

  const removeTaskFromClaimingSelection = (taskId: string) => {
    setSelectedTasksForClaiming(prev => prev.filter(id => id !== taskId))
  }

  const clearClaimingSelection = () => {
    setSelectedTasksForClaiming([])
  }

  const claimSelectedTasks = async () => {
    if (!currentContributorName.trim()) {
      throw new Error('Please enter your name first')
    }

    for (const taskId of selectedTasksForClaiming) {
      await claimTask(taskId, currentContributorName.trim())
    }
    
    clearClaimingSelection()
  }

  // Calculate active contributors
  // Use project contributor names if available, otherwise fall back to task assignments
  const activeContributors = Array.from(
    new Set([
      ...projectSettings.contributorNames, // Project-defined contributors
      ...tasks
        .filter(task => task.claimedBy)
        .flatMap(task => task.claimedBy || []) // Contributors who have claimed tasks
    ])
  ).sort()

  const value: TaskContextType = {
    // State
    tasks,
    projectSettings,
    loading,
    error,
    activeContributors,
    
    // Quick claiming state
    selectedTasksForClaiming,
    currentContributorName,
    
    // Task management functions
    addTasks,
    addTaskAndClaim,
    updateTask,
    deleteTask,
    markTaskComplete,
    reassignTask,
    
    // Task claiming functions
    claimTask,
    unclaimTask,
    
    // Comment functions
    addComment,
    
    // Settings functions
    updateProjectSettings,
    
    // Contributor management functions
    addContributorName,
    addContributorNames,
    removeContributorName,
    
    // Quick claiming functions
    setCurrentContributorName: setCurrentContributorNameHandler,
    addTaskToClaimingSelection,
    removeTaskFromClaimingSelection,
    clearClaimingSelection,
    claimSelectedTasks,
    
    // Utility functions
    refreshTasks,
  }

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}

// Custom hook to use the TaskContext
export function useTask() {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error("useTask must be used within a TaskProvider")
  }
  return context
}
