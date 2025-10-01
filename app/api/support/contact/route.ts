import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { contactSchema } from '@/lib/validation'
import { validateRequest } from '@/lib/validation-middleware'
import { sanitizeInput, sanitizeHtml } from '@/lib/validation'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    // Comprehensive request validation with strict rate limiting for contact forms
    const validation = await validateRequest(request, {
      bodySchema: contactSchema,
      rateLimit: {
        identifier: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous',
        maxRequests: 3, // Only 3 contact form submissions per 15 minutes
        windowMs: 15 * 60 * 1000
      },
      maxBodySize: 4096, // 4KB max for contact form requests
    })

    if (!validation.success) {
      return validation.response
    }

    const { name, email, subject, message } = validation.data.body!

    // Sanitize all inputs to prevent XSS
    const sanitizedName = sanitizeInput(name)
    const sanitizedEmail = email.toLowerCase().trim()
    const sanitizedSubject = sanitizeInput(subject)
    const sanitizedMessage = sanitizeHtml(sanitizeInput(message))

    // Additional spam detection
    const spamKeywords = ['viagra', 'casino', 'lottery', 'bitcoin', 'crypto', 'investment', 'loan', 'mortgage']
    const messageText = sanitizedMessage.toLowerCase()
    const hasSpamContent = spamKeywords.some(keyword => messageText.includes(keyword))
    
    if (hasSpamContent) {
      console.warn(`Potential spam contact form submission from ${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'}: ${sanitizedEmail}`)
      // Return success to not reveal spam detection
      return NextResponse.json(
        { 
          message: 'Support request received successfully',
          ticketId: `ST-${Date.now().toString(36).toUpperCase()}`
        },
        { status: 200 }
      )
    }

    // Detect priority based on content
    const urgentKeywords = ['urgent', 'critical', 'emergency', 'broken', 'down', 'not working', 'error', 'bug']
    const messageWords = messageText.split(' ')
    const urgentWordCount = urgentKeywords.filter(keyword => messageWords.includes(keyword)).length
    
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
    if (urgentWordCount >= 3) {
      priority = 'critical'
    } else if (urgentWordCount >= 2) {
      priority = 'high'
    } else if (urgentWordCount >= 1) {
      priority = 'medium'
    } else {
      priority = 'low'
    }

    // Priority level configuration
    const priorityConfig = {
      low: { emoji: '💬', color: '#10B981', label: 'Low Priority' },
      medium: { emoji: '📋', color: '#F59E0B', label: 'Medium Priority' },
      high: { emoji: '⚠️', color: '#EF4444', label: 'High Priority' },
      critical: { emoji: '🚨', color: '#DC2626', label: 'Critical Priority' }
    }

    const config = priorityConfig[priority]

    // Create support ticket ID
    const ticketId = `ST-${Date.now().toString(36).toUpperCase()}`
    const timestamp = new Date().toISOString()

    // Log contact form submission for monitoring
    console.log(`Contact form submission: ${ticketId} from ${sanitizedEmail} (${priority} priority)`)

    if (!process.env.RESEND_API_KEY) {
      // Log to console if no Resend API key (development)
      console.log('📧 Support Contact Form Submission:')
      console.log('Ticket ID:', ticketId)
      console.log('From:', sanitizedName, `<${sanitizedEmail}>`)
      console.log('Subject:', sanitizedSubject)
      console.log('Priority:', config.label)
      console.log('Message:', sanitizedMessage)
      console.log('IP:', request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown')
      console.log('Timestamp:', timestamp)
      console.log('---')
      
      return NextResponse.json(
        { 
          message: 'Support request received successfully',
          ticketId,
          priority: config.label
        },
        { status: 200 }
      )
    }

    try {
      // Send notification email to support team
      const supportEmailResponse = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'SharedTask Support <contact@remisimmons.com>',
        to: [process.env.EMAIL_REPLY_TO || 'contact@remisimmons.com'],
        subject: `${config.emoji} Support Request: ${sanitizedSubject} [${ticketId}]`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 24px;">New Support Request</h1>
              <p style="color: #6b7280; margin: 5px 0;">Ticket ID: <strong>${ticketId}</strong></p>
            </div>
            
            <div style="background-color: ${config.color}15; border-left: 4px solid ${config.color}; padding: 15px; margin-bottom: 20px;">
              <h3 style="margin: 0; color: ${config.color};">${config.emoji} ${config.label}</h3>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h3 style="color: #374151; margin-bottom: 10px;">Contact Information</h3>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${sanitizedName}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${sanitizedEmail}</p>
              <p style="margin: 5px 0;"><strong>Subject:</strong> ${sanitizedSubject}</p>
              <p style="margin: 5px 0;"><strong>IP Address:</strong> ${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'}</p>
              <p style="margin: 5px 0;"><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h3 style="color: #374151; margin-bottom: 10px;">Message</h3>
              <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; white-space: pre-wrap; max-height: 300px; overflow-y: auto;">${sanitizedMessage}</div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
              <p>This email was sent from the SharedTask support form.</p>
              <p>Please respond to ${sanitizedEmail} to assist the user.</p>
            </div>
          </div>
        `,
      })

      // Send confirmation email to user
      const userEmailResponse = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'SharedTask Support <contact@remisimmons.com>',
        to: [sanitizedEmail],
        subject: `Support Request Received - ${ticketId}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 24px;">Support Request Received</h1>
              <p style="color: #6b7280; margin: 5px 0;">We'll get back to you soon!</p>
            </div>
            
            <div style="background-color: #10b98115; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 20px;">
              <h3 style="margin: 0; color: #10b981;">✅ Your request has been submitted</h3>
            </div>
            
            <p style="color: #374151; line-height: 1.6;">
              Hi ${sanitizedName},
            </p>
            
            <p style="color: #374151; line-height: 1.6;">
              Thank you for contacting SharedTask support. We've received your message and assigned it ticket ID <strong>${ticketId}</strong>.
            </p>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #374151;">Your Request Summary:</h4>
              <p style="margin: 5px 0;"><strong>Subject:</strong> ${sanitizedSubject}</p>
              <p style="margin: 5px 0;"><strong>Priority:</strong> ${config.label}</p>
              <p style="margin: 5px 0;"><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <p style="color: #374151; line-height: 1.6;">
              Our support team will review your request and respond within ${priority === 'critical' ? '2 hours' : priority === 'high' ? '4 hours' : '24 hours'}. ${priority === 'critical' || priority === 'high' ? 'Due to the urgent nature of your request, we\'ll prioritize it accordingly.' : ''}
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}" 
                 style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                Return to SharedTask
              </a>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
              <p>&copy; ${new Date().getFullYear()} SharedTask. All rights reserved.</p>
              <p>If you need immediate assistance, reply to this email.</p>
            </div>
          </div>
        `,
      })

      console.log('✅ Support emails sent successfully')
      console.log(`Support team notification: ${supportEmailResponse.data?.id}`)
      console.log(`User confirmation: ${userEmailResponse.data?.id}`)

      return NextResponse.json(
        { 
          message: 'Support request sent successfully. Check your email for confirmation.',
          ticketId,
          priority: config.label,
          expectedResponse: priority === 'critical' ? '2 hours' : priority === 'high' ? '4 hours' : '24 hours'
        },
        { status: 200 }
      )

    } catch (emailError: any) {
      console.error('❌ Failed to send support emails:', emailError)
      
      // Log the contact form data for manual processing
      console.log('📧 Manual processing required for:', {
        ticketId,
        name: sanitizedName,
        email: sanitizedEmail,
        subject: sanitizedSubject,
        message: sanitizedMessage,
        priority: config.label,
        timestamp,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      })
      
      // Still return success but log the issue
      return NextResponse.json(
        { 
          message: 'Support request received. We will respond via email within 24 hours.',
          ticketId,
          priority: config.label
        },
        { status: 200 }
      )
    }

  } catch (error) {
    console.error('Support contact error:', error)
    return NextResponse.json(
      { error: 'Failed to process support request. Please try again later.' },
      { status: 500 }
    )
  }
}
