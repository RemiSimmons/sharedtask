import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeSubscriptionOptions {
  projectId: string | undefined
  onTasksChange: () => Promise<void>
  onProjectChange: () => Promise<void>
  enabled?: boolean
}

/**
 * Supabase Realtime subscription hook for live updates
 * Subscribes to tasks, task_assignments, task_comments, and projects tables
 * Provides instant updates when data changes in any tab or device
 */
export function useRealtimeSubscription({
  projectId,
  onTasksChange,
  onProjectChange,
  enabled = true
}: UseRealtimeSubscriptionOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  
  // Track if user is actively editing (focused input)
  const [isEditing, setIsEditing] = useState(false)
  
  // Store callbacks in refs to prevent reconnection loops
  const onTasksChangeRef = useRef(onTasksChange)
  const onProjectChangeRef = useRef(onProjectChange)
  
  // Update refs when callbacks change
  useEffect(() => {
    onTasksChangeRef.current = onTasksChange
    onProjectChangeRef.current = onProjectChange
  }, [onTasksChange, onProjectChange])
  
  useEffect(() => {
    // Track focus on input/textarea elements
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setIsEditing(true)
      }
    }
    
    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Small delay to allow for quick input switching
        setTimeout(() => {
          const activeEl = document.activeElement as HTMLElement
          if (activeEl.tagName !== 'INPUT' && activeEl.tagName !== 'TEXTAREA') {
            setIsEditing(false)
          }
        }, 100)
      }
    }
    
    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)
    
    return () => {
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
    }
  }, [])

  useEffect(() => {
    if (!enabled || !projectId) {
      // Cleanup existing subscription
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
        setIsConnected(false)
      }
      return
    }

    // Create a unique channel for this project
    const channel = supabase.channel(`project:${projectId}`)

    // Subscribe to tasks table changes
    channel
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`
        },
        async (payload) => {
          console.log('🔄 Realtime: Tasks changed', payload.eventType)
          if (!isEditing) {
            await onTasksChangeRef.current()
            setLastUpdate(new Date())
          } else {
            console.log('⏸️  User is editing, deferring update')
          }
        }
      )
      // Subscribe to task_assignments changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_assignments'
        },
        async (payload) => {
          console.log('🔄 Realtime: Task assignments changed', payload.eventType)
          if (!isEditing) {
            await onTasksChangeRef.current()
            setLastUpdate(new Date())
          }
        }
      )
      // Subscribe to task_comments changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_comments'
        },
        async (payload) => {
          console.log('🔄 Realtime: Task comments changed', payload.eventType)
          if (!isEditing) {
            await onTasksChangeRef.current()
            setLastUpdate(new Date())
          }
        }
      )
      // Subscribe to project settings changes
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`
        },
        async (payload) => {
          console.log('🔄 Realtime: Project settings changed')
          if (!isEditing) {
            await onProjectChangeRef.current()
            setLastUpdate(new Date())
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime: Connected to project', projectId)
          setIsConnected(true)
        } else if (status === 'CLOSED') {
          console.log('❌ Realtime: Disconnected')
          setIsConnected(false)
        } else if (status === 'CHANNEL_ERROR') {
          // Only log error in development, silently handle in production
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Realtime: Channel error (this is usually non-critical)')
          }
          setIsConnected(false)
          // Attempt to reconnect after a delay
          setTimeout(() => {
            if (channelRef.current && projectId) {
              console.log('🔄 Realtime: Attempting to reconnect...')
            }
          }, 5000)
        }
      })

    channelRef.current = channel

    // Cleanup on unmount or projectId change
    return () => {
      if (channelRef.current) {
        console.log('🔌 Realtime: Unsubscribing from project', projectId)
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
        setIsConnected(false)
      }
    }
  }, [projectId, enabled]) // Removed callbacks from dependencies to prevent reconnection loops

  // When user stops editing, trigger delayed refresh if there were pending updates
  useEffect(() => {
    if (!isEditing && lastUpdate) {
      const timeSinceUpdate = Date.now() - lastUpdate.getTime()
      if (timeSinceUpdate < 5000) {
        // If update happened less than 5 seconds ago, refresh now
        console.log('🔄 User stopped editing, applying pending updates')
        onTasksChangeRef.current()
      }
    }
  }, [isEditing, lastUpdate])

  return {
    isConnected,
    isEditing,
    lastUpdate
  }
}

