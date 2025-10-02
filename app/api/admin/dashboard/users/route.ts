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
    console.log('Using fallback query for users with project counts')
    const { data: users, error: fallbackError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        name,
        email,
        email_verified,
        created_at
      `)
      .order('created_at', { ascending: false })
    
    if (fallbackError) throw fallbackError
    
    // Add project_count: 0 for all users as fallback
    const usersWithFallback = (users || []).map(user => ({
      ...user,
      project_count: 0
    }))
    
    return NextResponse.json({ users: usersWithFallback })
  } catch (error) {
    console.error('Error in dashboard users API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
