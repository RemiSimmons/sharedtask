"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Project, Task as DatabaseTask, TaskAssignment, TaskComment } from '@/types/database'

// ============================================================================
// OPTIMIZED TASK MANAGEMENT HOOKS
// ============================================================================

export interface OptimizedTask {
  id: string
  name: string
  description?: string
  status: 'available' | 'claimed' | 'completed'
  contributors: string[]
  comments: Array<{
    id: string
    author: string
    content: string
    timestamp: Date
  }>
  createdAt: Date
}

// Query Keys for consistent caching
export const taskKeys = {
  all: ['tasks'] as const,
  project: (projectId: string) => [...taskKeys.all, 'project', projectId] as const,
  task: (taskId: string) => [...taskKeys.all, 'task', taskId] as const,
  comments: (taskId: string) => [...taskKeys.all, 'comments', taskId] as const,
}

export const projectKeys = {
  all: ['projects'] as const,
  user: (userId: string) => [...projectKeys.all, 'user', userId] as const,
  project: (projectId: string) => [...projectKeys.all, 'project', projectId] as const,
  settings: (projectId: string) => [...projectKeys.all, 'settings', projectId] as const,
}

// ============================================================================
// PROJECT HOOKS
// ============================================================================

/**
 * Get project with optimized caching
 */
export function useProject(projectId: string) {
  return useQuery({
    queryKey: projectKeys.project(projectId),
    queryFn: async (): Promise<Project | null> => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle()

      if (error) throw error
      return data
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minutes - projects don't change often
  })
}

/**
 * Get user's projects with caching
 */
export function useUserProjects(userId: string) {
  return useQuery({
    queryKey: projectKeys.user(userId),
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

// ============================================================================
// TASK HOOKS
// ============================================================================

/**
 * Get tasks for a project with intelligent caching
 */
export function useProjectTasks(projectId: string) {
  return useQuery({
    queryKey: taskKeys.project(projectId),
    queryFn: async (): Promise<OptimizedTask[]> => {
      // Use a single optimized query with joins
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          task_assignments(contributor_name, claimed_at),
          task_comments(id, author_name, content, created_at)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      if (tasksError) throw tasksError

      // Transform to optimized format
      const optimizedTasks: OptimizedTask[] = (tasksData || []).map(task => ({
        id: task.id,
        name: task.name,
        description: task.description || undefined,
        status: task.status as 'available' | 'claimed' | 'completed',
        contributors: task.task_assignments?.map((a: any) => a.contributor_name) || [],
        comments: task.task_comments?.map((c: any) => ({
          id: c.id,
          author: c.author_name,
          content: c.content,
          timestamp: new Date(c.created_at)
        })) || [],
        createdAt: new Date(task.created_at || new Date())
      }))

      return optimizedTasks
    },
    enabled: !!projectId,
    staleTime: 30 * 1000, // 30 seconds - tasks change more frequently
    // Re-enabled with longer intervals - only for active projects
    refetchInterval: (query) => {
      const data = query.state.data
      const activeTasks = data?.filter(t => t.status !== 'completed').length || 0
      // Much longer intervals: 5 minutes for active tasks, 15 minutes for inactive
      return activeTasks > 0 ? 5 * 60 * 1000 : 15 * 60 * 1000
    },
  })
}

/**
 * Get single task with comments
 */
export function useTask(taskId: string) {
  return useQuery({
    queryKey: taskKeys.task(taskId),
    queryFn: async (): Promise<OptimizedTask | null> => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          task_assignments(contributor_name, claimed_at),
          task_comments(id, author_name, content, created_at)
        `)
        .eq('id', taskId)
        .maybeSingle()

      if (error) throw error
      if (!data) return null

      return {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        status: data.status as 'available' | 'claimed' | 'completed',
        contributors: data.task_assignments?.map((a: any) => a.contributor_name) || [],
        comments: data.task_comments?.map((c: any) => ({
          id: c.id,
          author: c.author_name,
          content: c.content,
          timestamp: new Date(c.created_at)
        })) || [],
        createdAt: new Date(data.created_at || new Date())
      }
    },
    enabled: !!taskId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create task with optimistic updates
 */
export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskData: { name: string; description?: string }) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          project_id: projectId,
          name: taskData.name,
          description: taskData.description,
          status: 'available'
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onMutate: async (newTask) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.project(projectId) })

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData(taskKeys.project(projectId))

      // Optimistically update
      queryClient.setQueryData(taskKeys.project(projectId), (old: OptimizedTask[] = []) => [
        ...old,
        {
          id: `temp-${Date.now()}`,
          name: newTask.name,
          description: newTask.description,
          status: 'available' as const,
          contributors: [],
          comments: [],
          createdAt: new Date()
        }
      ])

      return { previousTasks }
    },
    onError: (err, newTask, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.project(projectId), context.previousTasks)
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: taskKeys.project(projectId) })
    },
  })
}

/**
 * Update task status with optimistic updates
 */
export function useUpdateTaskStatus(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.project(projectId) })

      const previousTasks = queryClient.getQueryData(taskKeys.project(projectId))

      queryClient.setQueryData(taskKeys.project(projectId), (old: OptimizedTask[] = []) =>
        old.map(task => 
          task.id === taskId 
            ? { ...task, status: status as 'available' | 'claimed' | 'completed' }
            : task
        )
      )

      return { previousTasks }
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.project(projectId), context.previousTasks)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.project(projectId) })
    },
  })
}

/**
 * Claim task with optimistic updates
 */
export function useClaimTask(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, contributorName }: { taskId: string; contributorName: string }) => {
      // Update task status and add assignment in transaction
      const { error: statusError } = await supabase
        .from('tasks')
        .update({ status: 'claimed' })
        .eq('id', taskId)

      if (statusError) throw statusError

      const { data, error: assignError } = await supabase
        .from('task_assignments')
        .insert({
          task_id: taskId,
          project_id: projectId,
          contributor_name: contributorName
        })
        .select()
        .single()

      if (assignError) throw assignError
      return data
    },
    onMutate: async ({ taskId, contributorName }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.project(projectId) })

      const previousTasks = queryClient.getQueryData(taskKeys.project(projectId))

      queryClient.setQueryData(taskKeys.project(projectId), (old: OptimizedTask[] = []) =>
        old.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                status: 'claimed' as const,
                contributors: [...task.contributors, contributorName]
              }
            : task
        )
      )

      return { previousTasks }
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.project(projectId), context.previousTasks)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.project(projectId) })
    },
  })
}

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Prefetch project tasks for better UX
 */
export function usePrefetchTasks() {
  const queryClient = useQueryClient()

  return (projectId: string) => {
    queryClient.prefetchQuery({
      queryKey: taskKeys.project(projectId),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            *,
            task_assignments(contributor_name),
            task_comments(id, author_name, content, created_at)
          `)
          .eq('project_id', projectId)
          .order('created_at', { ascending: true })

        if (error) throw error
        return data || []
      },
      staleTime: 30 * 1000,
    })
  }
}

/**
 * Invalidate all task-related queries
 */
export function useInvalidateTasks() {
  const queryClient = useQueryClient()

  return {
    invalidateProject: (projectId: string) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.project(projectId) })
    },
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  }
}
