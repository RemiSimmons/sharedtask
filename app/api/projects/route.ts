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
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Authentication required',
        message: 'You must be signed in to create a project.'
      }, { status: 401 })
    }

    // Comprehensive request validation with rate limiting
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
      return validation.response
    }

    const { 
      name, 
      taskLabel = 'Task Name', 
      description,
      allowMultipleTasks = false, 
      allowMultipleContributors = false, 
      maxContributorsPerTask,
      allowContributorsAddNames = true,
      allowContributorsAddTasks = true,
      projectPassword
    } = validation.data.body!

    // Get user's subscription state and limits
    const subscriptionState = await getUserSubscriptionState(session.user.id)
    const planLimits = getPlanLimits(subscriptionState)

    // Check current project count and active projects for free tier
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

    const currentProjectCount = existingProjects?.length || 0

    // Special handling for free tier - only 1 active project at a time
    if (subscriptionState.accessLevel === 'free') {
      const activeProject = existingProjects?.find(p => 
        !isProjectExpired(p.created_at || new Date().toISOString(), planLimits.projectActiveWindow)
      )
      
      if (activeProject) {
        return NextResponse.json({
          error: 'Free tier project limit reached',
          message: 'Free users can only have 1 active project at a time. Upgrade to manage multiple events simultaneously!',
          code: 'FREE_TIER_ACTIVE_PROJECT_LIMIT',
          upgradePrompt: 'multiproject',
          currentActiveProjects: 1,
          maxActiveProjects: 1,
          activeProject: {
            id: activeProject.id,
            name: activeProject.name
          }
        }, { status: 403 })
      }
    }

    // Check project limits (unless unlimited)
    if (planLimits.maxProjects !== -1 && currentProjectCount >= planLimits.maxProjects) {
      const planName = subscriptionState.plan || 'free'
      return NextResponse.json(
        { 
          error: 'Project limit reached',
          message: `Your ${planName} plan allows up to ${planLimits.maxProjects} project${planLimits.maxProjects === 1 ? '' : 's'}. Upgrade to create more projects.`,
          code: 'PROJECT_LIMIT_REACHED',
          currentCount: currentProjectCount,
          maxProjects: planLimits.maxProjects,
          planName
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
        admin_password: hashedPassword || 'no_password_set',
        allow_multiple_tasks: allowMultipleTasks,
        allow_multiple_contributors: allowMultipleContributors,
        max_contributors_per_task: maxContributorsPerTask,
        allow_contributors_add_names: allowContributorsAddNames,
        allow_contributors_add_tasks: allowContributorsAddTasks
      })
      .select('id, name, task_label, description, created_at, allow_multiple_tasks, allow_multiple_contributors, max_contributors_per_task, allow_contributors_add_names, allow_contributors_add_tasks')
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
    console.error('Project creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}
