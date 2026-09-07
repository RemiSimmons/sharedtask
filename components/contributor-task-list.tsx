"use client"

import React, { useEffect, useState } from "react"
import { Check, MessageCircle, Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTask } from "@/contexts/TaskContextWithSupabase"
import { getInitials, getTaskLabels } from "@/lib/task-labels"

interface ContributorTaskListProps {
  onClaimTask: (taskId: string) => void
  onAddOwnTask: (taskName: string) => void
}

export default function ContributorTaskList({ onClaimTask, onAddOwnTask }: ContributorTaskListProps) {
  const {
    tasks,
    projectSettings,
    addComment,
    currentContributorName,
    setCurrentContributorName,
    unclaimTask,
  } = useTask()
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [newComments, setNewComments] = useState<Record<string, string>>({})
  const [showAddInput, setShowAddInput] = useState(false)
  const [newTaskName, setNewTaskName] = useState("")
  const [pendingUnclaimId, setPendingUnclaimId] = useState<string | null>(null)
  const [isAddingName, setIsAddingName] = useState(false)
  const [customName, setCustomName] = useState("")
  const storedName = currentContributorName.trim()
  const contributorNames = projectSettings.contributorNames || []
  const { singular } = getTaskLabels(projectSettings.taskLabel, projectSettings.taskLabelPlural)
  const hasName = storedName.length > 0

  useEffect(() => {
    if (!pendingUnclaimId) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest(`[data-unclaim-row="${pendingUnclaimId}"]`)) return
      setPendingUnclaimId(null)
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [pendingUnclaimId])

  useEffect(() => {
    if (!hasName) {
      setShowAddInput(false)
      setNewTaskName("")
      setPendingUnclaimId(null)
    }
  }, [hasName])

  const toggleComments = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedComments((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }

  const handleAddComment = (taskId: string) => {
    const commentText = newComments[taskId]?.trim()
    if (!commentText) return
    const authorName = storedName || "Guest"
    addComment(taskId, commentText, authorName)
    setNewComments((prev) => ({ ...prev, [taskId]: "" }))
    setExpandedComments((prev) => {
      const next = new Set(prev)
      next.delete(taskId)
      return next
    })
  }

  const commitCustomName = () => {
    const next = customName.trim()
    if (!next) return
    setCurrentContributorName(next)
    setCustomName("")
    setIsAddingName(false)
  }

  const handleAddOwnSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newTaskName.trim()
    if (!trimmed || !hasName) return
    onAddOwnTask(trimmed)
    setNewTaskName("")
    setShowAddInput(false)
  }

  return (
    <div className="w-full space-y-3" data-task-table>
      <h2 className="text-lg font-semibold text-gray-900">Who&apos;s bringing what</h2>

      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          {hasName ? (
            <div
              className="flex items-center gap-2 rounded-full px-2 pr-3"
              style={{
                height: 36,
                backgroundColor: "var(--bg-accent, #dbeafe)",
                color: "var(--text-accent, #2563eb)",
              }}
            >
              <span
                className="flex-shrink-0 flex items-center justify-center rounded-full text-[10px] font-semibold"
                style={{
                  width: 24,
                  height: 24,
                  backgroundColor: "var(--bg-accent, #bfdbfe)",
                  color: "var(--text-accent, #1d4ed8)",
                }}
              >
                {getInitials(storedName)}
              </span>
              <span className="truncate text-sm font-medium">{storedName}</span>
              <button
                type="button"
                onClick={() => {
                  setCurrentContributorName("")
                  setIsAddingName(false)
                  setCustomName("")
                }}
                className="ml-auto flex-shrink-0 text-xs underline-offset-2 hover:underline"
              >
                Not you?
              </button>
            </div>
          ) : isAddingName ? (
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onBlur={commitCustomName}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  commitCustomName()
                }
                if (e.key === "Escape") {
                  setIsAddingName(false)
                  setCustomName("")
                }
              }}
              placeholder="Type your name…"
              maxLength={50}
              autoFocus
              className="w-full min-h-[36px] px-3 text-sm border border-gray-300 rounded-lg"
            />
          ) : (
            <Select
              value=""
              onValueChange={(value) => {
                if (value === "__add_name__") {
                  setIsAddingName(true)
                  return
                }
                setCurrentContributorName(value)
              }}
            >
              <SelectTrigger className="h-9 min-h-[36px] text-sm">
                <SelectValue placeholder="Choose your name…" />
              </SelectTrigger>
              <SelectContent className="max-h-80 overflow-y-auto">
                {contributorNames.map((name) => (
                  <SelectItem key={name} value={name} className="text-sm py-2">
                    {name}
                  </SelectItem>
                ))}
                {projectSettings.allowContributorsAddNames && (
                  <SelectItem value="__add_name__" className="text-sm py-2 font-medium">
                    + Add my name…
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
        </div>

        {projectSettings.allowContributorsAddTasks && (
          <button
            type="button"
            onClick={() => {
              if (!hasName) return
              setShowAddInput(true)
            }}
            disabled={!hasName}
            className="flex items-center gap-1 text-sm font-medium whitespace-nowrap flex-shrink-0"
            style={
              hasName
                ? { color: "var(--text-accent, #2563eb)" }
                : { color: "var(--text-disabled, #94a3b8)", pointerEvents: "none" }
            }
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Add a {singular}
          </button>
        )}
      </div>

      {showAddInput && hasName && (
        <form onSubmit={handleAddOwnSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            placeholder={`Add a ${singular}`}
            maxLength={100}
            autoFocus
            className="flex-1 min-h-[44px] text-[17px] border-0 border-b border-gray-200 rounded-none px-0 focus:outline-none focus:border-blue-500 bg-transparent"
          />
          <button
            type="submit"
            disabled={!newTaskName.trim()}
            className="text-sm font-medium min-h-[44px] px-2"
            style={{ color: newTaskName.trim() ? "var(--text-accent, #2563eb)" : "var(--text-disabled, #94a3b8)" }}
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAddInput(false)
              setNewTaskName("")
            }}
            className="text-sm text-gray-400 min-h-[44px] px-1"
          >
            Cancel
          </button>
        </form>
      )}

      <p className="text-xs" style={{ color: "var(--text-secondary, #64748b)", fontSize: 12 }}>
        {hasName ? `Tap a ${singular} to claim it` : `Pick your name to claim a ${singular}`}
      </p>

      <div
        style={!hasName ? { opacity: 0.45, pointerEvents: "none" } : undefined}
      >
        <div className="divide-y divide-gray-200/80">
          {tasks.map((task) => {
            const isAvailable = task.status === "available"
            const isClaimed = task.status === "claimed" || task.status === "completed"
            const claimant = task.claimedBy?.[0]
            const isMine = Boolean(storedName && task.claimedBy?.includes(storedName))
            const isPendingUnclaim = pendingUnclaimId === task.id
            const isInteractive = hasName && (isAvailable || isMine)

            return (
              <div key={task.id} data-unclaim-row={isMine ? task.id : undefined}>
                <div className="flex w-full items-center gap-3 min-h-[44px]">
                  <button
                    type="button"
                    onClick={() => {
                      if (!hasName) return
                      if (isAvailable) {
                        onClaimTask(task.id)
                        return
                      }
                      if (!isMine) return
                      setPendingUnclaimId(isPendingUnclaim ? null : task.id)
                    }}
                    disabled={!isInteractive}
                    className={`flex flex-1 items-center gap-3 min-h-[44px] py-2.5 px-1 text-left ${
                      isInteractive ? "cursor-pointer active:bg-gray-50" : "cursor-default"
                    }`}
                  >
                    <span
                      className={`flex-shrink-0 flex items-center justify-center rounded-full ${
                        isAvailable
                          ? "border border-gray-300 bg-transparent"
                          : "bg-blue-600 text-white"
                      }`}
                      style={{ width: 26, height: 26 }}
                      aria-hidden
                    >
                      {isClaimed && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                    </span>

                    <span
                      className={`flex-1 text-[17px] leading-snug ${
                        isClaimed ? "line-through text-gray-400" : "text-gray-900"
                      }`}
                    >
                      {task.name}
                    </span>

                    {isClaimed && claimant && !isPendingUnclaim && (
                      <span
                        className="flex-shrink-0 flex items-center justify-center rounded-full text-[10px] font-semibold"
                        style={{
                          width: 24,
                          height: 24,
                          backgroundColor: isMine
                            ? "var(--bg-accent, #dbeafe)"
                            : "var(--fill-control, #e2e8f0)",
                          color: isMine
                            ? "var(--text-accent, #2563eb)"
                            : "var(--text-secondary, #64748b)",
                        }}
                        title={claimant}
                      >
                        {getInitials(claimant)}
                      </span>
                    )}
                  </button>

                  {isPendingUnclaim && (
                    <div className="flex items-center gap-2 pr-1">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!storedName) return
                          try {
                            await unclaimTask(task.id, storedName)
                          } catch (error) {
                            console.error("Failed to unclaim task:", error)
                          } finally {
                            setPendingUnclaimId(null)
                          }
                        }}
                        className="text-sm font-medium text-red-600 min-h-[44px] px-1"
                      >
                        Remove?
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingUnclaimId(null)}
                        className="text-sm text-gray-500 min-h-[44px] px-1"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {isAvailable && (
                    <button
                      type="button"
                      onClick={(e) => toggleComments(task.id, e)}
                      className="relative flex-shrink-0 flex items-center justify-center w-11 h-11 text-gray-400 hover:text-gray-700"
                      aria-label={`${task.comments.length} comments`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      {task.comments.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                          {task.comments.length > 9 ? "9+" : task.comments.length}
                        </span>
                      )}
                    </button>
                  )}
                </div>

                {isAvailable && expandedComments.has(task.id) && (
                  <div className="pl-[38px] pr-1 pb-3 space-y-2">
                    {task.comments.map((comment) => (
                      <div key={comment.id} className="text-sm">
                        <span className="font-medium text-gray-800">{comment.author}</span>
                        <p className="text-gray-600">{comment.text}</p>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComments[task.id] || ""}
                        onChange={(e) => setNewComments((prev) => ({ ...prev, [task.id]: e.target.value }))}
                        placeholder="Add a comment"
                        className="flex-1 min-h-[44px] px-3 text-sm border border-gray-200 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddComment(task.id)}
                        disabled={!newComments[task.id]?.trim()}
                        className="text-sm font-medium text-blue-600 disabled:text-gray-300 min-h-[44px] px-2"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
