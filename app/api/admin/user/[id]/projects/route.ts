import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/lib/auth'
import { isAdminUser } from '@/lib/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session || !isAdminUser(session.user)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { id: userId } = await params

    // Fetch user's projects
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select(`
        id,
        name,
        task_label,
        created_at,
        tasks(count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Transform projects to include task counts
    const projectsWithCounts = (projects || []).map((project: any) => ({
      ...project,
      task_count: project.tasks?.length || 0
    }))

    return NextResponse.json({ projects: projectsWithCounts })

  } catch (error) {
    console.error('Error fetching user projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user projects' },
      { status: 500 }
    )
  }
}

