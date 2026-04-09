import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Get project count
    const { data: projects, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, created_at')
      .eq('user_id', session.user.id)

    if (projectError) {
      console.error('Error fetching projects:', projectError)
      return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 })
    }

    // Get task count from all user's projects
    const projectIds = projects?.map((p: any) => p.id) || []
    let taskCount = 0
    
    if (projectIds.length > 0) {
      const { data: tasks, error: taskError } = await supabaseAdmin
        .from('tasks')
        .select('id')
        .in('project_id', projectIds)

      if (!taskError) {
        taskCount = tasks?.length || 0
      }
    }

    return NextResponse.json({
      usage: {
        projects: {
          total: projects?.length || 0,
          active: projects?.length || 0,
          max: -1
        },
        tasks: {
          total: taskCount,
        },
        storage: {
          used: 0,
          max: -1
        },
        contributors: {
          max: -1
        }
      }
    })

  } catch (error) {
    console.error('Usage data error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      debug: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
