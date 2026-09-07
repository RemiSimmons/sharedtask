"use client"

import React, { useState } from "react"
import { Check, MessageCircle, Plus } from "lucide-react"
import { useTask } from "@/contexts/TaskContextWithSupabase"
import { getInitials, getTaskLabels } from "@/lib/task-labels"

interface ContributorTaskListProps {
  onClaimTask: (taskId: string) => void
  onAddOwnTask: (taskName: string) => void
}

export default function ContributorTaskList({ onClaimTask, onAddOwnTask }: ContributorTaskListProps) {
  const { tasks, projectSettings, addComment, currentContributorName } = useTask()
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [newComments, setNewComments] = useState<Record<string, string>>({})
  const [showAddInput, setShowAddInput] = useState(false)
  const [newTaskName, setNewTaskName] = useState("")

  const { singular } = getTaskLabels(projectSettings.taskLabel, projectSettings.taskLabelPlural)

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
    const authorName = currentContributorName.trim() || "Guest"
    addComment(taskId, commentText, authorName)
    setNewComments((prev) => ({ ...prev, [taskId]: "" }))
    setExpandedComments((prev) => {
      const next = new Set(prev)
      next.delete(taskId)
      return next
    })
  }

  const handleAddOwnSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newTaskName.trim()
    if (!trimmed) return
    onAddOwnTask(trimmed)
    setNewTaskName("")
    setShowAddInput(false)
  }

  return (
    <div className="w-full" data-task-table>
      <div className="divide-y divide-gray-200/80">
        {tasks.map((task) => {
          const isAvailable = task.status === "available"
          const isClaimed = task.status === "claimed" || task.status === "completed"
          const claimant = task.claimedBy?.[0]

          return (
            <div key={task.id}>
              <div className="flex w-full items-center gap-3 min-h-[44px]">
                <button
                  type="button"
                  onClick={() => {
                    if (isAvailable) onClaimTask(task.id)
                  }}
                  disabled={!isAvailable}
                  className={`flex flex-1 items-center gap-3 min-h-[44px] py-2.5 px-1 text-left ${
                    isAvailable ? "cursor-pointer active:bg-gray-50" : "cursor-default"
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

                  {isClaimed && claimant && (
                    <span
                      className="flex-shrink-0 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 text-[10px] font-semibold"
                      style={{ width: 26, height: 26 }}
                      title={claimant}
                    >
                      {getInitials(claimant)}
                    </span>
                  )}
                </button>

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

        {projectSettings.allowContributorsAddTasks && (
          <div>
            {!showAddInput ? (
              <button
                type="button"
                onClick={() => setShowAddInput(true)}
                className="flex w-full items-center gap-3 min-h-[44px] py-2.5 px-1 text-left active:bg-gray-50"
              >
                <span
                  className="flex-shrink-0 flex items-center justify-center rounded-full border border-dashed border-gray-400 text-gray-400"
                  style={{ width: 26, height: 26 }}
                  aria-hidden
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                </span>
                <span className="text-[17px] text-gray-500">Add a {singular}</span>
              </button>
            ) : (
              <form onSubmit={handleAddOwnSubmit} className="flex items-center gap-3 min-h-[44px] py-2.5 px-1">
                <span
                  className="flex-shrink-0 flex items-center justify-center rounded-full border border-dashed border-blue-400 text-blue-500"
                  style={{ width: 26, height: 26 }}
                  aria-hidden
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                </span>
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
                  className="text-sm font-medium text-blue-600 disabled:text-gray-300 min-h-[44px] px-2"
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
          </div>
        )}
      </div>
    </div>
  )
}
