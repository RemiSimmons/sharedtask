"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"

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
}

interface TaskContextType {
  // State
  tasks: Task[]
  projectSettings: ProjectSettings
  
  // Task management functions
  addTasks: (taskNames: string[], description?: string, isHostAction?: boolean) => void
  deleteTask: (taskId: string) => void
  markTaskComplete: (taskId: string) => void
  reassignTask: (taskId: string, newAssignee: string) => void
  
  // Task claiming functions
  claimTask: (taskId: string, claimerName: string) => void
  unclaimTask: (taskId: string, claimerName: string) => void
  
  // Comment functions
  addComment: (taskId: string, text: string, author: string) => void
  
  // Settings functions
  updateProjectSettings: (settings: Partial<ProjectSettings>) => void
  
  // Contributor management functions
  addContributorName: (name: string, isHostAction?: boolean) => void
  removeContributorName: (name: string) => void
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

// Initial tasks data
const initialTasks: Task[] = [
  {
    id: "1",
    name: "Review quarterly reports",
    description: "Review Q4 financial reports and prepare summary",
    claimedBy: null,
    status: "available",
    comments: [],
  },
  {
    id: "2",
    name: "Update customer database",
    description: "Clean and update customer contact information",
    claimedBy: ["Sarah Johnson"],
    status: "claimed",
    comments: [
      {
        id: "c1",
        text: "Started working on this, will update by EOD",
        author: "Sarah Johnson",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ],
  },
  {
    id: "3",
    name: "Prepare presentation slides",
    description: "Create slides for next week's client meeting",
    claimedBy: ["Mike Chen"],
    status: "completed",
    comments: [
      {
        id: "c2",
        text: "Slides are ready for review",
        author: "Mike Chen",
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
    ],
  },
  {
    id: "4",
    name: "Schedule team meeting",
    description: "Coordinate schedules and book conference room",
    claimedBy: null,
    status: "available",
    comments: [],
  },
  {
    id: "5",
    name: "Process invoices",
    description: "Review and approve pending invoices",
    claimedBy: ["Emma Davis"],
    status: "claimed",
    comments: [],
  },
  {
    id: "6",
    name: "Write project documentation",
    description: "Create comprehensive project documentation",
    claimedBy: null,
    status: "available",
    comments: [],
    maxContributors: 3,
  },
]

const initialProjectSettings: ProjectSettings = {
  projectName: "",
  projectDescription: undefined,
  taskLabel: "",
  allowMultipleClaims: false,
  allowMultipleContributors: false,
  maxContributorsPerTask: undefined,
  contributorNames: [],
  allowContributorsAddNames: true,
  allowContributorsAddTasks: true,
}

interface TaskProviderProps {
  children: ReactNode
}

export function TaskProvider({ children }: TaskProviderProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>(initialProjectSettings)

  // DISABLED: Aggressive polling was causing performance issues
  // Real-time updates should be handled by user actions, not random intervals
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     // Random task updates disabled for performance
  //   }, 5000)
  //   return () => clearInterval(interval)
  // }, [])

  // Task management functions
  const addTasks = (taskNames: string[], description?: string, isHostAction?: boolean) => {
    // Check permissions: only allow if host action or contributors are allowed to add tasks
    if (!isHostAction && !projectSettings.allowContributorsAddTasks) {
      throw new Error('Contributors are not allowed to add new tasks to this project')
    }

    const newTasks: Task[] = taskNames.map((taskName, index) => ({
      id: `task-${Date.now()}-${index}`,
      name: taskName,
      description: description?.trim() || undefined,
      claimedBy: null,
      status: "available" as TaskStatus,
      comments: [],
    }))

    setTasks((prev) => [...prev, ...newTasks])
  }

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
  }

  const markTaskComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: "completed" as TaskStatus } : task
      )
    )
  }

  const reassignTask = (taskId: string, newAssignee: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { 
          ...task, 
          status: "claimed" as TaskStatus, 
          claimedBy: [newAssignee] 
        } : task
      )
    )
  }

  // Task claiming functions
  const claimTask = (taskId: string, claimerName: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task

        // Handle different claiming scenarios
        if (task.status === "available") {
          return { ...task, status: "claimed" as TaskStatus, claimedBy: [claimerName] }
        } else if (
          task.status === "claimed" &&
          projectSettings.allowMultipleContributors &&
          task.maxContributors &&
          task.claimedBy &&
          task.claimedBy.length < task.maxContributors &&
          !task.claimedBy.includes(claimerName)
        ) {
          return { ...task, claimedBy: [...task.claimedBy, claimerName] }
        }

        return task
      })
    )
  }

  const unclaimTask = (taskId: string, claimerName: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId || !task.claimedBy) return task

        const updatedClaimedBy = task.claimedBy.filter(name => name !== claimerName)
        
        if (updatedClaimedBy.length === 0) {
          return { ...task, status: "available" as TaskStatus, claimedBy: null }
        } else {
          return { ...task, claimedBy: updatedClaimedBy }
        }
      })
    )
  }

  // Comment functions
  const addComment = (taskId: string, text: string, author: string) => {
    const newComment: Comment = {
      id: `c${Date.now()}`,
      text: text.trim(),
      author,
      timestamp: new Date(),
    }

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, comments: [...task.comments, newComment] } : task
      )
    )
  }

  // Settings functions
  const updateProjectSettings = (settings: Partial<ProjectSettings>) => {
    setProjectSettings((prev) => ({ ...prev, ...settings }))
  }

  // Contributor management functions
  const addContributorName = (name: string, isHostAction?: boolean) => {
    if (!name.trim()) return
    
    // Check permissions: only allow if host action or contributors are allowed to add names
    if (!isHostAction && !projectSettings.allowContributorsAddNames) {
      throw new Error('Contributors are not allowed to add new names to this project')
    }
    
    const trimmedName = name.trim()
    const currentNames = projectSettings.contributorNames || []
    
    // Don't add if already exists
    if (currentNames.includes(trimmedName)) return
    
    const updatedNames = [...currentNames, trimmedName]
    updateProjectSettings({ contributorNames: updatedNames })
  }

  const removeContributorName = (name: string) => {
    const currentNames = projectSettings.contributorNames || []
    const updatedNames = currentNames.filter(n => n !== name)
    updateProjectSettings({ contributorNames: updatedNames })
  }

  const value: TaskContextType = {
    // State
    tasks,
    projectSettings,
    
    // Task management functions
    addTasks,
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
    removeContributorName,
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

