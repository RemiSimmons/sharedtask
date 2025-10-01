"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

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
  allowMultipleTasks: boolean
  allowMultipleContributors: boolean
  maxContributorsPerTask?: number
  contributorNames: string[]
  allowContributorsAddNames: boolean
  allowContributorsAddTasks: boolean
}

interface DemoContextType {
  // State
  tasks: Task[]
  projectSettings: ProjectSettings
  
  // Task management functions
  addTasks: (taskNames: string[], description?: string, isHostAction?: boolean) => void
  deleteTask: (taskId: string) => void
  markTaskComplete: (taskId: string) => void
  reassignTask: (taskId: string, oldAssignee: string, newAssignee: string) => void
  
  // Task claiming functions
  claimTask: (taskId: string, claimerName: string) => void
  unclaimTask: (taskId: string, claimerName: string) => void
  
  // Comment functions
  addComment: (taskId: string, author: string, text: string) => void
  
  // Settings functions
  updateProjectSettings: (settings: Partial<ProjectSettings>) => void
  
  // Contributor management functions
  addContributorName: (name: string, isHostAction?: boolean) => void
  removeContributorName: (name: string) => void
  
  // Demo-specific functions
  getDemoState: () => any
  resetDemo: () => void
}

const DemoContext = createContext<DemoContextType | undefined>(undefined)

// Sample potluck data
const initialTasks: Task[] = [
  {
    id: "demo-1",
    name: "Caesar Salad (serves 8-10)",
    description: "Fresh romaine lettuce, parmesan cheese, croutons, and caesar dressing",
    status: "claimed",
    claimedBy: ["Sarah Johnson"],
    comments: [
      {
        id: "c1",
        text: "I'll make my famous homemade caesar dressing! 🥗",
        author: "Sarah Johnson",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      }
    ],
    maxContributors: 1
  },
  {
    id: "demo-2", 
    name: "Chocolate Chip Cookies (2 dozen)",
    description: "Classic homemade chocolate chip cookies",
    status: "available",
    claimedBy: null,
    comments: [],
    maxContributors: 1
  },
  {
    id: "demo-3",
    name: "Grilled Chicken Skewers",
    description: "Marinated chicken with vegetables on skewers",
    status: "claimed",
    claimedBy: ["Mike Chen", "Emma Davis"],
    comments: [
      {
        id: "c2",
        text: "I can handle the chicken marinating and grilling 🔥",
        author: "Mike Chen",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
      },
      {
        id: "c3", 
        text: "Perfect! I'll prep all the vegetables and skewers 🥒🫑",
        author: "Emma Davis",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
      }
    ],
    maxContributors: 2
  },
  {
    id: "demo-4",
    name: "Fruit Salad (large bowl)",
    description: "Mixed seasonal fruits with honey-lime dressing",
    status: "available",
    claimedBy: null,
    comments: [],
    maxContributors: 1
  },
  {
    id: "demo-5",
    name: "Veggie Burgers (8 patties)",
    description: "Plant-based burger patties with buns and fixings",
    status: "available",
    claimedBy: null,
    comments: [],
    maxContributors: 1
  },
  {
    id: "demo-6",
    name: "Potato Salad",
    description: "Classic creamy potato salad with herbs",
    status: "claimed",
    claimedBy: ["Jordan Lee"],
    comments: [
      {
        id: "c4",
        text: "Using my grandmother's recipe - it's always a hit! 🥔",
        author: "Jordan Lee", 
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      }
    ],
    maxContributors: 1
  },
  {
    id: "demo-7",
    name: "Beverages (variety pack)",
    description: "Sodas, water, and juice for 15+ people",
    status: "available",
    claimedBy: null,
    comments: [],
    maxContributors: 1
  },
  {
    id: "demo-8",
    name: "Apple Pie",
    description: "Homemade apple pie with vanilla ice cream",
    status: "completed",
    claimedBy: ["Taylor Brown"],
    comments: [
      {
        id: "c5",
        text: "Pie is done and cooling! Smells amazing 🥧✨",
        author: "Taylor Brown",
        timestamp: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      },
      {
        id: "c6",
        text: "Can't wait to try it! Thanks for making dessert 😋",
        author: "Sarah Johnson",
        timestamp: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
      }
    ],
    maxContributors: 1
  }
]

const initialSettings: ProjectSettings = {
  projectName: "🎉 Summer Potluck Party",
  projectDescription: "Join us for our annual summer potluck! Bring a dish to share and enjoy great food and company. We'll provide drinks and utensils.",
  taskLabel: "Dish",
  allowMultipleTasks: true,
  allowMultipleContributors: true,
  maxContributorsPerTask: 2,
  contributorNames: ["Sarah Johnson", "Mike Chen", "Emma Davis", "Jordan Lee"],
  allowContributorsAddNames: true,
  allowContributorsAddTasks: true
}

interface DemoProviderProps {
  children: ReactNode
}

export function DemoProvider({ children }: DemoProviderProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>(initialSettings)

  const addTasks = (taskNames: string[], description?: string, isHostAction?: boolean) => {
    // Check permissions: only allow if host action or contributors are allowed to add tasks
    if (!isHostAction && !projectSettings.allowContributorsAddTasks) {
      throw new Error('Contributors are not allowed to add new tasks to this project')
    }

    const newTasks: Task[] = taskNames.map((name, index) => ({
      id: `demo-new-${Date.now()}-${index}`,
      name,
      description,
      status: "available" as TaskStatus,
      claimedBy: null,
      comments: [],
      maxContributors: projectSettings.maxContributorsPerTask || 1
    }))

    setTasks(prev => [...prev, ...newTasks])
  }

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId))
  }

  const markTaskComplete = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: "completed" as TaskStatus }
        : task
    ))
  }

  const reassignTask = (taskId: string, oldAssignee: string, newAssignee: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId && task.claimedBy) {
        const newClaimedBy = task.claimedBy.map(name => 
          name === oldAssignee ? newAssignee : name
        )
        return { ...task, claimedBy: newClaimedBy }
      }
      return task
    }))
  }

  const claimTask = (taskId: string, claimerName: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        // Check if already claimed by this person
        if (task.claimedBy?.includes(claimerName)) {
          return task
        }

        // Check capacity for multiple contributors
        const currentClaims = task.claimedBy?.length || 0
        const maxContributors = task.maxContributors || projectSettings.maxContributorsPerTask || 1
        
        if (task.status === "claimed" && currentClaims >= maxContributors) {
          return task // Can't claim, at capacity
        }

        const newClaimedBy = task.claimedBy 
          ? [...task.claimedBy, claimerName]
          : [claimerName]

        return {
          ...task,
          status: "claimed" as TaskStatus,
          claimedBy: newClaimedBy
        }
      }
      return task
    }))
  }

  const unclaimTask = (taskId: string, claimerName: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId && task.claimedBy) {
        const newClaimedBy = task.claimedBy.filter(name => name !== claimerName)
        return {
          ...task,
          status: newClaimedBy.length > 0 ? "claimed" as TaskStatus : "available" as TaskStatus,
          claimedBy: newClaimedBy.length > 0 ? newClaimedBy : null
        }
      }
      return task
    }))
  }

  const addComment = (taskId: string, author: string, text: string) => {
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      text: text.trim(),
      author,
      timestamp: new Date()
    }

    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, comments: [...task.comments, newComment] }
        : task
    ))
  }

  const updateProjectSettings = (settings: Partial<ProjectSettings>) => {
    setProjectSettings(prev => ({ ...prev, ...settings }))
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

  const getDemoState = () => {
    return {
      tasks,
      projectSettings
    }
  }

  const resetDemo = () => {
    setTasks(initialTasks)
    setProjectSettings(initialSettings)
  }

  const value: DemoContextType = {
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
    
    // Demo-specific functions
    getDemoState,
    resetDemo
  }

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

// Custom hook to use the DemoContext
export function useDemo() {
  const context = useContext(DemoContext)
  if (context === undefined) {
    throw new Error("useDemo must be used within a DemoProvider")
  }
  return context
}

