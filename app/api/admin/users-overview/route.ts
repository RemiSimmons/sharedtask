import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/lib/auth'
import { isAdminUser } from '@/lib/admin'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || !isAdminUser(session.user)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const tierFilter = searchParams.get('tier') || 'all'
    const statusFilter = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''

    // Fetch all users with their subscription and trial data
    let usersQuery = supabaseAdmin
      .from('users')
      .select(`
        id,
        name,
        email,
        email_verified,
        created_at
      `)
      .order('created_at', { ascending: false })

    // Apply search filter
    if (search) {
      usersQuery = usersQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: users, error: usersError } = await usersQuery

    if (usersError) throw usersError

    // Fetch subscriptions
    const { data: subscriptions } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .in('user_id', users?.map(u => u.id) || [])

    const subscriptionMap = new Map(subscriptions?.map(s => [s.user_id, s]) || [])

    // Fetch trials
    const { data: trials } = await supabaseAdmin
      .from('user_trials')
      .select('*')
      .in('user_id', users?.map(u => u.id) || [])

    const trialMap = new Map(trials?.map(t => [t.user_id, t]) || [])

    // Fetch project counts for all users
    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('user_id')
      .in('user_id', users?.map(u => u.id) || [])

    const projectCountMap = new Map<string, number>()
    projects?.forEach(p => {
      projectCountMap.set(p.user_id, (projectCountMap.get(p.user_id) || 0) + 1)
    })

    // Fetch task counts per user
    const { data: tasksData } = await supabaseAdmin
      .from('tasks')
      .select(`
        id,
        project_id
      `)

    const projectIds = projects?.map(p => p.user_id) || []
    const { data: projectDetails } = await supabaseAdmin
      .from('projects')
      .select('id, user_id')
      .in('user_id', projectIds)

    const projectUserMap = new Map(projectDetails?.map(p => [p.id, p.user_id]) || [])
    const taskCountMap = new Map<string, number>()
    
    tasksData?.forEach(t => {
      const userId = projectUserMap.get(t.project_id)
      if (userId) {
        taskCountMap.set(userId, (taskCountMap.get(userId) || 0) + 1)
      }
    })

    // Helper functions
    const getPlanLimits = (tier: string) => {
      switch (tier) {
        case 'free': return { maxProjects: 1, label: 'Free', color: 'gray' }
        case 'basic': return { maxProjects: 5, label: 'Basic', color: 'blue' }
        case 'pro': return { maxProjects: 10, label: 'Pro', color: 'purple' }
        case 'team': return { maxProjects: -1, label: 'Team', color: 'green' }
        default: return { maxProjects: 1, label: 'Free', color: 'gray' }
      }
    }

    const getUserTier = (userId: string) => {
      const subscription = subscriptionMap.get(userId)
      if (subscription && (subscription.status === 'active' || subscription.status === 'trialing')) {
        return subscription.plan
      }
      
      const trial = trialMap.get(userId)
      if (trial && trial.status === 'active') {
        return trial.plan
      }
      
      return 'free'
    }

    const isUserActive = (createdAt: string): boolean => {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return new Date(createdAt) > sevenDaysAgo
    }

    const getStorageLimit = (tier: string): number => {
      switch (tier) {
        case 'free': return 100
        case 'basic': return 500
        case 'pro': return 2000
        case 'team': return 10000
        default: return 100
      }
    }

    // Build enriched user data
    const enrichedUsers = users?.map(user => {
      const tier = getUserTier(user.id)
      const limits = getPlanLimits(tier)
      const projectCount = projectCountMap.get(user.id) || 0
      const taskCount = taskCountMap.get(user.id) || 0

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.email_verified,
        createdAt: user.created_at,
        tier: tier,
        tierLabel: limits.label,
        tierColor: limits.color,
        projectCount: projectCount,
        projectLimit: limits.maxProjects,
        projectUsagePercent: limits.maxProjects === -1 ? 0 : (projectCount / limits.maxProjects) * 100,
        taskCount: taskCount,
        lastActivity: user.created_at,
        isActive: isUserActive(user.created_at),
        subscription: subscriptionMap.get(user.id) || null,
        trial: trialMap.get(user.id) || null,
        storageUsed: 0,
        storageLimit: getStorageLimit(tier),
      }
    }) || []

    // Apply filters
    let filteredUsers = enrichedUsers

    if (tierFilter && tierFilter !== 'all') {
      filteredUsers = filteredUsers.filter(u => u.tier === tierFilter)
    }

    if (statusFilter === 'active') {
      filteredUsers = filteredUsers.filter(u => u.isActive)
    } else if (statusFilter === 'inactive') {
      filteredUsers = filteredUsers.filter(u => !u.isActive)
    }

    // Calculate summary stats
    const stats = {
      total: enrichedUsers.length,
      byTier: {
        free: enrichedUsers.filter(u => u.tier === 'free').length,
        basic: enrichedUsers.filter(u => u.tier === 'basic').length,
        pro: enrichedUsers.filter(u => u.tier === 'pro').length,
        team: enrichedUsers.filter(u => u.tier === 'team').length,
      },
      active: enrichedUsers.filter(u => u.isActive).length,
      inactive: enrichedUsers.filter(u => !u.isActive).length,
    }

    return NextResponse.json({
      users: filteredUsers,
      stats: stats,
    })

  } catch (error) {
    console.error('Error in users overview API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user overview' },
      { status: 500 }
    )
  }
}

