import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user data
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, email_verified, created_at')
      .eq('id', session.user.id)
      .single()

    if (userError) {
      console.error('Database error fetching user:', userError)
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      )
    }

    // Get user's projects
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('user_id', session.user.id)

    if (projectsError) {
      console.error('Database error fetching projects:', projectsError)
    }

    // Get tasks for user's projects
    let tasks: any[] = []
    if (projects && projects.length > 0) {
      const projectIds = projects.map(p => p.id)
      const { data: tasksData, error: tasksError } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .in('project_id', projectIds)

      if (tasksError) {
        console.error('Database error fetching tasks:', tasksError)
      } else {
        tasks = tasksData || []
      }
    }

    // Prepare export data
    const exportData = {
      user: userData,
      projects: projects || [],
      tasks: tasks,
      exportDate: new Date().toISOString(),
      version: '1.0'
    }

    // Create response with JSON data
    const jsonString = JSON.stringify(exportData, null, 2)
    
    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="account-data-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('Export data error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
