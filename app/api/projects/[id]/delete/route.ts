import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { validateRequest } from '@/lib/validation-middleware'
import { z } from 'zod'

const uuidSchema = z.string().uuid('Invalid ID format')

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const params = await context.params
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Authentication required',
        message: 'You must be signed in to delete a project.'
      }, { status: 401 })
    }

    // Validate project ID
    const validation = await validateRequest(request, {
      urlParams: params,
      urlParamsSchema: z.object({ id: uuidSchema }),
      rateLimit: {
        identifier: session.user.id,
        maxRequests: 20, // Allow more deletions than creations
        windowMs: 15 * 60 * 1000
      }
    })

    if (!validation.success) {
      return validation.response
    }

    const projectId = params.id

    // First, verify the project exists and belongs to the user
    const { data: project, error: fetchError } = await supabaseAdmin
      .from('projects')
      .select('id, name, user_id')
      .eq('id', projectId)
      .eq('user_id', session.user.id)
      .single()

    if (fetchError || !project) {
      return NextResponse.json({
        error: 'Project not found',
        message: 'The project does not exist or you do not have permission to delete it.'
      }, { status: 404 })
    }

    // Delete the project (this will cascade delete tasks, assignments, and comments)
    const { error: deleteError } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', session.user.id) // Double-check ownership

    if (deleteError) {
      console.error('Error deleting project:', deleteError)
      return NextResponse.json({
        error: 'Failed to delete project',
        message: 'An error occurred while deleting the project. Please try again.'
      }, { status: 500 })
    }

    // Log successful deletion for monitoring
    console.log(`Project deleted: "${project.name}" (${projectId}) by user ${session.user.id}`)

    return NextResponse.json({
      success: true,
      message: `Project "${project.name}" has been successfully deleted.`,
      deletedProject: {
        id: project.id,
        name: project.name
      }
    })

  } catch (error) {
    console.error('Project deletion error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.',
      debug: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
