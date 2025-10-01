import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const projectId = resolvedParams.id

    // Verify user owns this project
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .eq('user_id', session.user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get unique contributors from task assignments
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('task_assignments')
      .select(`
        contributor_name,
        tasks!inner(project_id)
      `)
      .eq('tasks.project_id', projectId)

    if (assignmentsError) {
      console.error('Error getting contributors:', assignmentsError)
      return NextResponse.json(
        { error: 'Failed to get contributor count' },
        { status: 500 }
      )
    }

    // Count unique contributors
    const uniqueContributors = new Set(
      assignments?.map(a => a.contributor_name) || []
    )

    return NextResponse.json({
      projectId,
      contributorCount: uniqueContributors.size,
      contributors: Array.from(uniqueContributors)
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

