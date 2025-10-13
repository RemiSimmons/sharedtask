import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAdminAccess } from '@/lib/admin-access-control'

async function analyticsHandler(request: NextRequest, adminUser: any): Promise<NextResponse> {
  // Admin access is already verified by withAdminAccess wrapper

  try {
    // Get analytics data with time-based queries
    const [
      userGrowthData,
      projectGrowthData,
      taskActivityData,
      userEngagementData,
      platformMetrics
    ] = await Promise.all([
      getUserGrowthData(),
      getProjectGrowthData(),
      getTaskActivityData(),
      getUserEngagementData(),
      getPlatformMetrics()
    ])

    return NextResponse.json({
      userGrowth: userGrowthData,
      projectGrowth: projectGrowthData,
      taskActivity: taskActivityData,
      userEngagement: userEngagementData,
      platformMetrics: platformMetrics,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}

// Export with admin access control
export const GET = withAdminAccess(analyticsHandler, 'analytics.view')

// User growth over time (last 30 days)
async function getUserGrowthData() {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('created_at, email_verified')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true })

  if (error) throw error

  // Group by day
  const dailyGrowth = data.reduce((acc: any, user: any) => {
    const date = new Date(user.created_at || new Date()).toISOString().split('T')[0]
    if (!acc[date]) {
      acc[date] = { total: 0, verified: 0, unverified: 0 }
    }
    acc[date].total += 1
    if (user.email_verified) {
      acc[date].verified += 1
    } else {
      acc[date].unverified += 1
    }
    return acc
  }, {})

  // Convert to array format for charts
  const chartData = Object.entries(dailyGrowth).map(([date, counts]: [string, any]) => ({
    date,
    total: counts.total,
    verified: counts.verified,
    unverified: counts.unverified,
    cumulative: 0 // Will be calculated below
  }))

  // Calculate cumulative totals
  let cumulative = 0
  chartData.forEach(day => {
    cumulative += day.total
    day.cumulative = cumulative
  })

  return chartData
}

// Project creation over time (last 30 days)
async function getProjectGrowthData() {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('created_at, user_id')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true })

  if (error) throw error

  // Group by day
  const dailyProjects = data.reduce((acc: any, project: any) => {
    const date = new Date(project.created_at || new Date()).toISOString().split('T')[0]
    if (!acc[date]) {
      acc[date] = { count: 0, uniqueUsers: new Set() }
    }
    acc[date].count += 1
    acc[date].uniqueUsers.add(project.user_id)
    return acc
  }, {})

  // Convert to chart format
  const chartData = Object.entries(dailyProjects).map(([date, data]: [string, any]) => ({
    date,
    projects: data.count,
    activeUsers: data.uniqueUsers.size
  }))

  return chartData
}

// Task activity data (last 7 days)
async function getTaskActivityData() {
  const { data, error } = await supabaseAdmin
    .from('tasks')
    .select('created_at, status')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true })

  if (error) throw error

  // Group by day and status
  const dailyActivity = data.reduce((acc: any, task: any) => {
    const createdDate = new Date(task.created_at || new Date()).toISOString().split('T')[0]

    // Initialize date
    if (!acc[createdDate]) {
      acc[createdDate] = { created: 0, available: 0, in_progress: 0, completed: 0 }
    }

    // Count all created tasks
    acc[createdDate].created += 1
    
    // Count by status
    if (task.status === 'available') acc[createdDate].available += 1
    else if (task.status === 'in_progress') acc[createdDate].in_progress += 1
    else if (task.status === 'completed') acc[createdDate].completed += 1

    return acc
  }, {})

  // Convert to chart format
  const chartData = Object.entries(dailyActivity).map(([date, counts]: [string, any]) => ({
    date,
    created: counts.created,
    available: counts.available,
    in_progress: counts.in_progress,
    completed: counts.completed
  }))

  return chartData.sort((a, b) => a.date.localeCompare(b.date))
}

// User engagement metrics
async function getUserEngagementData() {
  const [projectsPerUser, tasksPerUser, activeUsers] = await Promise.all([
    // Projects per user
    supabaseAdmin
      .from('projects')
      .select('user_id')
      .then(({ data, error }) => {
        if (error) throw error
        const userCounts = data.reduce((acc: any, project: any) => {
          if (project.user_id) {
            acc[project.user_id] = (acc[project.user_id] || 0) + 1
          }
          return acc
        }, {})
        return Object.values(userCounts) as number[]
      }),

    // Tasks per user (by project ownership - since tasks don't have user assignment)
    supabaseAdmin
      .from('tasks')
      .select('project_id, projects!inner(user_id)')
      .then(({ data, error }) => {
        if (error) throw error
        const userCounts = data.reduce((acc: any, task: any) => {
          const userId = task.projects?.user_id
          if (userId) {
            acc[userId] = (acc[userId] || 0) + 1
          }
          return acc
        }, {})
        return Object.values(userCounts) as number[]
      }),

    // Active users (last 7 days)
    supabaseAdmin
      .from('projects')
      .select('user_id, created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .then(({ data, error }) => {
        if (error) throw error
        return new Set(data.map(p => p.user_id)).size
      })
  ])

  return {
    projectsPerUser: {
      average: projectsPerUser.length > 0 ? projectsPerUser.reduce((a, b) => a + b, 0) / projectsPerUser.length : 0,
      max: projectsPerUser.length > 0 ? Math.max(...projectsPerUser) : 0,
      distribution: projectsPerUser
    },
    tasksPerUser: {
      average: tasksPerUser.length > 0 ? tasksPerUser.reduce((a, b) => a + b, 0) / tasksPerUser.length : 0,
      max: tasksPerUser.length > 0 ? Math.max(...tasksPerUser) : 0,
      distribution: tasksPerUser
    },
    activeUsersLast7Days: activeUsers
  }
}

// Platform-wide metrics
async function getPlatformMetrics() {
  const [totalUsers, totalProjects, totalTasks, completionRate, averageTasksPerProject] = await Promise.all([
    // Total users
    supabaseAdmin
      .from('users')
      .select('id', { count: 'exact' })
      .then(({ count, error }) => {
        if (error) throw error
        return count || 0
      }),

    // Total projects
    supabaseAdmin
      .from('projects')
      .select('id', { count: 'exact' })
      .then(({ count, error }) => {
        if (error) throw error
        return count || 0
      }),

    // Total tasks
    supabaseAdmin
      .from('tasks')
      .select('id', { count: 'exact' })
      .then(({ count, error }) => {
        if (error) throw error
        return count || 0
      }),

    // Task completion rate
    supabaseAdmin
      .from('tasks')
      .select('status')
      .then(({ data, error }) => {
        if (error) throw error
        const completed = data.filter(task => task.status === 'completed').length
        return data.length > 0 ? (completed / data.length) * 100 : 0
      }),

    // Average tasks per project
    supabaseAdmin
      .from('tasks')
      .select('project_id')
      .then(({ data, error }) => {
        if (error) throw error
        const projectCounts = data.reduce((acc: any, task: any) => {
          if (task.project_id) {
            acc[task.project_id] = (acc[task.project_id] || 0) + 1
          }
          return acc
        }, {})
        const counts = Object.values(projectCounts) as number[]
        return counts.length > 0 ? counts.reduce((a, b) => a + b, 0) / counts.length : 0
      })
  ])

  return {
    totalUsers,
    totalProjects,
    totalTasks,
    completionRate: Math.round(completionRate * 100) / 100,
    averageTasksPerProject: Math.round(averageTasksPerProject * 100) / 100
  }
}
