import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserSubscriptionState, getPlanLimits, isProjectExpired } from '@/lib/subscription-service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Get user's subscription state
    const subscriptionState = await getUserSubscriptionState(session.user.id)
    const planLimits = getPlanLimits(subscriptionState)

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

    // Check which projects are active vs expired
    const projectsWithStatus = projects?.map(project => ({
      ...project,
      isExpired: isProjectExpired(project.created_at || new Date().toISOString(), planLimits.projectActiveWindow),
      daysOld: Math.floor((new Date().getTime() - new Date(project.created_at || new Date()).getTime()) / (1000 * 60 * 60 * 24))
    })) || []

    const activeProjects = projectsWithStatus.filter(p => !p.isExpired)

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      },
      subscriptionState,
      planLimits,
      projects: projectsWithStatus,
      activeProjects,
      canCreateProject: subscriptionState.accessLevel !== 'free' || activeProjects.length === 0,
      blockingReason: subscriptionState.accessLevel === 'free' && activeProjects.length > 0 
        ? `Free tier allows only 1 active project. You have ${activeProjects.length} active project(s).`
        : null
    })
  } catch (error) {
    console.error('Debug projects error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      debug: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
