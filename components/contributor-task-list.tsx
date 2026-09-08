"use client"

import React, { useEffect, useRef, useState } from "react"
import { Check, MessageCircle, Minus, Plus, Users } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTask } from "@/contexts/TaskContextWithSupabase"
import { getInitials, getTaskLabels } from "@/lib/task-labels"
import { getTaskIcon } from "@/lib/task-icons"
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

function GuestRow({
  storedName,
  tasks,
  guestCounts,
  updateGuestCount,
}: {
  storedName: string
  tasks: Task[]
  guestCounts: Record<string, number>
  updateGuestCount: (name: string, count: number) => Promise<void>
}) {
  const serverCount = guestCounts[storedName] ?? 0
  const [count, setCount] = useState(serverCount)
  const countRef = useRef(count)
  const pendingRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveRef = useRef(updateGuestCount)
  const nameRef = useRef(storedName)
  const saveIdRef = useRef(0)

  countRef.current = count
  saveRef.current = updateGuestCount
  nameRef.current = storedName

  useEffect(() => {
    if (!pendingRef.current) setCount(serverCount)
  }, [serverCount])

  useEffect(() => {
    pendingRef.current = false
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setCount(guestCounts[storedName] ?? 0)
  }, [storedName])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (pendingRef.current) {
        void saveRef.current(nameRef.current, countRef.current)
      }
    }
  }, [])

  const distinctClaimants = new Set(
    tasks.flatMap((task) => (task.status === "available" ? [] : task.claimedBy || []))
  ).size
  const othersGuests = Object.entries(guestCounts).reduce((sum, [name, extra]) => {
    if (name === storedName) return sum
    return sum + extra
  }, 0)
  const totalComing = distinctClaimants + othersGuests + count

  const scheduleSave = (next: number) => {
    const clamped = Math.max(0, Math.min(20, next))
    pendingRef.current = true
    setCount(clamped)
    countRef.current = clamped
    if (timerRef.current) clearTimeout(timerRef.current)
    const saveId = ++saveIdRef.current
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      void updateGuestCount(storedName, clamped).finally(() => {
        if (saveIdRef.current === saveId) pendingRef.current = false
      })
    }, 500)
  }

  return (
    <div
      className="flex items-center"
      style={{
        padding: "8px 1.25rem",
        gap: 8,
        borderTop: "0.5px solid var(--border, #e2e8f0)",
      }}
    >
      <Users
        className="flex-shrink-0"
        width={16}
        height={16}
        strokeWidth={2}
        style={{ color: "var(--claimed-solid)" }}
        aria-hidden
      />
      <p className="min-w-0 flex-1" style={{ fontSize: 13, lineHeight: "16px" }}>
        <span className="font-medium" style={{ color: "var(--claimed-solid)" }}>
          {totalComing}
        </span>
        <span className="font-medium" style={{ color: "var(--claimed-solid)" }}>
          {" "}guests{" "}
        </span>
        <span style={{ color: "var(--text-secondary, #64748b)" }}>coming</span>
      </p>
      <span className="guest-row-label">Your guests</span>
      <div className="guest-stepper" role="group" aria-label="Guests accompanying you">
        <button
          type="button"
          onClick={() => scheduleSave(count - 1)}
          disabled={count <= 0}
          aria-label="Decrease guests"
        >
          <Minus className="w-3 h-3" strokeWidth={2.5} />
        </button>
        <span
          className="guest-stepper-value"
          style={
            count === 0
              ? { fontSize: 11, color: "var(--text-secondary, #64748b)" }
              : { fontSize: 12, color: "var(--foreground, #1e293b)", fontWeight: 500 }
          }
        >
          {count === 0 ? "Just me" : `+${count}`}
        </span>
        <button
          type="button"
          onClick={() => scheduleSave(count + 1)}
          disabled={count >= 20}
          aria-label="Increase guests"
        >
          <Plus className="w-3 h-3" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
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
    guestCounts,
    updateGuestCount,
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
          className="name-chip flex items-center min-w-0"
          style={{
            height: compact ? 28 : 36,
            gap: compact ? 6 : 8,
          }}
        >
          <span
            className="chip-avatar flex-shrink-0 flex items-center justify-center rounded-full text-[10px] font-semibold"
            style={{
              width: compact ? 20 : 24,
              height: compact ? 20 : 24,
            }}
          >
            {getInitials(storedName)}
          </span>
          <span className={`truncate font-medium ${compact ? "text-sm" : "text-sm"}`}>{storedName}</span>
          {!compact && (
            <button
              type="button"
              onClick={clearName}
              className="chip-not-you ml-1 flex-shrink-0 text-xs underline-offset-2 hover:underline"
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
          padding: "0 10px",
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
        <span className="text-sm font-medium whitespace-nowrap">Add a {singular}</span>
      </button>
    )
  }

  const renderTaskRow = (task: Task) => {
    const isAvailable = task.status === "available"
    const isClaimed = task.status === "claimed" || task.status === "completed"
    const claimant = task.claimedBy?.[0]
    const isMine = Boolean(storedName && task.claimedBy?.includes(storedName))
    const isPendingUnclaim = pendingUnclaimId === task.id
    const isInteractive = hasName && (isAvailable || isMine)
    const commentsOpen = expandedComments.has(task.id)
    const { icon: TaskIcon, matched: iconMatched } = getTaskIcon(task.name)

    const tileStyle: React.CSSProperties = {
      padding: 12,
      borderRadius: 10,
      backgroundColor: isClaimed ? undefined : "var(--surface-1, #ffffff)",
      border: isClaimed ? "none" : "0.5px solid var(--border, #e2e8f0)",
    }

    return (
      <div
        key={task.id}
        data-unclaim-row={isMine ? task.id : undefined}
        className={`group ${
          isMine
            ? "claimed-tile-mine"
            : isClaimed
              ? "claimed-tile-other"
              : ""
        } ${
          isAvailable && hasName
            ? "cursor-pointer hover:[border-color:var(--border-strong,#64748b)]"
            : ""
        }`}
        style={tileStyle}
      >
        <div className="flex w-full items-center gap-2">
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
            className={`flex flex-1 items-center gap-3 text-left min-h-[44px] ${
              isInteractive ? "cursor-pointer" : "cursor-default"
            }`}
          >
            <span
              className={`claimed-circle flex-shrink-0 flex items-center justify-center rounded-full ${
                isAvailable && hasName ? "group-hover:border-[var(--text-accent,#2563eb)]" : ""
              }`}
              style={{
                width: 20,
                height: 20,
                border: isAvailable ? "1.5px solid var(--border-strong, #94a3b8)" : "none",
                backgroundColor: isClaimed ? undefined : "transparent",
              }}
            >
              {isClaimed && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
            </span>

            <span className="flex min-w-0 flex-1 items-center" style={{ gap: 11 }}>
              <TaskIcon
                className={iconMatched ? "task-food-icon" : "task-food-icon-fallback"}
                width={19}
                height={19}
                stroke={1.75}
                aria-hidden
              />
              <span
                className={`flex-1 text-[15px] leading-snug ${isClaimed ? "claimed-name" : ""}`}
                style={isClaimed ? undefined : { color: "#111827" }}
              >
                {task.name}
              </span>
            </span>

            {isClaimed && claimant && !isPendingUnclaim && (
              <span className="claimed-label flex-shrink-0" style={{ fontSize: 11 }}>
                {isMine ? "You" : firstName(claimant)}
              </span>
            )}
          </button>

          {isPendingUnclaim && (
            <div className="flex items-center gap-2">
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

          <button
            type="button"
            onClick={(e) => toggleComments(task.id, e)}
            className={`claimed-comment relative flex-shrink-0 flex items-center justify-center w-11 h-11 ${
              isClaimed ? "" : "text-gray-400 hover:text-gray-700"
            }`}
            aria-label={`${task.comments.length} comments`}
          >
            <MessageCircle className="w-4 h-4" />
            {task.comments.length > 0 && (
              <span className="absolute top-1.5 right-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {task.comments.length > 9 ? "9+" : task.comments.length}
              </span>
            )}
          </button>
        </div>

        {commentsOpen && (
          <div className="pt-3 space-y-2">
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
        className="identity-strip sticky top-0"
        style={{
          zIndex: 20,
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
        {hasName && (
          <GuestRow
            storedName={storedName}
            tasks={tasks}
            guestCounts={guestCounts}
            updateGuestCount={updateGuestCount}
          />
        )}
      </div>

      {showAddInput && hasName && (
        <form onSubmit={handleAddOwnSubmit} className="flex items-center gap-2 px-5 py-2">
          <input
            type="text"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            placeholder={`Add a ${singular} or Just Coming`}
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
          <div>
            <p
              className="uppercase"
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.06em",
                marginTop: 20,
                marginBottom: 10,
                color: "var(--text-secondary, #64748b)",
              }}
            >
              Still needed · {stillNeeded.length}
            </p>
            <div className="flex flex-col" style={{ gap: 7 }}>
              {stillNeeded.map((task) => renderTaskRow(task))}
            </div>
          </div>
        )}

        {covered.length > 0 && (
          <div>
            <p
              className="uppercase"
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.06em",
                marginTop: 20,
                marginBottom: 10,
                color: "var(--claimed-solid-dark)",
              }}
            >
              Covered · {covered.length}
            </p>
            <div className="flex flex-col" style={{ gap: 7 }}>
              {covered.map((task) => renderTaskRow(task))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
