import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserSubscriptionState, getPlanLimits } from '@/lib/subscription-service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Get user's subscription state and limits
    const subscriptionState = await getUserSubscriptionState(session.user.id)
    const planLimits = getPlanLimits(subscriptionState)

    // Get project count
    const { data: projects, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, created_at')
      .eq('user_id', session.user.id)

    if (projectError) {
      console.error('Error fetching projects:', projectError)
      return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 })
    }

    // Get task count from all user's projects
    const projectIds = projects?.map((p: any) => p.id) || []
    let taskCount = 0
    
    if (projectIds.length > 0) {
      const { data: tasks, error: taskError } = await supabaseAdmin
        .from('tasks')
        .select('id')
        .in('project_id', projectIds)

      if (!taskError) {
        taskCount = tasks?.length || 0
      }
    }

    // Calculate active projects (not expired)
    const activeProjects = projects?.filter(p => {
      const createdDate = new Date(p.created_at || new Date())
      const expiryDate = new Date(createdDate)
      expiryDate.setDate(expiryDate.getDate() + planLimits.projectActiveWindow)
      return new Date() <= expiryDate
    }) || []

    return NextResponse.json({
      subscription: {
        plan: subscriptionState.plan || 'free',
        accessLevel: subscriptionState.accessLevel,
        hasActiveTrial: subscriptionState.hasActiveTrial,
        hasActiveSubscription: subscriptionState.hasActiveSubscription,
        trialDaysRemaining: subscriptionState.trialDaysRemaining
      },
      usage: {
        projects: {
          total: projects?.length || 0,
          active: activeProjects.length,
          max: planLimits.maxProjects
        },
        tasks: {
          total: taskCount,
          // For now, we'll use a monthly estimate
          thisMonth: Math.min(taskCount, 100), // Rough estimate
          max: planLimits.maxContributors * 10 // Rough calculation
        },
        storage: {
          used: Math.floor(Math.random() * 50), // Placeholder - would need actual calculation
          max: 100 // MB
        }
      },
      limits: planLimits
    })

  } catch (error) {
    console.error('Usage data error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      debug: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
