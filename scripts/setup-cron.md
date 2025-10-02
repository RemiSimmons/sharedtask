# Cron Job Setup for SharedTask

This document explains how to set up scheduled jobs for trial reminders and subscription management.

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# Cron job authentication
CRON_SECRET=your-secure-random-string-here

# Email configuration (for production)
EMAIL_FROM="SharedTask <support@sharedtask.ai>"
EMAIL_REPLY_TO="support@sharedtask.ai"
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# Email service API key (replace with your provider)
EMAIL_API_KEY=your-email-service-api-key
```

## Deployment Options

### Option 1: Vercel Cron Jobs (Recommended for Vercel deployments)

Create `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/trial-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

This runs the trial reminder job daily at 9 AM UTC.

### Option 2: External Cron Service (e.g., cron-job.org, EasyCron)

Set up a cron job to POST to your endpoint:

```bash
# URL to call
https://your-domain.com/api/cron/trial-reminders

# Headers
Authorization: Bearer your-cron-secret
Content-Type: application/json

# Method: POST
# Schedule: Daily at 9 AM UTC (0 9 * * *)
```

### Option 3: Server Cron (if self-hosting)

Add to your server's crontab:

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 9 AM)
0 9 * * * curl -X POST -H "Authorization: Bearer your-cron-secret" -H "Content-Type: application/json" https://your-domain.com/api/cron/trial-reminders
```

## Manual Testing

In development, you can test the cron job manually:

```bash
# Test the trial reminder job
curl -X POST http://localhost:3000/api/cron/trial-reminders \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"

# Or use GET in development
curl http://localhost:3000/api/cron/trial-reminders \
  -H "Authorization: Bearer your-cron-secret"
```

## Monitoring

The cron job returns detailed results:

```json
{
  "success": true,
  "results": {
    "day5RemindersSent": 3,
    "day7RemindersSent": 1,
    "trialsExpired": 2,
    "errors": []
  },
  "timestamp": "2024-01-15T09:00:00.000Z"
}
```

Monitor these results to ensure:
- Emails are being sent successfully
- Trials are being expired properly
- No errors are occurring

## Email Service Integration

The current implementation logs emails in development. For production, integrate with your email service:

### SendGrid Example

```typescript
// In lib/email-service.ts, replace the sendEmail function:
async function sendEmail(to: string, subject: string, html: string, text: string): Promise<void> {
  const sgMail = require('@sendgrid/mail')
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)

  const msg = {
    to,
    from: EMAIL_CONFIG.from,
    subject,
    text,
    html,
  }

  await sgMail.send(msg)
}
```

### Other Email Services

- **Mailgun**: Use the Mailgun SDK
- **AWS SES**: Use the AWS SDK
- **Postmark**: Use the Postmark SDK
- **Resend**: Use the Resend SDK

## Security Notes

1. **Protect the cron endpoint**: Always use the `CRON_SECRET` to authenticate requests
2. **Use HTTPS**: Ensure your production deployment uses HTTPS
3. **Rate limiting**: Consider adding rate limiting to prevent abuse
4. **Monitoring**: Set up alerts for failed cron jobs

## Troubleshooting

### Cron job not running
- Check that `CRON_SECRET` is set correctly
- Verify the cron schedule syntax
- Check server logs for errors

### Emails not sending
- Verify email service configuration
- Check email service API key
- Review email logs in the database

### Database errors
- Ensure Supabase connection is working
- Check RLS policies allow service operations
- Verify database schema is up to date

