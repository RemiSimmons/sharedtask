import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message, ticketId } = await request.json()

    // Send reply via Resend
    const response = await resend.emails.send({
      from: 'SharedTask Support <support@sharedtask.ai>',
      to: [to],
      subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #2563eb;">SharedTask Support</h2>
            ${ticketId ? `<p style="color: #6b7280;">Ticket ID: ${ticketId}</p>` : ''}
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <div style="white-space: pre-wrap;">${message}</div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
            <p>SharedTask Support Team</p>
            <p>Reply to this email for further assistance</p>
          </div>
        </div>
      `,
      text: message
    })

    return NextResponse.json({ success: true, messageId: response.data?.id })
  } catch (error) {
    console.error('Error sending support reply:', error)
    return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 })
  }
}
