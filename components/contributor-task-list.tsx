"use client"

import React, { useEffect, useRef, useState } from "react"
import { Check, MessageCircle, Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTask } from "@/contexts/TaskContextWithSupabase"
import { getInitials, getTaskLabels } from "@/lib/task-labels"
import type { Task } from "@/contexts/TaskContextWithSupabase"

interface ContributorTaskListProps {
  onClaimTask: (taskId: string) => void
  onAddOwnTask: (taskName: string) => void
  claimedCount: number
  totalCount: number
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name
}

export default function ContributorTaskList({
  onClaimTask,
  onAddOwnTask,
  claimedCount,
  totalCount,
}: ContributorTaskListProps) {
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
  const [isStuck, setIsStuck] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const storedName = currentContributorName.trim()
  const contributorNames = projectSettings.contributorNames || []
  const { singular } = getTaskLabels(projectSettings.taskLabel, projectSettings.taskLabelPlural)
  const hasName = storedName.length > 0
  const stillNeeded = tasks.filter((task) => task.status === "available")
  const covered = tasks.filter((task) => task.status === "claimed" || task.status === "completed")

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

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

  const clearName = () => {
    setCurrentContributorName("")
    setIsAddingName(false)
    setCustomName("")
  }

  const renderNameControl = (compact: boolean) => {
    if (hasName) {
      return (
        <div
          className="flex items-center min-w-0"
          style={{
            height: compact ? 28 : 36,
            gap: compact ? 6 : 8,
            color: "var(--text-accent, #2563eb)",
          }}
        >
          <span
            className="flex-shrink-0 flex items-center justify-center rounded-full text-[10px] font-semibold"
            style={{
              width: compact ? 20 : 24,
              height: compact ? 20 : 24,
              backgroundColor: "var(--bg-accent, #bfdbfe)",
              color: "var(--text-accent, #1d4ed8)",
            }}
          >
            {getInitials(storedName)}
          </span>
          <span className={`truncate font-medium ${compact ? "text-sm" : "text-sm"}`}>{storedName}</span>
          {!compact && (
            <button
              type="button"
              onClick={clearName}
              className="ml-1 flex-shrink-0 text-xs underline-offset-2 hover:underline"
            >
              Not you?
            </button>
          )}
        </div>
      )
    }

    if (isAddingName) {
      return (
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
          className="w-full min-w-0 px-3 text-sm border border-gray-300 rounded-lg"
          style={{ height: compact ? 28 : 36 }}
        />
      )
    }

    return (
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
        <SelectTrigger className="text-sm" style={{ height: compact ? 28 : 36, minHeight: compact ? 28 : 36 }}>
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
    )
  }

  const renderAddButton = (compact: boolean) => {
    if (!projectSettings.allowContributorsAddTasks) return null
    return (
      <button
        type="button"
        onClick={() => {
          if (!hasName) return
          setShowAddInput(true)
        }}
        disabled={!hasName}
        className="flex items-center justify-center flex-shrink-0"
        style={{
          height: compact ? 28 : 36,
          width: compact ? 28 : undefined,
          padding: compact ? 0 : "0 10px",
          gap: 6,
          borderRadius: 8,
          border: "1px solid var(--border, #e2e8f0)",
          color: hasName ? "var(--text-accent, #2563eb)" : "var(--text-disabled, #94a3b8)",
          pointerEvents: hasName ? "auto" : "none",
          backgroundColor: "white",
        }}
        aria-label={`Add a ${singular}`}
      >
        <Plus className="w-4 h-4" strokeWidth={2.5} />
        {!compact && <span className="text-sm font-medium whitespace-nowrap">Add a {singular}</span>}
      </button>
    )
  }

  const renderTaskRow = (task: Task, isLast: boolean) => {
    const isAvailable = task.status === "available"
    const isClaimed = task.status === "claimed" || task.status === "completed"
    const claimant = task.claimedBy?.[0]
    const isMine = Boolean(storedName && task.claimedBy?.includes(storedName))
    const isPendingUnclaim = pendingUnclaimId === task.id
    const isInteractive = hasName && (isAvailable || isMine)

    return (
      <div
        key={task.id}
        data-unclaim-row={isMine ? task.id : undefined}
        style={!isLast ? { borderBottom: "0.5px solid var(--border, #e2e8f0)" } : undefined}
      >
        <div className="flex w-full items-center">
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
            className={`group flex flex-1 items-center gap-3 text-left ${
              isAvailable && hasName
                ? "cursor-pointer hover:bg-[var(--bg-accent,#eff6ff)] -mx-5 px-5 rounded-lg"
                : isInteractive
                  ? "cursor-pointer"
                  : "cursor-default"
            }`}
            style={{ paddingTop: 13, paddingBottom: 13 }}
          >
            <span
              className={`flex-shrink-0 flex items-center justify-center rounded-full ${
                isAvailable && hasName ? "group-hover:border-[var(--text-accent,#2563eb)]" : ""
              }`}
              style={{
                width: 22,
                height: 22,
                border: isAvailable ? "1px solid #d1d5db" : "none",
                backgroundColor: isClaimed
                  ? isMine
                    ? "var(--text-accent, #2563eb)"
                    : "var(--fill-control, #94a3b8)"
                  : "transparent",
                color: "white",
              }}
            >
              {isClaimed && <Check className="w-3 h-3" strokeWidth={3} />}
            </span>

            <span
              className="flex-1 text-[15px] leading-snug"
              style={{
                color: isClaimed ? "var(--text-secondary, #64748b)" : "#111827",
              }}
            >
              {task.name}
            </span>

            {isClaimed && claimant && !isPendingUnclaim && (
              <span
                className="flex-shrink-0"
                style={{
                  fontSize: 12,
                  color: isMine ? "var(--text-accent, #2563eb)" : "var(--text-secondary, #64748b)",
                }}
              >
                {isMine ? "You" : firstName(claimant)}
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
          <div className="pb-3 space-y-2" style={{ paddingLeft: 34 }}>
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
  }

  return (
    <div className="w-full text-left" data-task-table>
      <div ref={sentinelRef} className="h-px w-full" aria-hidden />
      <div
        className="sticky top-0"
        style={{
          zIndex: 20,
          backgroundColor: isStuck ? "white" : "var(--bg-accent, #eff6ff)",
          borderTop: "0.5px solid var(--border, #e2e8f0)",
          borderBottom: "0.5px solid var(--border, #e2e8f0)",
        }}
      >
        <div
          className="flex items-center"
          style={{
            padding: isStuck ? "4px 1.25rem" : "12px 1.25rem",
            gap: 8,
            minHeight: isStuck ? 36 : undefined,
          }}
        >
          <div className="min-w-0 flex-1">{renderNameControl(isStuck)}</div>
          {isStuck && (
            <span className="whitespace-nowrap" style={{ fontSize: 12, color: "var(--text-secondary, #64748b)" }}>
              {claimedCount} of {totalCount}
            </span>
          )}
          {renderAddButton(isStuck)}
        </div>
      </div>

      {showAddInput && hasName && (
        <form onSubmit={handleAddOwnSubmit} className="flex items-center gap-2 px-5 py-2">
          <input
            type="text"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            placeholder={`Add a ${singular}`}
            maxLength={100}
            autoFocus
            className="flex-1 min-h-[44px] text-[15px] border-0 border-b border-gray-200 rounded-none px-0 focus:outline-none focus:border-blue-500 bg-transparent"
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

      <div
        className="px-5 pb-2"
        style={!hasName ? { opacity: 0.45, pointerEvents: "none" } : undefined}
      >
        {stillNeeded.length > 0 && (
          <div className="pt-3">
            <p
              className="uppercase tracking-wide"
              style={{ fontSize: 11, color: "var(--text-secondary, #64748b)" }}
            >
              Still needed · {stillNeeded.length}
            </p>
            <div>
              {stillNeeded.map((task, index) => renderTaskRow(task, index === stillNeeded.length - 1))}
            </div>
          </div>
        )}

        {covered.length > 0 && (
          <div className="pt-3">
            <p
              className="uppercase tracking-wide"
              style={{ fontSize: 11, color: "var(--text-secondary, #64748b)" }}
            >
              Covered · {covered.length}
            </p>
            <div>
              {covered.map((task, index) => renderTaskRow(task, index === covered.length - 1))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
