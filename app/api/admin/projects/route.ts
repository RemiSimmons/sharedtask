import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get projects for the authenticated user with task counts
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        task_label,
        created_at,
        tasks(count)
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to load projects' },
        { status: 500 }
      )
    }

    // Transform the data to include task counts
    const projectsWithCounts = (projects || []).map(project => ({
      ...project,
      _count: {
        tasks: project.tasks?.length || 0
      }
    }))

    return NextResponse.json({ projects: projectsWithCounts })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
