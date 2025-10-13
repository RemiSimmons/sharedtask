import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserSubscriptionState, getPlanLimits, isProjectExpired } from '@/lib/subscription-service'
import bcrypt from 'bcryptjs'
import { projectSchema } from '@/lib/validation'
import { validateRequest } from '@/lib/validation-middleware'
import { sanitizeInput } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    console.log('=== PROJECT CREATION DEBUG START ===')
    const session = await auth()
    console.log('Session check:', { hasSession: !!session, userId: session?.user?.id, email: session?.user?.email })
    
    if (!session?.user?.id) {
      console.log('Authentication failed - no session or user ID')
      return NextResponse.json({ 
        error: 'Authentication required',
        message: 'You must be signed in to create a project.'
      }, { status: 401 })
    }

    // Comprehensive request validation with rate limiting
    console.log('Starting validation...')
    const validation = await validateRequest(request, {
      bodySchema: projectSchema,
      rateLimit: {
        identifier: session.user.id, // Rate limit per user
        maxRequests: 10, // 10 project creation attempts per 15 minutes
        windowMs: 15 * 60 * 1000
      },
      maxBodySize: 2048, // 2KB max for project creation requests
    })

    if (!validation.success) {
      console.log('Validation failed:', validation.response)
      return validation.response
    }
    console.log('Validation passed:', validation.data)

    const { 
      name, 
      taskLabel = 'Task Name', 
      description,
      allowMultipleTasks = false, 
      allowMultipleContributors = false, 
      maxContributorsPerTask,
      allowContributorsAddNames = true,
      allowContributorsAddTasks = true,
      eventLocation,
      eventTime,
      eventAttire,
      contributors = [],
      projectPassword
    } = validation.data.body!

    // Get user's subscription state and limits
    console.log('Getting subscription state...')
    const subscriptionState = await getUserSubscriptionState(session.user.id)
    console.log('Subscription state:', subscriptionState)
    const planLimits = getPlanLimits(subscriptionState)
    console.log('Plan limits:', planLimits)

    // Check current project count and active projects for free tier
    console.log('Checking existing projects...')
    const { data: existingProjects, error: countError } = await supabaseAdmin
      .from('projects')
      .select('id, created_at, name')
      .eq('user_id', session.user.id)

    if (countError) {
      console.error('Error counting projects:', countError)
      return NextResponse.json(
        { error: 'Failed to check project limits. Please try again.' },
        { status: 500 }
      )
    }
    console.log('Existing projects:', existingProjects)

    const currentProjectCount = existingProjects?.length || 0

    // Special handling for free tier - only 1 active project at a time
    if (subscriptionState.accessLevel === 'free') {
      const activeProject = existingProjects?.find((p: any) => 
        !isProjectExpired(p.created_at || new Date().toISOString(), planLimits.projectActiveWindow)
      )
      
      if (activeProject) {
        return NextResponse.json({
          error: 'Free tier project limit reached',
          message: 'Free users can only have 1 active project at a time. You can either upgrade your plan or delete an existing project to create a new one.',
          code: 'FREE_TIER_ACTIVE_PROJECT_LIMIT',
          upgradePrompt: 'multiproject',
          currentActiveProjects: 1,
          maxActiveProjects: 1,
          activeProject: {
            id: activeProject.id,
            name: activeProject.name,
            created_at: activeProject.created_at
          },
          solutions: [
            {
              type: 'upgrade',
              title: 'Upgrade to Pro',
              description: 'Get unlimited active projects and advanced features',
              action: 'upgrade_plan'
            },
            {
              type: 'delete',
              title: 'Delete Existing Project',
              description: `Delete "${activeProject.name}" to create a new project`,
              action: 'delete_project',
              projectId: activeProject.id
            }
          ]
        }, { status: 403 })
      }
    }

    // Check project limits (unless unlimited)
    if (planLimits.maxProjects !== -1 && currentProjectCount >= planLimits.maxProjects) {
      const planName = subscriptionState.plan || 'free'
      const activeProjects = existingProjects?.filter((p: any) => 
        !isProjectExpired(p.created_at || new Date().toISOString(), planLimits.projectActiveWindow)
      ) || []
      
      return NextResponse.json(
        { 
          error: 'Project limit reached',
          message: `Your ${planName} plan allows up to ${planLimits.maxProjects} project${planLimits.maxProjects === 1 ? '' : 's'}. You currently have ${currentProjectCount} projects.`,
          code: 'PROJECT_LIMIT_REACHED',
          currentCount: currentProjectCount,
          maxProjects: planLimits.maxProjects,
          planName,
          activeProjects: activeProjects.map((p: any) => ({
            id: p.id,
            name: p.name,
            created_at: p.created_at
          })),
          solutions: [
            {
              type: 'upgrade',
              title: 'Upgrade Your Plan',
              description: 'Get more projects and advanced features',
              action: 'upgrade_plan'
            },
            {
              type: 'manage',
              title: 'Manage Existing Projects',
              description: 'Delete old projects to make room for new ones',
              action: 'manage_projects'
            }
          ]
        },
        { status: 403 }
      )
    }

    // Validate project password requirements
    let hashedPassword = null
    if (projectPassword) {
      if (!planLimits.hasAdvancedFeatures) {
        return NextResponse.json({
          error: 'Feature not available',
          message: 'Project passwords are only available for Pro and Team plans. Upgrade to use this feature.',
          code: 'FEATURE_REQUIRES_UPGRADE'
        }, { status: 403 })
      }
      
      // Hash the password securely
      hashedPassword = await bcrypt.hash(projectPassword, 12)
    }

    // Sanitize text inputs
    const sanitizedName = sanitizeInput(name)
    const sanitizedTaskLabel = sanitizeInput(taskLabel)
    const sanitizedDescription = description ? sanitizeInput(description) : null
    const sanitizedEventLocation = eventLocation ? sanitizeInput(eventLocation) : null
    const sanitizedEventTime = eventTime ? sanitizeInput(eventTime) : null
    const sanitizedEventAttire = eventAttire ? sanitizeInput(eventAttire) : null

    // Validate contributor limits
    if (maxContributorsPerTask && maxContributorsPerTask > 100) {
      return NextResponse.json({
        error: 'Invalid contributor limit',
        message: 'Maximum contributors per task cannot exceed 100.'
      }, { status: 400 })
    }

    // Create project in database
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .insert({
        user_id: session.user.id,
        name: sanitizedName,
        task_label: sanitizedTaskLabel,
        description: sanitizedDescription,
        event_location: sanitizedEventLocation,
        event_time: sanitizedEventTime,
        event_attire: sanitizedEventAttire,
        admin_password: hashedPassword || 'no_password_set',
        allow_multiple_tasks: allowMultipleTasks,
        allow_multiple_contributors: allowMultipleContributors,
        max_contributors_per_task: maxContributorsPerTask,
        allow_contributors_add_names: allowContributorsAddNames,
        allow_contributors_add_tasks: allowContributorsAddTasks
      })
      .select('id, name, task_label, description, event_location, event_time, event_attire, created_at, allow_multiple_tasks, allow_multiple_contributors, max_contributors_per_task, allow_contributors_add_names, allow_contributors_add_tasks')
      .single()

    if (error) {
      console.error('Database error during project creation:', error)
      
      // Handle specific database errors
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'A project with this name already exists for your account.' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to create project. Please try again.' },
        { status: 500 }
      )
    }

    // Log successful project creation for monitoring
    console.log(`Project created: "${project.name}" by user ${session.user.id}`)

    return NextResponse.json({
      ...project,
      // Add computed fields
      hasPassword: !!hashedPassword,
      planLimits: {
        currentProjects: currentProjectCount + 1,
        maxProjects: planLimits.maxProjects,
        hasAdvancedFeatures: planLimits.hasAdvancedFeatures
      }
    }, { status: 201 })
  } catch (error) {
    console.error('=== PROJECT CREATION ERROR ===')
    console.error('Error type:', typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Full error object:', error)
    console.error('=== END PROJECT CREATION ERROR ===')
    return NextResponse.json(
      { 
        error: 'Internal server error. Please try again later.',
        debug: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
