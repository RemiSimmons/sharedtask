import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    return NextResponse.json({ 
      status: 'ok', 
      message: 'POST request received',
      body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Failed to parse request body',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    )
  }
}

