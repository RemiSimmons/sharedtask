import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/lib/auth'

export async function GET() {
  // Check if user is authenticated and is admin
  const session = await auth()
  
  if (!session || session.user?.email !== 'contact@remisimmons.com') {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 403 }
    )
  }
  try {
    // Fallback to basic counts since RPC might not exist
    console.log('Using fallback queries for dashboard stats')
    const [userCount, projectCount, taskCount] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('projects').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('tasks').select('*', { count: 'exact', head: true })
    ])
    
    // Use basic counts as fallback
    const fallbackStats = {
      users: {
        total: userCount.count || 0,
        verified: 0,
        newThisWeek: 0,
        newThisMonth: 0
      },
      projects: {
        total: projectCount.count || 0,
        active: projectCount.count || 0,
        newThisWeek: 0,
        newThisMonth: 0
      },
      tasks: {
        total: taskCount.count || 0,
        completed: 0,
        claimed: 0,
        available: 0
      }
    }
    
    return NextResponse.json({
      ...fallbackStats,
      activity: { recentActivity: getRecentActivityMock() }
    })
  } catch (error) {
    console.error('Error in dashboard stats API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}

function getRecentActivityMock() {
  return [
      {
        id: '1',
        type: 'user_signup' as const,
        description: 'New user registered: john@example.com',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        user: 'john@example.com'
      },
      {
        id: '2',
        type: 'project_created' as const,
        description: 'New project created: Team Potluck Planning',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        user: 'sarah@example.com'
      },
      {
        id: '3',
        type: 'task_completed' as const,
        description: 'Task completed: Bring dessert',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        user: 'mike@example.com'
      },
      {
        id: '4',
        type: 'user_signup' as const,
        description: 'New user registered: lisa@example.com',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        user: 'lisa@example.com'
      },
      {
        id: '5',
        type: 'project_created' as const,
        description: 'New project created: Office Party Tasks',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        user: 'admin@example.com'
      }
    ]
}
