import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Only require service key in production or when explicitly needed
if (!supabaseServiceKey && process.env.NODE_ENV === 'production') {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is missing - admin operations will be limited')
}

// Client for browser/public operations
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  }
})

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl, 
  supabaseServiceKey || supabaseAnonKey, // Fallback to anon key in development
  {
    auth: {
      persistSession: false,
    }
  }
)

// Helper to check if we have proper admin access
export const hasAdminAccess = () => !!supabaseServiceKey

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any, context: string) {
  console.error(`Supabase error in ${context}:`, error)
  throw new Error(`Database error: ${error.message || 'Unknown error'}`)
}

// Note: getOrCreateDefaultProject function removed to improve UX and security
// Users must now create projects through the proper UI flow with subscription limits

