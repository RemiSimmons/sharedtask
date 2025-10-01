import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Count user's projects
    const { count, error } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Error counting projects:', error)
      throw new Error('Failed to count projects')
    }

    return NextResponse.json({ count: count || 0 })

  } catch (error) {
    console.error('Project count API error:', error)
    
    return NextResponse.json(
      { error: 'Failed to get project count' },
      { status: 500 }
    )
  }
}
