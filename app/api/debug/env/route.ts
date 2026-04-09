import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Debug endpoint only available in development' },
      { status: 403 }
    )
  }

  const requiredEnvVars = [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]

  const optionalEnvVars = [
    'CRON_SECRET',
    'RESEND_API_KEY',
  ]

  const envStatus = {
    required: {} as Record<string, boolean>,
    optional: {} as Record<string, boolean>,
    nodeEnv: process.env.NODE_ENV,
  }

  requiredEnvVars.forEach(key => {
    envStatus.required[key] = !!process.env[key]
  })

  optionalEnvVars.forEach(key => {
    envStatus.optional[key] = !!process.env[key]
  })

  return NextResponse.json(envStatus)
}
