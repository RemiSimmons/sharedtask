import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { demoConvertSchema, sanitizeInput } from '@/lib/validation'
import { validateRequest } from '@/lib/validation-middleware'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    // Validate request with rate limiting
    const validation = await validateRequest(request, {
      bodySchema: demoConvertSchema,
      rateLimit: {
        identifier: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous',
        maxRequests: 5, // 5 demo conversions per 15 minutes
        windowMs: 15 * 60 * 1000
      },
      maxBodySize: 102400, // 100KB max for demo data
    })

    if (!validation.success) {
      return validation.response
    }

    let { 
      projectName, 
      taskLabel,
      adminPassword, 
      allowMultipleTasks,
      allowMultipleContributors,
      maxContributorsPerTask,
      allowContributorsAddNames,
      allowContributorsAddTasks,
      demoData 
    } = validation.data.body!

    // Sanitize text inputs
    projectName = sanitizeInput(projectName)
    if (taskLabel) {
      taskLabel = sanitizeInput(taskLabel)
    }

    const { tasks, projectSettings } = demoData

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    // Create project in database with all settings
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: projectName,
        task_label: taskLabel || projectSettings?.taskLabel || 'Task',
        admin_password: hashedPassword,
        allow_multiple_tasks: allowMultipleTasks ?? projectSettings?.allowMultipleTasks ?? false,
        allow_multiple_contributors: allowMultipleContributors ?? projectSettings?.allowMultipleContributors ?? false,
        max_contributors_per_task: maxContributorsPerTask ?? projectSettings?.maxContributorsPerTask ?? null,
        allow_contributors_add_names: allowContributorsAddNames ?? projectSettings?.allowContributorsAddNames ?? true,
        allow_contributors_add_tasks: allowContributorsAddTasks ?? projectSettings?.allowContributorsAddTasks ?? true,
      })
      .select()
      .single()

    if (projectError) {
      console.error('Project creation error:', projectError)
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      )
    }

    // Create tasks
    if (tasks && tasks.length > 0) {
      const tasksToInsert = tasks.map((task: any) => ({
        project_id: project.id,
        name: task.name,
        description: task.description || null,
        status: task.status || 'available'
      }))

      const { data: createdTasks, error: tasksError } = await supabase
        .from('tasks')
        .insert(tasksToInsert)
        .select()

      if (tasksError) {
        console.error('Tasks creation error:', tasksError)
        // Don't fail the whole conversion for task errors
      }

      // Create assignments and comments if tasks were created successfully
      if (createdTasks) {
        const taskIdMap = new Map()
        createdTasks.forEach((dbTask, index) => {
          taskIdMap.set(tasks[index].id, dbTask.id)
        })

        // Create assignments
        const assignmentsToInsert = []
        const commentsToInsert = []

        for (const task of tasks) {
          const dbTaskId = taskIdMap.get(task.id)
          if (!dbTaskId) continue

          // Add assignments
          if (task.claimedBy && task.claimedBy.length > 0) {
            for (const contributor of task.claimedBy) {
              assignmentsToInsert.push({
                task_id: dbTaskId,
                project_id: project.id,
                contributor_name: contributor
              })
            }
          }

          // Add comments
          if (task.comments && task.comments.length > 0) {
            for (const comment of task.comments) {
              commentsToInsert.push({
                task_id: dbTaskId,
                content: comment.text,
                author_name: comment.author,
                created_at: comment.timestamp.toISOString()
              })
            }
          }
        }

        // Insert assignments
        if (assignmentsToInsert.length > 0) {
          const { error: assignmentsError } = await supabase
            .from('task_assignments')
            .insert(assignmentsToInsert)

          if (assignmentsError) {
            console.error('Assignments creation error:', assignmentsError)
          }
        }

        // Insert comments
        if (commentsToInsert.length > 0) {
          const { error: commentsError } = await supabase
            .from('task_comments')
            .insert(commentsToInsert)

          if (commentsError) {
            console.error('Comments creation error:', commentsError)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name
      }
    })
  } catch (error) {
    console.error('Demo conversion error:', error)
    return NextResponse.json(
      { error: 'Internal server error during conversion' },
      { status: 500 }
    )
  }
}


