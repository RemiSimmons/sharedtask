import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId || userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Query to get unique contributor names from user's previous projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', userId)

    if (projectsError) {
      console.error('Error fetching user projects:', projectsError)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json({ suggestions: [] })
    }

    const projectIds = projects.map(p => p.id)

    // First get task IDs from user's projects
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id')
      .in('project_id', projectIds)

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ suggestions: [] })
    }

    const taskIds = tasks.map(t => t.id)

    // Get all task assignments from user's projects
    const { data: assignments, error: assignmentsError } = await supabase
      .from('task_assignments')
      .select('contributor_name')
      .in('task_id', taskIds)

    if (assignmentsError) {
      console.error('Error fetching task assignments:', assignmentsError)
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
    }

    // Count frequency for each contributor
    const contributorStats = new Map<string, { frequency: number }>()

    assignments?.forEach(assignment => {
      const name = assignment.contributor_name
      const current = contributorStats.get(name) || { frequency: 0 }
      
      contributorStats.set(name, {
        frequency: current.frequency + 1
      })
    })

    // Convert to array and sort by frequency (most used first)
    const suggestions = Array.from(contributorStats.entries())
      .map(([name, stats]) => ({
        name,
        frequency: stats.frequency
      }))
      .sort((a, b) => b.frequency - a.frequency) // Sort by frequency (descending)
      .slice(0, 50) // Limit to top 50 most frequent collaborators

    return NextResponse.json({ suggestions })

  } catch (error) {
    console.error('Error in participants suggestions API:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
