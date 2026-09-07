"use client"

import React from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import TaskClaimForm from "@/components/task-claim-form"
import ContributorTaskList from "@/components/contributor-task-list"
import { TaskProvider, useTask } from "@/contexts/TaskContextWithSupabase"
import { LoadingErrorWrapper } from "@/components/loading-error-wrapper"
import { PoweredByFooter } from "@/components/powered-by-footer"
import { Button } from "@/components/ui/button"
import { RealtimeIndicator } from "@/components/realtime-indicator"
import { EventDetailsModal } from "@/components/event-details-modal"
import { Info } from "lucide-react"
import { getTaskLabels } from "@/lib/task-labels"

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.id as string

  return (
    <TaskProvider projectId={projectId}>
      <ProjectContent />
    </TaskProvider>
  )
}

function formatEventTime(eventTime?: string | null) {
  if (!eventTime?.trim()) return null
  const date = new Date(eventTime)
  if (isNaN(date.getTime())) return eventTime
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function ProjectContent() {
  const {
    tasks,
    projectSettings,
    currentProject,
    realtimeConnected,
    lastRealtimeUpdate,
    currentContributorName,
    setCurrentContributorName,
    claimTask,
    addTaskAndClaim,
  } = useTask()
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const [isEventDetailsOpen, setIsEventDetailsOpen] = React.useState(false)
  const [claimSheetOpen, setClaimSheetOpen] = React.useState(false)
  const [pendingTaskId, setPendingTaskId] = React.useState<string | null>(null)
  const [pendingCustomTask, setPendingCustomTask] = React.useState<string | null>(null)

  const isOwner = session?.user?.id && currentProject?.user_id === session.user.id
  const { plural } = getTaskLabels(projectSettings.taskLabel, projectSettings.taskLabelPlural)
  const total = tasks.length
  const claimed = tasks.filter((task) => task.status === "claimed" || task.status === "completed").length
  const eventTimeLabel = formatEventTime(projectSettings.eventTime)
  const storedName = currentContributorName.trim()

  const goToHostDashboard = () => {
    router.push(`/admin/project/${projectId}`)
  }

  const handleClaimTask = async (taskId: string) => {
    if (storedName) {
      try {
        await claimTask(taskId, storedName)
      } catch (error) {
        console.error("Failed to claim task:", error)
      }
      return
    }
    setPendingCustomTask(null)
    setPendingTaskId(taskId)
    setClaimSheetOpen(true)
  }

  const handleAddOwnTask = async (taskName: string) => {
    if (storedName) {
      try {
        await addTaskAndClaim(taskName, storedName)
      } catch (error) {
        console.error("Failed to add task:", error)
      }
      return
    }
    setPendingTaskId(null)
    setPendingCustomTask(taskName)
    setClaimSheetOpen(true)
  }

  const handleClearName = () => {
    setCurrentContributorName("")
  }

  return (
    <LoadingErrorWrapper>
      <div className="min-h-screen px-4 pt-6 pb-10">
        <div className="max-w-xl mx-auto space-y-6">
          <header className="space-y-3">
            <div className="flex justify-center">
              <a
                href="https://sharedtask.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                title="Visit SharedTask.ai homepage"
              >
                <img
                  src="/logo.png"
                  alt="SharedTask Logo"
                  className="h-14 w-auto"
                />
              </a>
            </div>

            <div className="flex items-start justify-center gap-2">
              <h1 className="text-[28px] font-bold text-gray-900 leading-tight text-center">
                {projectSettings.projectName || "SharedTask Project"}
              </h1>
              <button
                type="button"
                onClick={() => setIsEventDetailsOpen(true)}
                className="mt-1 flex-shrink-0 w-11 h-11 flex items-center justify-center text-gray-400 hover:text-gray-700"
                aria-label="Event details"
              >
                <Info className="w-5 h-5" />
              </button>
            </div>

            <p className="text-center text-sm text-gray-500">
              {eventTimeLabel ? `${eventTimeLabel} · ` : ""}
              {total} {plural} needed
            </p>

            {storedName && (
              <p className="text-center text-sm text-gray-500">
                {storedName}{" "}
                <button
                  type="button"
                  onClick={handleClearName}
                  className="text-blue-600 hover:text-blue-800 underline-offset-2 hover:underline"
                >
                  Not you?
                </button>
              </p>
            )}

            <div className="space-y-1.5">
              <div className="h-1 w-full rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${total === 0 ? 0 : Math.round((claimed / total) * 100)}%` }}
                />
              </div>
              <p className="text-center text-xs text-gray-500">
                {claimed} of {total} {plural} claimed
              </p>
            </div>

            {isOwner && (
              <div className="flex justify-center">
                <Button
                  onClick={goToHostDashboard}
                  variant="outline"
                  className="h-11 px-4 text-sm"
                >
                  Host Dashboard
                </Button>
              </div>
            )}
          </header>

          <EventDetailsModal open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen} />

          <ContributorTaskList onClaimTask={handleClaimTask} onAddOwnTask={handleAddOwnTask} />

          <TaskClaimForm
            open={claimSheetOpen}
            onOpenChange={(open) => {
              setClaimSheetOpen(open)
              if (!open) {
                setPendingTaskId(null)
                setPendingCustomTask(null)
              }
            }}
            pendingTaskId={pendingTaskId}
            pendingCustomTask={pendingCustomTask}
          />

          <div className="text-center pt-4">
            <a
              href="https://sharedtask.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Create your own list
            </a>
          </div>
        </div>
      </div>

      <PoweredByFooter show={true} />
      <RealtimeIndicator isConnected={realtimeConnected} lastUpdate={lastRealtimeUpdate} />
    </LoadingErrorWrapper>
  )
}
