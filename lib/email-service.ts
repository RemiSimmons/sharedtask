import { supabaseAdmin } from './supabase'
import { InsertEmailLog, EmailType, UserTrial, User } from '@/types/database'
import { getDaysUntilTrialEnd } from './subscription-service'

// Email configuration - in production, use environment variables
const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'SharedTask <support@sharedtask.ai>',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@sharedtask.ai',
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

// Email templates
const EMAIL_TEMPLATES = {
  trial_day_5: {
    subject: '5 days left in your SharedTask trial',
    getHtml: (data: { userName: string; plan: string; trialEndDate: string; subscribeUrl: string }) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>5 days left in your trial</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="${EMAIL_CONFIG.baseUrl}/shared-task-logo.svg" alt="SharedTask" style="height: 60px;">
          </div>
          
          <h1 style="color: #2563eb; margin-bottom: 20px;">5 days left in your trial</h1>
          
          <p>Hi ${data.userName},</p>
          
          <p>Your SharedTask ${data.plan} trial is going great! You have <strong>5 days left</strong> to explore all the features.</p>
          
          <p>Your trial ends on <strong>${new Date(data.trialEndDate).toLocaleDateString()}</strong>.</p>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e293b;">Don't lose access to:</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Unlimited tasks and contributors</li>
              <li>Advanced project templates</li>
              <li>Priority support</li>
              <li>Export options</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.subscribeUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Subscribe Now</a>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">
            Questions? Reply to this email or visit our <a href="${EMAIL_CONFIG.baseUrl}/support" style="color: #2563eb;">support center</a>.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            SharedTask | The easiest collaboration tool<br>
            <a href="${EMAIL_CONFIG.baseUrl}/unsubscribe" style="color: #94a3b8;">Unsubscribe</a>
          </p>
        </body>
      </html>
    `,
    getText: (data: { userName: string; plan: string; trialEndDate: string; subscribeUrl: string }) => `
Hi ${data.userName},

Your SharedTask ${data.plan} trial is going great! You have 5 days left to explore all the features.

Your trial ends on ${new Date(data.trialEndDate).toLocaleDateString()}.

Don't lose access to:
- Unlimited tasks and contributors
- Advanced project templates  
- Priority support
- Export options

Subscribe now: ${data.subscribeUrl}

Questions? Reply to this email or visit ${EMAIL_CONFIG.baseUrl}/support

SharedTask | The easiest collaboration tool
    `
  },
  
  trial_day_14: {
    subject: 'Trial ends today - Subscribe to keep your access',
    getHtml: (data: { userName: string; plan: string; trialEndDate: string; subscribeUrl: string }) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Trial ends today</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="${EMAIL_CONFIG.baseUrl}/shared-task-logo.svg" alt="SharedTask" style="height: 60px;">
          </div>
          
          <h1 style="color: #dc2626; margin-bottom: 20px;">⏰ Trial ends today</h1>
          
          <p>Hi ${data.userName},</p>
          
          <p>Your SharedTask ${data.plan} trial ends <strong>today</strong> (${new Date(data.trialEndDate).toLocaleDateString()}).</p>
          
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #dc2626;">⚠️ Action Required</h3>
            <p style="margin-bottom: 0;">Subscribe now to keep your projects and maintain access to all features. After today, your account will be downgraded to the free plan.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.subscribeUrl}" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">Subscribe Now - Don't Lose Access</a>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">
            Need help choosing a plan? Reply to this email or visit our <a href="${EMAIL_CONFIG.baseUrl}/support" style="color: #2563eb;">support center</a>.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            SharedTask | The easiest collaboration tool<br>
            <a href="${EMAIL_CONFIG.baseUrl}/unsubscribe" style="color: #94a3b8;">Unsubscribe</a>
          </p>
        </body>
      </html>
    `,
    getText: (data: { userName: string; plan: string; trialEndDate: string; subscribeUrl: string }) => `
Hi ${data.userName},

⏰ TRIAL ENDS TODAY

Your SharedTask ${data.plan} trial ends today (${new Date(data.trialEndDate).toLocaleDateString()}).

⚠️ ACTION REQUIRED
Subscribe now to keep your projects and maintain access to all features. After today, your account will be downgraded to the free plan.

Subscribe now: ${data.subscribeUrl}

Need help choosing a plan? Reply to this email or visit ${EMAIL_CONFIG.baseUrl}/support

SharedTask | The easiest collaboration tool
    `
  }
}

/**
 * Send email using the configured email service
 * In production, integrate with SendGrid, Mailgun, AWS SES, etc.
 */
async function sendEmail(to: string, subject: string, html: string, text: string): Promise<void> {
  // For development/demo purposes, we'll log the email
  // In production, replace this with actual email service integration
  
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Email would be sent:')
    console.log('To:', to)
    console.log('Subject:', subject)
    console.log('HTML:', html)
    console.log('Text:', text)
    return
  }

  // Example integration with a hypothetical email service
  // Replace this with your actual email service (SendGrid, etc.)
  try {
    // const response = await fetch('https://api.emailservice.com/send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.EMAIL_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     from: EMAIL_CONFIG.from,
    //     to,
    //     subject,
    //     html,
    //     text
    //   })
    // })
    
    // if (!response.ok) {
    //   throw new Error(`Email service error: ${response.statusText}`)
    // }
    
    // For now, just log that we would send the email
    console.log(`Email would be sent to ${to}: ${subject}`)
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

/**
 * Log email attempt to database
 */
async function logEmail(
  userId: string, 
  emailType: EmailType, 
  recipientEmail: string, 
  subject: string, 
  status: 'sent' | 'failed', 
  errorMessage?: string,
  trialId?: string,
  subscriptionId?: string
): Promise<void> {
  try {
    const emailLogData: InsertEmailLog = {
      user_id: userId,
      email_type: emailType,
      recipient_email: recipientEmail,
      subject,
      status,
      error_message: errorMessage || null,
      trial_id: trialId || null,
      subscription_id: subscriptionId || null
    }

    const { error } = await supabaseAdmin
      .from('email_logs')
      .insert(emailLogData)

    if (error) {
      console.error('Error logging email:', error)
      // Don't throw here - logging failure shouldn't break email sending
    }
  } catch (error) {
    console.error('Error in logEmail:', error)
    // Don't throw here - logging failure shouldn't break email sending
  }
}

/**
 * Send trial reminder email
 */
export async function sendTrialReminderEmail(
  user: User, 
  trial: UserTrial, 
  reminderType: 'day_5' | 'day_14'
): Promise<void> {
  try {
    const emailType: EmailType = reminderType === 'day_5' ? 'trial_day_5' : 'trial_day_14'
    const template = EMAIL_TEMPLATES[emailType]
    
    // Generate subscribe URL with plan and billing info
    const subscribeUrl = `${EMAIL_CONFIG.baseUrl}/pricing?plan=${trial.plan}&billing=monthly&utm_source=email&utm_campaign=${emailType}`
    
    const emailData = {
      userName: user.name,
      plan: trial.plan.charAt(0).toUpperCase() + trial.plan.slice(1), // Capitalize plan name
      trialEndDate: trial.ends_at,
      subscribeUrl
    }

    const subject = template.subject
    const html = template.getHtml(emailData)
    const text = template.getText(emailData)

    // Send the email
    await sendEmail(user.email, subject, html, text)
    
    // Log successful send
    await logEmail(
      user.id, 
      emailType, 
      user.email, 
      subject, 
      'sent',
      undefined,
      trial.id
    )
    
    console.log(`✅ Sent ${emailType} email to ${user.email}`)
  } catch (error) {
    console.error(`Error sending ${reminderType} reminder email:`, error)
    
    // Log failed send
    await logEmail(
      user.id, 
      reminderType === 'day_5' ? 'trial_day_5' : 'trial_day_14', 
      user.email, 
      EMAIL_TEMPLATES[reminderType === 'day_5' ? 'trial_day_5' : 'trial_day_14'].subject, 
      'failed',
      error instanceof Error ? error.message : 'Unknown error',
      trial.id
    )
    
    throw error
  }
}

/**
 * Send subscription welcome email
 */
export async function sendSubscriptionWelcomeEmail(
  user: User,
  subscription: { plan: string; interval: string }
): Promise<void> {
  try {
    const subject = `Welcome to SharedTask ${subscription.plan}!`
    const manageUrl = `${EMAIL_CONFIG.baseUrl}/account/billing`
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to SharedTask</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="${EMAIL_CONFIG.baseUrl}/shared-task-logo.svg" alt="SharedTask" style="height: 60px;">
          </div>
          
          <h1 style="color: #059669; margin-bottom: 20px;">🎉 Welcome to SharedTask ${subscription.plan}!</h1>
          
          <p>Hi ${user.name},</p>
          
          <p>Thank you for subscribing to SharedTask ${subscription.plan} (${subscription.interval})! Your subscription is now active.</p>
          
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #059669;">What's next?</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Create unlimited projects</li>
              <li>Invite team members</li>
              <li>Use advanced features</li>
              <li>Get priority support</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${EMAIL_CONFIG.baseUrl}/app" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block; margin-right: 10px;">Get Started</a>
            <a href="${manageUrl}" style="background: #f8fafc; color: #475569; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block; border: 1px solid #e2e8f0;">Manage Billing</a>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">
            Questions? Reply to this email or visit our <a href="${EMAIL_CONFIG.baseUrl}/support" style="color: #2563eb;">support center</a>.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            SharedTask | The easiest collaboration tool<br>
            <a href="${manageUrl}" style="color: #94a3b8;">Manage subscription</a>
          </p>
        </body>
      </html>
    `
    
    const text = `
Hi ${user.name},

🎉 Welcome to SharedTask ${subscription.plan}!

Thank you for subscribing to SharedTask ${subscription.plan} (${subscription.interval})! Your subscription is now active.

What's next?
- Create unlimited projects
- Invite team members  
- Use advanced features
- Get priority support

Get started: ${EMAIL_CONFIG.baseUrl}/app
Manage billing: ${manageUrl}

Questions? Reply to this email or visit ${EMAIL_CONFIG.baseUrl}/support

SharedTask | The easiest collaboration tool
    `

    await sendEmail(user.email, subject, html, text)
    
    await logEmail(
      user.id,
      'subscription_welcome',
      user.email,
      subject,
      'sent'
    )
    
    console.log(`✅ Sent welcome email to ${user.email}`)
  } catch (error) {
    console.error('Error sending welcome email:', error)
    
    await logEmail(
      user.id,
      'subscription_welcome',
      user.email,
      `Welcome to SharedTask ${subscription.plan}!`,
      'failed',
      error instanceof Error ? error.message : 'Unknown error'
    )
    
    throw error
  }
}

/**
 * Check if we've already sent a specific email type to a user recently (prevent duplicates)
 */
export async function hasRecentEmail(
  userId: string, 
  emailType: EmailType, 
  hoursAgo: number = 24
): Promise<boolean> {
  try {
    const cutoffTime = new Date()
    cutoffTime.setHours(cutoffTime.getHours() - hoursAgo)

    const { data, error } = await supabaseAdmin
      .from('email_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('email_type', emailType)
      .eq('status', 'sent')
      .gte('sent_at', cutoffTime.toISOString())
      .limit(1)

    if (error) {
      console.error('Error checking recent emails:', error)
      return false // Err on the side of sending email
    }

    return (data?.length || 0) > 0
  } catch (error) {
    console.error('Error in hasRecentEmail:', error)
    return false // Err on the side of sending email
  }
}
