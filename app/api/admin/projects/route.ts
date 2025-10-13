import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { isAdminUser } from '@/lib/admin'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin users see ALL projects across the platform (read-only monitoring)
    // Regular users see only their own projects
    const isAdmin = isAdminUser(session.user)
    
    let query = (isAdmin ? supabaseAdmin : supabase)
      .from('projects')
      .select(`
        id,
        name,
        task_label,
        created_at,
        user_id,
        tasks(count)
      `)
    
    // Regular users: filter by their user_id
    // Admin users: no filter - see all projects
    if (!isAdmin) {
      query = query.eq('user_id', session.user.id)
    }
    
    const { data: projects, error } = await query.order('created_at', { ascending: false })

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

    // For admin users, also fetch user information for each project
    if (isAdmin && projectsWithCounts.length > 0) {
      const userIds = [...new Set(projectsWithCounts.map(p => p.user_id))]
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, name, email')
        .in('id', userIds)
      
      const userMap = new Map(users?.map(u => [u.id, u]) || [])
      
      const projectsWithUserInfo = projectsWithCounts.map(project => ({
        ...project,
        user: userMap.get(project.user_id) || null
      }))
      
      return NextResponse.json({ projects: projectsWithUserInfo, isAdmin: true })
    }

    return NextResponse.json({ projects: projectsWithCounts, isAdmin: false })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
