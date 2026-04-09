import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
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
        identifier: session.user.id,
        maxRequests: 10,
        windowMs: 15 * 60 * 1000
      },
      maxBodySize: 2048,
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

    // Validate project password requirements
    let hashedPassword = null
    if (projectPassword) {
      hashedPassword = await bcrypt.hash(projectPassword, 12)
    }

    // Sanitize text inputs
    const sanitizedName = sanitizeInput(name)
    const sanitizedTaskLabel = sanitizeInput(taskLabel)
    const sanitizedDescription = description ? sanitizeInput(description) : null
    const sanitizedEventLocation = eventLocation ? sanitizeInput(eventLocation) : null
    const sanitizedEventTime = eventTime ? sanitizeInput(eventTime) : null
    const sanitizedEventAttire = eventAttire ? sanitizeInput(eventAttire) : null

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
      
      if (error.code === '23505') {
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

    console.log(`Project created: "${project.name}" by user ${session.user.id}`)

    return NextResponse.json({
      ...project,
      hasPassword: !!hashedPassword,
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
