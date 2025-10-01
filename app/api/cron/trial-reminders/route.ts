import { NextRequest, NextResponse } from 'next/server'
import { 
  getTrialsNeedingReminders, 
  markReminderSent, 
  expireTrials 
} from '@/lib/subscription-service'
import { sendTrialReminderEmail, hasRecentEmail } from '@/lib/email-service'
import { supabaseAdmin } from '@/lib/supabase'

// Verify cron job authentication
function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (!cronSecret) {
    console.error('CRON_SECRET not configured')
    return false
  }
  
  return authHeader === `Bearer ${cronSecret}`
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication for cron job
    if (!verifyCronAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🕐 Starting trial reminder cron job...')

    const results = {
      day5RemindersSent: 0,
      day14RemindersSent: 0,
      trialsExpired: 0,
      errors: [] as string[]
    }

    // Get trials that need reminders
    const { day5Reminders, day7Reminders: day14Reminders } = await getTrialsNeedingReminders()

    console.log(`Found ${day5Reminders.length} trials needing day 5 reminders`)
    console.log(`Found ${day14Reminders.length} trials needing day 14 reminders`)

    // Process day 5 reminders
    for (const trial of day5Reminders) {
      try {
        // Get user details
        const { data: user, error: userError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', trial.user_id!)
          .single()

        if (userError || !user) {
          console.error(`User not found for trial ${trial.id}:`, userError)
          results.errors.push(`User not found for trial ${trial.id}`)
          continue
        }

        // Check if we've already sent this email recently (prevent duplicates)
        const hasRecent = await hasRecentEmail(user.id, 'trial_day_5', 12) // 12 hours
        if (hasRecent) {
          console.log(`Skipping day 5 reminder for ${user.email} - already sent recently`)
          continue
        }

        // Send reminder email
        await sendTrialReminderEmail(user, trial, 'day_5')
        
        // Mark as sent
        await markReminderSent(trial.id, 'day_5')
        
        results.day5RemindersSent++
        console.log(`✅ Sent day 5 reminder to ${user.email}`)
        
      } catch (error) {
        console.error(`Error sending day 5 reminder for trial ${trial.id}:`, error)
        results.errors.push(`Day 5 reminder failed for trial ${trial.id}: ${error}`)
      }
    }

    // Process day 14 reminders
    for (const trial of day14Reminders) {
      try {
        // Get user details
        const { data: user, error: userError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', trial.user_id!)
          .single()

        if (userError || !user) {
          console.error(`User not found for trial ${trial.id}:`, userError)
          results.errors.push(`User not found for trial ${trial.id}`)
          continue
        }

        // Check if we've already sent this email recently (prevent duplicates)
        const hasRecent = await hasRecentEmail(user.id, 'trial_day_14', 12) // 12 hours
        if (hasRecent) {
          console.log(`Skipping day 14 reminder for ${user.email} - already sent recently`)
          continue
        }

        // Send reminder email
        await sendTrialReminderEmail(user, trial, 'day_14')
        
        // Mark as sent
        await markReminderSent(trial.id, 'day_14')
        
        results.day14RemindersSent++
        console.log(`✅ Sent day 14 reminder to ${user.email}`)
        
      } catch (error) {
        console.error(`Error sending day 14 reminder for trial ${trial.id}:`, error)
        results.errors.push(`Day 14 reminder failed for trial ${trial.id}: ${error}`)
      }
    }

    // Expire trials that have passed their end date
    try {
      const expiredCount = await expireTrials()
      results.trialsExpired = expiredCount
      console.log(`✅ Expired ${expiredCount} trials`)
    } catch (error) {
      console.error('Error expiring trials:', error)
      results.errors.push(`Trial expiration failed: ${error}`)
    }

    console.log('🏁 Trial reminder cron job completed:', results)

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Trial reminder cron job failed:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Also support GET for manual testing
export async function GET(request: NextRequest) {
  // Only allow GET in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'GET method only available in development' },
      { status: 405 }
    )
  }

  return POST(request)
}
