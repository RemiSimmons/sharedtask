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

    // Fetch user details
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch subscription
    const { data: subscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Fetch trial
    const { data: trial } = await supabaseAdmin
      .from('user_trials')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Fetch project count
    const { data: projects, count: projectCount } = await supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    // Fetch task count (through projects)
    const projectIds = projects?.map((p: any) => p.id) || []
    let taskCount = 0
    if (projectIds.length > 0) {
      const { count } = await supabaseAdmin
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projectIds)
      taskCount = count || 0
    }

    // Determine tier
    const getUserTier = () => {
      if (subscription && (subscription.status === 'active' || subscription.status === 'trialing')) {
        return subscription.plan
      }
      if (trial && trial.status === 'active') {
        return trial.plan
      }
      return 'free'
    }

    const tier = getUserTier()
    const getPlanLimits = (tier: string) => {
      switch (tier) {
        case 'free': return { maxProjects: 1, label: 'Free' }
        case 'basic': return { maxProjects: 5, label: 'Basic' }
        case 'pro': return { maxProjects: 10, label: 'Pro' }
        case 'team': return { maxProjects: -1, label: 'Team' }
        default: return { maxProjects: 1, label: 'Free' }
      }
    }

    const limits = getPlanLimits(tier)
    const daysSinceJoined = Math.floor(
      (new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )

    const enrichedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.email_verified,
      createdAt: user.created_at,
      tier: tier,
      tierLabel: limits.label,
      projectCount: projectCount || 0,
      projectLimit: limits.maxProjects,
      taskCount: taskCount,
      storageUsed: 0, // Placeholder
      storageLimit: tier === 'team' ? 10000 : tier === 'pro' ? 2000 : tier === 'basic' ? 500 : 100,
      daysSinceJoined: daysSinceJoined,
      subscription: subscription || null,
      trial: trial || null,
    }

    return NextResponse.json({ user: enrichedUser })

  } catch (error) {
    console.error('Error fetching user details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    )
  }
}

