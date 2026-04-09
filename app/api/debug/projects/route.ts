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

    // Get all user's projects
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('id, name, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    const projectsWithStatus = projects?.map((project: any) => ({
      ...project,
      isExpired: false,
      daysOld: Math.floor((new Date().getTime() - new Date(project.created_at || new Date()).getTime()) / (1000 * 60 * 60 * 24))
    })) || []

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      },
      projects: projectsWithStatus,
      activeProjects: projectsWithStatus,
      canCreateProject: true,
      blockingReason: null
    })
  } catch (error) {
    console.error('Debug projects error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      debug: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
