import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// GET - Get project details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single()

    if (error) {
      console.error('Project fetch error:', error)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete project and all related data
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Delete in correct order due to foreign key constraints
    // 1. Delete task comments
    const { error: commentsError } = await supabase
      .from('task_comments')
      .delete()
      .in('task_id', 
        await supabase
          .from('tasks')
          .select('id')
          .eq('project_id', id)
          .then(({ data }) => data?.map(t => t.id) || [])
      )

    if (commentsError) {
      console.error('Comments deletion error:', commentsError)
    }

    // 2. Delete task assignments
    const { error: assignmentsError } = await supabase
      .from('task_assignments')
      .delete()
      .in('task_id',
        await supabase
          .from('tasks')
          .select('id')
          .eq('project_id', id)
          .then(({ data }) => data?.map(t => t.id) || [])
      )

    if (assignmentsError) {
      console.error('Assignments deletion error:', assignmentsError)
    }

    // 3. Delete tasks
    const { error: tasksError } = await supabase
      .from('tasks')
      .delete()
      .eq('project_id', id)

    if (tasksError) {
      console.error('Tasks deletion error:', tasksError)
      return NextResponse.json({ error: 'Failed to delete tasks' }, { status: 500 })
    }

    // 4. Delete project
    const { error: projectDeleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)

    if (projectDeleteError) {
      console.error('Project deletion error:', projectDeleteError)
      return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Project deleted successfully',
      deletedProject: project.name 
    })
  } catch (error) {
    console.error('Delete API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


