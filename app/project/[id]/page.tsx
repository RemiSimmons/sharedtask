"use client"

import React from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import ContributorTaskList from "@/components/contributor-task-list"
import { TaskProvider, useTask } from "@/contexts/TaskContextWithSupabase"
import { LoadingErrorWrapper } from "@/components/loading-error-wrapper"
import { PoweredByFooter } from "@/components/powered-by-footer"
import { Button } from "@/components/ui/button"
import { RealtimeIndicator } from "@/components/realtime-indicator"
import { EventDetailsModal } from "@/components/event-details-modal"
import { getInitials } from "@/lib/task-labels"

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
    claimTask,
    addTaskAndClaim,
  } = useTask()
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const [isEventDetailsOpen, setIsEventDetailsOpen] = React.useState(false)

  const isOwner = Boolean(session?.user?.id && currentProject?.user_id === session.user.id)
  const total = tasks.length
  const claimed = tasks.filter((task) => task.status === "claimed" || task.status === "completed").length
  const eventTimeLabel = formatEventTime(projectSettings.eventTime)
  const storedName = currentContributorName.trim()
  const claimantNames = Array.from(
    new Set(
      tasks.flatMap((task) => (task.status === "available" ? [] : task.claimedBy || []))
    )
  )
  const visibleClaimants = claimantNames.slice(0, 4)
  const extraClaimants = Math.max(0, claimantNames.length - 4)

  const goToHostDashboard = () => {
    router.push(`/admin/project/${projectId}`)
  }

  const handleClaimTask = async (taskId: string) => {
    if (!storedName) return
    try {
      await claimTask(taskId, storedName)
    } catch (error) {
      console.error("Failed to claim task:", error)
    }
  }

  const handleAddOwnTask = async (taskName: string) => {
    if (!storedName) return
    try {
      await addTaskAndClaim(taskName, storedName)
    } catch (error) {
      console.error("Failed to add task:", error)
    }
  }

  return (
    <LoadingErrorWrapper>
      <div className="min-h-screen px-4 pt-6 pb-10">
        <div
          className="mx-auto bg-white"
          style={{
            maxWidth: 460,
            border: "0.5px solid var(--border, #e2e8f0)",
            borderRadius: 16,
          }}
        >
          <header className="text-left" style={{ padding: "1.25rem 1.25rem 1rem" }}>
            <h1 className="font-semibold text-gray-900 leading-tight" style={{ fontSize: 19 }}>
              {projectSettings.projectName || "SharedTask Project"}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              {eventTimeLabel && (
                <>
                  {eventTimeLabel}
                  <span className="mx-1.5">·</span>
                </>
              )}
              <button
                type="button"
                onClick={() => setIsEventDetailsOpen(true)}
                className="font-medium"
                style={{ color: "var(--text-accent, #2563eb)" }}
              >
                Details
              </button>
            </p>

            <div className="mt-3 flex items-center gap-3">
              <div
                className="flex-1 overflow-hidden"
                style={{
                  height: 6,
                  borderRadius: 999,
                  backgroundColor: "var(--fill-control, #e2e8f0)",
                }}
              >
                <div
                  className="h-full"
                  style={{
                    width: `${total === 0 ? 0 : Math.round((claimed / total) * 100)}%`,
                    borderRadius: 999,
                    backgroundColor: "var(--claimed-solid)",
                  }}
                />
              </div>
              {claimantNames.length > 0 && (
                <div className="flex items-center flex-shrink-0">
                  {visibleClaimants.map((name, index) => {
                    const isYou = storedName.length > 0 && name === storedName
                    return (
                      <span
                        key={`${name}-${index}`}
                        className="flex items-center justify-center rounded-full text-[9px] font-semibold"
                        title={name}
                        style={{
                          width: 20,
                          height: 20,
                          marginLeft: index === 0 ? 0 : -6,
                          zIndex: visibleClaimants.length - index,
                          border: "1.5px solid var(--surface-1, #ffffff)",
                          backgroundColor: isYou
                            ? "var(--claimed-solid)"
                            : "var(--fill-control, #e2e8f0)",
                          color: isYou ? "#ffffff" : "var(--text-secondary, #64748b)",
                        }}
                      >
                        {getInitials(name)}
                      </span>
                    )
                  })}
                  {extraClaimants > 0 && (
                    <span
                      className="flex items-center justify-center rounded-full text-[9px] font-semibold"
                      style={{
                        width: 20,
                        height: 20,
                        marginLeft: -6,
                        zIndex: 0,
                        border: "1.5px solid var(--surface-1, #ffffff)",
                        backgroundColor: "var(--fill-control, #e2e8f0)",
                        color: "var(--text-secondary, #64748b)",
                      }}
                    >
                      +{extraClaimants}
                    </span>
                  )}
                </div>
              )}
              <span
                className="whitespace-nowrap"
                style={{ fontSize: 12, color: "var(--text-secondary, #64748b)" }}
              >
                {claimed} of {total}
              </span>
            </div>

            {isOwner && (
              <div className="mt-3">
                <Button
                  onClick={goToHostDashboard}
                  variant="outline"
                  className="h-9 px-3 text-sm"
                >
                  Host Dashboard
                </Button>
              </div>
            )}
          </header>

          <EventDetailsModal open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen} />

          <ContributorTaskList
            onClaimTask={handleClaimTask}
            onAddOwnTask={handleAddOwnTask}
            claimedCount={claimed}
            totalCount={total}
          />

          <div
            className="footer-strip text-center"
            style={{
              padding: 14,
              borderTop: "0.5px solid var(--border, #e2e8f0)",
            }}
          >
            <a
              href="https://sharedtask.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-strip-link font-medium"
              style={{ fontSize: 13 }}
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
