import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/lib/auth'
import { isAdminUser } from '@/lib/admin'

export async function GET() {
  // Check if user is authenticated and is admin
  const session = await auth()
  
  if (!session || !isAdminUser(session.user)) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 403 }
    )
  }
  try {
    // Fallback to basic query since RPC might not exist
    console.log('Using fallback query for projects with details')
    const { data: projects, error: fallbackError } = await supabaseAdmin
      .from('projects')
      .select(`
          id,
          name,
          created_at,
          user_id,
          users!inner (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })
      
      if (fallbackError) throw fallbackError
      
      // Add default values as fallback
      const projectsWithFallback = (projects || []).map(project => ({
        id: project.id,
        name: project.name,
        user_name: project.users?.name || 'Unknown',
        user_email: project.users?.email || 'Unknown',
        task_count: 0,
        created_at: project.created_at,
        last_activity: project.created_at
      }))
      
    return NextResponse.json({ projects: projectsWithFallback })
  } catch (error) {
    console.error('Error in dashboard projects API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}
