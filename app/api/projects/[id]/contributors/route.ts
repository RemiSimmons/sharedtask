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
      assignments?.map((a: any) => a.contributor_name) || []
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

async function requireOwnedProject(projectId: string, userId: string) {
  const { data: project, error } = await supabaseAdmin
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single()

  if (error || !project) {
    return null
  }
  return project
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId } = await params
    const project = await requireOwnedProject(projectId, session.user.id)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await request.json()
    const oldName = typeof body.oldName === 'string' ? body.oldName.trim() : ''
    const newName = typeof body.newName === 'string' ? body.newName.trim() : ''

    if (!oldName || !newName) {
      return NextResponse.json({ error: 'Both names are required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.rpc('rename_project_contributor', {
      p_project_id: projectId,
      p_old_name: oldName,
      p_new_name: newName,
    })

    if (error) {
      if (error.message?.includes('NAME_COLLISION')) {
        return NextResponse.json({ error: 'That name is already on this project' }, { status: 409 })
      }
      console.error('Error renaming contributor:', error)
      return NextResponse.json({ error: 'Failed to rename guest' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId } = await params
    const project = await requireOwnedProject(projectId, session.user.id)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.rpc('remove_project_contributor', {
      p_project_id: projectId,
      p_name: name,
    })

    if (error) {
      console.error('Error removing contributor:', error)
      return NextResponse.json({ error: 'Failed to remove guest' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

