"use client"

import React, { useState, createContext, useContext } from "react"
import { useRouter } from "next/navigation"
import TaskTable from "@/components/task-table"
import TaskClaimForm from "@/components/task-claim-form"

// Demo Context to simulate TaskContext
interface DemoTask {
  id: string
  name: string
  description?: string
  status: "available" | "claimed" | "completed"
  claimedBy?: string[]
  comments?: Array<{ id: string; text: string; author: string; timestamp: Date }>
  maxContributors?: number
}

interface DemoProjectSettings {
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

interface DemoContextType {
  tasks: DemoTask[]
  projectSettings: DemoProjectSettings
  activeContributors: string[]
  selectedTasksForClaiming: string[]
  currentContributorName: string
  setCurrentContributorName: (name: string) => void
  clearClaimingSelection: () => void
  claimSelectedTasks: () => Promise<void>
  claimTask: (taskId: string, contributorName: string) => void
  addTasks: (taskNames: string[]) => Promise<void>
  updateProjectSettings: (updates: Partial<DemoProjectSettings>) => void
  addComment: (taskId: string, comment: string, author: string) => void
  markTaskComplete: (taskId: string) => void
  deleteTask: (taskId: string) => void
  reassignTask: (taskId: string, newContributor: string) => void
  addContributorNames: (names: string[]) => void
  addContributorName: (name: string) => void
  removeContributorName: (name: string) => void
}

const DemoContext = createContext<DemoContextType | null>(null)

function DemoProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<DemoTask[]>([
    { id: "1", name: "Appetizers", status: "available" },
    { id: "2", name: "Main Course", status: "claimed", claimedBy: ["Sarah"], comments: [{ id: "1", text: "I'll bring lasagna!", author: "Sarah", timestamp: new Date() }] },
    { id: "3", name: "Dessert", status: "available" },
    { id: "4", name: "Drinks", status: "claimed", claimedBy: ["Mike"] },
    { id: "5", name: "Plates & Utensils", status: "available" }
  ])

  const [projectSettings, setProjectSettings] = useState<DemoProjectSettings>({
    projectName: "",
    taskLabel: "",
    allowMultipleClaims: true,
    allowMultipleContributors: false,
    contributorNames: ["Sarah", "Mike"],
    allowContributorsAddNames: true,
    allowContributorsAddTasks: true
  })

  const [activeContributors, setActiveContributors] = useState<string[]>(["Sarah", "Mike"])
  const [selectedTasksForClaiming, setSelectedTasksForClaiming] = useState<string[]>([])
  const [currentContributorName, setCurrentContributorName] = useState<string>("")

  const clearClaimingSelection = () => setSelectedTasksForClaiming([])

  const claimSelectedTasks = async () => {
    // Implementation for claiming multiple tasks
  }

  const claimTask = (taskId: string, contributorName: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: "claimed" as const, claimedBy: [contributorName] }
        : task
    ))
    if (!activeContributors.includes(contributorName)) {
      setActiveContributors(prev => [...prev, contributorName])
    }
  }

  const addTasks = async (taskNames: string[]) => {
    const newTasks = taskNames.map((name, index) => ({
      id: `${Date.now()}-${index}`,
      name,
      status: "available" as const
    }))
    setTasks(prev => [...prev, ...newTasks])
  }

  const updateProjectSettings = (updates: Partial<DemoProjectSettings>) => {
    setProjectSettings(prev => ({ ...prev, ...updates }))
  }

  const addComment = (taskId: string, comment: string, author: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            comments: [
              ...(task.comments || []), 
              { id: Date.now().toString(), text: comment, author, timestamp: new Date() }
            ]
          }
        : task
    ))
  }

  const markTaskComplete = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: "completed" as const } : task
    ))
  }

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId))
  }

  const reassignTask = (taskId: string, newContributor: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, claimedBy: [newContributor] } : task
    ))
  }

  const addContributorNames = (names: string[]) => {
    setActiveContributors(prev => [...new Set([...prev, ...names])])
  }

  const addContributorName = (name: string) => {
    if (!activeContributors.includes(name)) {
      setActiveContributors(prev => [...prev, name])
    }
  }

  const removeContributorName = (name: string) => {
    setActiveContributors(prev => prev.filter(n => n !== name))
  }

  const value: DemoContextType = {
    tasks,
    projectSettings,
    activeContributors,
    selectedTasksForClaiming,
    currentContributorName,
    setCurrentContributorName,
    clearClaimingSelection,
    claimSelectedTasks,
    claimTask,
    addTasks,
    updateProjectSettings,
    addComment,
    markTaskComplete,
    deleteTask,
    reassignTask,
    addContributorNames,
    addContributorName,
    removeContributorName
  }

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  )
}

// Hook to use demo context (mimics useTask)
function useTask() {
  const context = useContext(DemoContext)
  if (!context) {
    throw new Error('useTask must be used within DemoProvider')
  }
  return context
}

export default function DemoPage() {
  return (
    <DemoProvider>
      <DemoContent />
    </DemoProvider>
  )
}

function DemoContent() {
  const [currentStep, setCurrentStep] = useState<'create' | 'experience'>('create')
  const router = useRouter()
  const { updateProjectSettings } = useTask() // Move useTask to component level

  const handleCreateProject = (projectName: string, taskLabel: string, settings: any) => {
    // Update demo context with user input
    updateProjectSettings({
      projectName,
      taskLabel,
      allowMultipleClaims: settings.allowMultipleTasks,
      allowMultipleContributors: settings.allowMultipleContributors,
      maxContributorsPerTask: settings.maxContributors ? parseInt(settings.maxContributors) : undefined,
      allowContributorsAddNames: settings.allowContributorsAddNames,
      allowContributorsAddTasks: settings.allowContributorsAddTasks
    })
    setCurrentStep('experience')
  }

  const handleStartOver = () => {
    setCurrentStep('create')
  }

  if (currentStep === 'create') {
    return <CreateProjectStep 
      onCreateProject={handleCreateProject}
      onCancel={() => router.push('/')}
    />
  }

  return (
    <DemoExperienceStep 
      onStartOver={handleStartOver}
      onBackToHome={() => router.push('/')}
    />
  )
}

// Create Project Step Component (Step 1)
function CreateProjectStep({
  onCreateProject,
  onCancel
}: {
  onCreateProject: (projectName: string, taskLabel: string, settings: any) => void,
  onCancel: () => void
}) {
  const [projectName, setProjectName] = useState("")
  const [taskLabel, setTaskLabel] = useState("")
  const [allowMultipleTasks, setAllowMultipleTasks] = useState(true)
  const [allowMultipleContributors, setAllowMultipleContributors] = useState(false)
  const [maxContributors, setMaxContributors] = useState("")
  const [allowContributorsAddNames, setAllowContributorsAddNames] = useState(true)
  const [allowContributorsAddTasks, setAllowContributorsAddTasks] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!projectName.trim() || !taskLabel.trim()) {
      alert("Please fill in both Project Name and Task Label")
      return
    }
    
    setIsCreating(true)
    
    // Simulate project creation delay
    setTimeout(() => {
      setIsCreating(false)
      onCreateProject(projectName, taskLabel, {
        allowMultipleTasks,
        allowMultipleContributors,
        maxContributors,
        allowContributorsAddNames,
        allowContributorsAddTasks
      })
    }, 1500)
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Demo Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
            <h1 className="text-3xl font-bold text-blue-900">Create Project Card</h1>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
          </div>
          <p className="text-lg text-gray-700 max-w-xl mx-auto">
            Experience the exact same setup process as creating a real project. 
            Enter your project details to see how the demo adapts to your settings!
          </p>
        </div>

        {/* Create Project Form */}
        <div className="card-form p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Project Name */}
            <div>
              <label htmlFor="demo-project-name" className="block text-lg font-semibold text-gray-900 mb-3">
                📋 Project Name
              </label>
              <input
                id="demo-project-name"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="form-input text-lg"
                placeholder="Summer Potluck Party"
                required
              />
              <p className="text-sm text-gray-600 mt-2">This will be displayed at the top of your project</p>
            </div>

            {/* Task Label */}
            <div>
              <label htmlFor="demo-task-label" className="block text-lg font-semibold text-gray-900 mb-3">
                🏷️ Task Label
              </label>
              <input
                id="demo-task-label"
                type="text"
                value={taskLabel}
                onChange={(e) => setTaskLabel(e.target.value)}
                className="form-input"
                placeholder="Dish"
                required
              />
              <p className="text-sm text-gray-600 mt-1">This label will replace "Task Name" in your table headers</p>
            </div>

            {/* Assignment Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">⚙️ Assignment Settings</h3>
              
              {/* Multiple Tasks */}
              <div className="flex items-start space-x-3">
                <input
                  id="demo-multiple-tasks"
                  type="checkbox"
                  checked={allowMultipleTasks}
                  onChange={(e) => setAllowMultipleTasks(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <label htmlFor="demo-multiple-tasks" className="text-base font-medium text-gray-900">
                    👥 Let people claim multiple tasks
                  </label>
                  <p className="text-sm text-gray-600">One person can take several different tasks</p>
                </div>
              </div>

              {/* Team Tasks */}
              <div className="flex items-start space-x-3">
                <input
                  id="demo-team-tasks"
                  type="checkbox"
                  checked={allowMultipleContributors}
                  onChange={(e) => setAllowMultipleContributors(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <label htmlFor="demo-team-tasks" className="text-base font-medium text-gray-900">
                    🤝 Allow team tasks (multiple people per task)
                  </label>
                  <p className="text-sm text-gray-600">Multiple people can work together on one task</p>
                </div>
              </div>

              {/* Max Contributors */}
              {allowMultipleContributors && (
                <div className="ml-7">
                  <label htmlFor="demo-max-contributors" className="block text-base font-medium text-gray-900 mb-2">
                    Maximum contributors per task
                  </label>
                  <input
                    id="demo-max-contributors"
                    type="number"
                    min="2"
                    max="10"
                    value={maxContributors}
                    onChange={(e) => setMaxContributors(e.target.value)}
                    className="form-input max-w-xs"
                    placeholder="e.g., 3"
                  />
                </div>
              )}

              {/* Allow Contributors to Add Names */}
              <div className="flex items-start space-x-3">
                <input
                  id="demo-allow-contributor-names"
                  type="checkbox"
                  checked={allowContributorsAddNames}
                  onChange={(e) => setAllowContributorsAddNames(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <label htmlFor="demo-allow-contributor-names" className="text-base font-medium text-gray-900">
                    ✏️ Allow people to add their names when claiming tasks
                  </label>
                  <p className="text-sm text-gray-600">Contributors can enter their names when claiming tasks</p>
                </div>
              </div>

              {/* Allow Contributors to Add Tasks */}
              <div className="flex items-start space-x-3">
                <input
                  id="demo-allow-contributor-tasks"
                  type="checkbox"
                  checked={allowContributorsAddTasks}
                  onChange={(e) => setAllowContributorsAddTasks(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <label htmlFor="demo-allow-contributor-tasks" className="text-base font-medium text-gray-900">
                    ➕ Allow people to add new tasks
                  </label>
                  <p className="text-sm text-gray-600">Contributors can create additional tasks for the project</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isCreating}
              className={`w-full btn-primary text-lg py-4 ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isCreating ? "Creating Project..." : "Create Project"}
            </button>
          </form>

          {/* Cancel */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200">
            <p className="text-gray-600 mb-4">Want to go back?</p>
            <button
              onClick={onCancel}
              className="btn-outline"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Demo Experience Step Component using real app components
function DemoExperienceStep({
  onStartOver,
  onBackToHome
}: {
  onStartOver: () => void,
  onBackToHome: () => void
}) {
  const { projectSettings, updateProjectSettings } = useTask()
  const [showPublicPreview, setShowPublicPreview] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
              <h1 className="text-2xl font-bold text-blue-900">Demo: {projectSettings.projectName}</h1>
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onStartOver}
                className="btn-outline text-sm py-2 px-4"
              >
                🔄 Start Over
              </button>
              <button
                onClick={onBackToHome}
                className="btn-outline text-sm py-2 px-4"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-12">

          {/* Admin Dashboard Header */}
          <div className="text-center py-6">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg shadow-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 002-2V3a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 002 2h2a2 2 0 012 2v2a2 2 0 00-2 2h-2a2 2 0 00-2 2v6a2 2 0 01-2 2H11a2 2 0 01-2-2z" />
              </svg>
              <h2 className="text-xl font-bold">Admin Dashboard</h2>
            </div>
            <p className="text-gray-600 mt-3">The following cards are found on the admin dashboard</p>
          </div>

          {/* Step 2: Project Overview Card (from real admin dashboard) */}
          <ProjectSummary />

          {/* Step 3: Project Setup Card (from real admin dashboard) */}
          <ProjectSettingsCard />

          {/* Step 4: Task Management Card (from real admin dashboard) */}
          <div className="card-beautiful p-8">
            <div className="flex items-center gap-3 mb-6">
              <svg className="section-icon text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h2 className="header-section mb-0">Tasks</h2>
            </div>
            <DemoTaskTable />
          </div>

          {/* Step 5: Preview Public View Button & Divider */}
          <div className="text-center py-8">
            <button
              onClick={() => setShowPublicPreview(!showPublicPreview)}
              className="btn-secondary text-lg py-3 px-8 mb-6"
            >
              👁️ {showPublicPreview ? "Hide" : "Preview"} Public View
            </button>
            
            {showPublicPreview && (
              <div className="border-t-4 border-blue-300 pt-8">
                <h2 className="text-2xl font-bold text-blue-900 mb-2">👥 Contributor Experience</h2>
                <p className="text-gray-600">This is what your team members will see when they visit your project</p>
              </div>
            )}
          </div>

          {/* Step 6: Task Claim Form (from real public page) */}
          {showPublicPreview && (
            <div className="max-w-2xl mx-auto">
              <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-6">
                <DemoTaskClaimForm />
              </div>
            </div>
          )}

          {/* Step 7: Active Tasks List (from real public page) */}
          {showPublicPreview && (
            <div className="border-2 border-green-200 bg-green-50 rounded-lg p-6">
              <div className="flex items-center justify-center mb-8">
                <svg className="section-icon text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h2 className="header-section text-center mb-0">Active {projectSettings.taskLabel}s</h2>
              </div>
              <DemoTaskTable />
            </div>
          )}

          {/* Demo Actions */}
          <div className="text-center py-8 border-t border-gray-200">
            <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => window.location.href = '/auth/signup'}
                className="btn-primary px-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                💾 Convert to Real Project
              </button>
              <button
                onClick={onStartOver}
                className="btn-outline px-6 py-3 text-base"
              >
                🔄 Start Over
                 </button>
                 <button
                onClick={onBackToHome}
                className="btn-outline px-6 py-3 text-base"
              >
                ← Back to Home
              </button>
            </div>
          </div>


          {/* Demo Features Note */}
          <div className="text-center py-6 border-t border-gray-200 mt-8">
            <p className="text-base text-gray-600 max-w-2xl mx-auto font-medium">
              Get the full app for bulk listing, multi-select, task descriptions, contributor management, and more
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Project Summary Component (from real admin dashboard)
function ProjectSummary() {
  const { projectSettings } = useTask()

  const getStatusIcon = (allowed: boolean) => {
    return allowed ? "✅" : "❌"
  }

  const getStatusText = (allowed: boolean) => {
    return allowed ? "Allowed" : "Not allowed"
  }

  return (
    <div className="card-beautiful p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 Project Overview</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Details</h3>
          <p className="text-gray-700"><strong>Name:</strong> {projectSettings.projectName}</p>
          <p className="text-gray-700"><strong>Task Label:</strong> {projectSettings.taskLabel}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Contributor Settings</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>{getStatusIcon(projectSettings.allowMultipleClaims)} Multiple tasks per person: {getStatusText(projectSettings.allowMultipleClaims)}</li>
            <li>{getStatusIcon(projectSettings.allowMultipleContributors)} Team tasks: {projectSettings.allowMultipleContributors ? `Allowed (max ${projectSettings.maxContributorsPerTask || "unlimited"})` : "Not allowed"}</li>
            <li>{getStatusIcon(projectSettings.allowContributorsAddNames)} Contributors add names: {getStatusText(projectSettings.allowContributorsAddNames)}</li>
            <li>{getStatusIcon(projectSettings.allowContributorsAddTasks)} Contributors add tasks: {getStatusText(projectSettings.allowContributorsAddTasks)}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// Project Settings Card Component (from real admin dashboard)
function ProjectSettingsCard() {
  const { projectSettings, updateProjectSettings, addTasks, addContributorNames } = useTask()
  const [bulkTasks, setBulkTasks] = useState("")
  const [bulkContributors, setBulkContributors] = useState("")
  const [bulkDescription, setBulkDescription] = useState("")

  const handleAddTasks = async () => {
    if (bulkTasks.trim()) {
      // Split by both newlines and commas, then filter out empty entries
      const taskList = bulkTasks
        .split(/[\n,]/)
        .map(task => task.trim())
        .filter(task => task.length > 0)
      await addTasks(taskList)
      setBulkTasks("")
    }
  }

  const handleAddContributors = () => {
    if (bulkContributors.trim()) {
      // Split by both newlines and commas, then filter out empty entries
      const contributorList = bulkContributors
        .split(/[\n,]/)
        .map(name => name.trim())
        .filter(name => name.length > 0)
      addContributorNames(contributorList)
      setBulkContributors("")
    }
  }

  return (
    <div className="card-form p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">⚙️ Project Setup</h2>
      <p className="text-gray-600 mb-6">Add tasks and contributors, then adjust settings to see live changes throughout the demo!</p>
      
      <div className="space-y-8">
        {/* Bulk Add Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Add Tasks */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">📝 Add {projectSettings.taskLabel}s</h3>
            <textarea
              value={bulkTasks}
              onChange={(e) => setBulkTasks(e.target.value)}
              placeholder={`Enter ${projectSettings.taskLabel?.toLowerCase() || 'task'} names (comma or line separated):\n\nAppetizers, Main Course, Dessert, Drinks`}
              className="form-textarea h-32"
            />
            <button
              onClick={handleAddTasks}
              disabled={!bulkTasks.trim()}
              className="btn-primary w-full"
            >
              Add {projectSettings.taskLabel}s
            </button>
          </div>

          {/* Add Contributors */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">👥 Add Contributors (Optional)</h3>
            <textarea
              value={bulkContributors}
              onChange={(e) => setBulkContributors(e.target.value)}
              placeholder="Enter contributor names (comma or line separated):\n\nSarah, Mike, Jessica, David"
              className="form-textarea h-32"
            />
            <button
              onClick={handleAddContributors}
              disabled={!bulkContributors.trim()}
              className="btn-secondary w-full"
            >
              Add Contributors
                </button>
          </div>
        </div>

        {/* Optional Description */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">📄 Project Description (Optional)</h3>
          <textarea
            value={bulkDescription}
            onChange={(e) => setBulkDescription(e.target.value)}
            placeholder="Add a description for your project (optional)..."
            className="form-textarea h-24"
          />
        </div>

        {/* Assignment Settings */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Assignment Settings</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={projectSettings.allowMultipleClaims}
                  onChange={(e) => updateProjectSettings({ allowMultipleClaims: e.target.checked })}
                  className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <label className="text-base font-medium text-gray-900">
                    👥 Let people claim multiple tasks
                  </label>
                  <p className="text-sm text-gray-600">One person can take several different tasks</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={projectSettings.allowMultipleContributors}
                  onChange={(e) => updateProjectSettings({ allowMultipleContributors: e.target.checked })}
                  className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <label className="text-base font-medium text-gray-900">
                    🤝 Allow team tasks
                  </label>
                  <p className="text-sm text-gray-600">Multiple people can work together on one task</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={projectSettings.allowContributorsAddNames}
                  onChange={(e) => updateProjectSettings({ allowContributorsAddNames: e.target.checked })}
                  className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <label className="text-base font-medium text-gray-900">
                    ✏️ Allow people to add names
                  </label>
                  <p className="text-sm text-gray-600">Contributors can enter their names when claiming tasks</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={projectSettings.allowContributorsAddTasks}
                  onChange={(e) => updateProjectSettings({ allowContributorsAddTasks: e.target.checked })}
                  className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <label className="text-base font-medium text-gray-900">
                    ➕ Allow people to add tasks
                  </label>
                  <p className="text-sm text-gray-600">Contributors can create additional tasks for the project</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Demo Task Table Component
function DemoTaskTable() {
  const { tasks, projectSettings, markTaskComplete, deleteTask, reassignTask, activeContributors } = useTask()

  const getStatusBadge = (status: "available" | "claimed" | "completed") => {
    switch (status) {
      case "available":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Available</span>
      case "claimed":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Claimed</span>
      case "completed":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Completed</span>
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {projectSettings.taskLabel || "Task"}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Assigned To
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tasks.map((task) => (
            <tr key={task.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {task.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(task.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {task.claimedBy?.join(", ") || "—"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  {task.status === "claimed" && (
                    <button
                      onClick={() => markTaskComplete(task.id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Complete
                    </button>
                  )}
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {tasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No tasks yet. Add some tasks to get started!
        </div>
      )}
    </div>
  )
}

// Demo Task Claim Form Component
function DemoTaskClaimForm() {
  const { 
    tasks, 
    projectSettings, 
    claimTask, 
    addTasks, 
    activeContributors
  } = useTask()
  
  const [selectedName, setSelectedName] = useState<string>("")
  const [selectedTask, setSelectedTask] = useState<string>("")
  const [customName, setCustomName] = useState<string>("")
  const [customTask, setCustomTask] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const availableTasks = tasks.filter(task => task.status === "available")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const finalName = selectedName === "new" ? customName : selectedName
    const finalTask = selectedTask === "custom" ? customTask : selectedTask

    if (!finalName || !finalTask) {
      return
    }

    setIsSubmitting(true)

    try {
      if (selectedTask === "custom") {
        await addTasks([customTask])
        // Find the newly added task and claim it
        setTimeout(() => {
          const newTask = tasks.find(task => task.name === customTask && task.status === "available")
          if (newTask) {
            claimTask(newTask.id, finalName)
          }
        }, 100)
      } else {
        claimTask(selectedTask, finalName)
      }

      // Reset form
      setSelectedName("")
      setSelectedTask("")
      setCustomName("")
      setCustomTask("")
    } catch (error) {
      console.error('Failed to claim task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card-form p-8">
        <div className="flex items-center justify-center mb-8">
          <svg className="section-icon text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h2 className="header-section text-center mb-0">Claim a {projectSettings.taskLabel}</h2>
          </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label className="text-lg font-semibold text-gray-900 block">
              Select Your Name
            </label>
            <select 
              value={selectedName} 
              onChange={(e) => setSelectedName(e.target.value)}
              className="form-input"
            >
              <option value="">Choose your name...</option>
              {activeContributors.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
              {projectSettings.allowContributorsAddNames && (
                <option value="new">Add New Name</option>
              )}
            </select>

            {selectedName === "new" && (
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Enter your name..."
                className="form-input"
              />
            )}
          </div>

          <div className="space-y-3">
            <label className="text-lg font-semibold text-gray-900 block">
              Choose Available {projectSettings.taskLabel}
            </label>
            <select 
              value={selectedTask} 
              onChange={(e) => setSelectedTask(e.target.value)}
              className="form-input"
            >
              <option value="">Select a task...</option>
              {availableTasks.map((task) => (
                <option key={task.id} value={task.id}>{task.name}</option>
              ))}
              {projectSettings.allowContributorsAddTasks && (
                <option value="custom">Add Custom Task</option>
              )}
            </select>

            {selectedTask === "custom" && (
              <input
                type="text"
                value={customTask}
                onChange={(e) => setCustomTask(e.target.value)}
                placeholder="Enter task description..."
                className="form-input"
              />
            )}
        </div>

          <button
            type="submit"
            disabled={isSubmitting || !selectedName || !selectedTask}
            className="w-full btn-primary text-base py-3"
          >
            {isSubmitting ? "Claiming..." : "Claim Task"}
          </button>
        </form>
      </div>
    </div>
  )
}

function ConversionModal({ 
  onClose, 
  projectSettings
}: { 
  onClose: () => void,
  projectSettings: DemoProjectSettings
}) {
  const [projectName, setProjectName] = useState(projectSettings.projectName)
  const [adminPassword, setAdminPassword] = useState("")
  const [isConverting, setIsConverting] = useState(false)
  const router = useRouter()
  const { tasks } = useTask()

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!adminPassword.trim()) {
      alert("Please set an admin password")
      return
    }

    setIsConverting(true)

    try {
      // Convert demo to real project with all settings
      const response = await fetch('/api/demo/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName,
          taskLabel: projectSettings.taskLabel,
          adminPassword,
          allowMultipleTasks: projectSettings.allowMultipleClaims,
          allowMultipleContributors: projectSettings.allowMultipleContributors,
          maxContributorsPerTask: projectSettings.maxContributorsPerTask,
          allowContributorsAddNames: projectSettings.allowContributorsAddNames,
          allowContributorsAddTasks: projectSettings.allowContributorsAddTasks,
          demoData: { tasks, projectSettings }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to convert demo to project')
      }

      const result = await response.json()
      
      // Redirect to admin dashboard for the new project
      router.push(`/admin/project/${result.project.id}`)
      
    } catch (error) {
      console.error('Conversion error:', error)
      alert('Failed to convert demo. Please try again.')
    } finally {
      setIsConverting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="card-beautiful p-8 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Convert to Real Project</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          </div>
          <p className="text-gray-600 text-center">
            We'll create a real project with your demo settings and data:
          </p>
          <ul className="text-sm text-gray-600 mt-3 space-y-1">
            <li>• All current tasks and assignments</li>
            <li>• Your custom settings ({projectSettings.taskLabel} labels, permissions)</li>
            <li>• Comments and progress</li>
            <li>• Shareable contributor link</li>
          </ul>
        </div>

        <form onSubmit={handleConvert} className="space-y-4">
          <div>
            <label htmlFor="project-name" className="block text-sm font-semibold text-gray-900 mb-2">
              Project Name
            </label>
            <input
              id="project-name"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="form-input text-base"
              required
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-sm font-semibold text-gray-900 mb-2">
              Admin Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="form-input text-base"
              placeholder="Set a secure password"
              required
            />
            <p className="text-xs text-gray-500 mt-1">You'll need this to access admin features</p>
          </div>

          <div className="space-y-3">
            <div className="flex gap-3">
            <button
              type="submit"
              disabled={isConverting}
              className={`flex-1 btn-primary text-base py-3 ${isConverting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {isConverting ? "Converting..." : "Create Real Project"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-outline text-base py-3"
            >
              Cancel
            </button>
            </div>
            
            <div className="text-center pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Need more than 3 projects?</p>
              <button
                type="button"
                onClick={() => window.open('/pricing', '_blank')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                💎 View Pricing Plans
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
