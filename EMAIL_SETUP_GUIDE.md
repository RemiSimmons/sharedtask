# Email System Setup Guide

## 🎯 Overview

SharedTask uses **Resend** for email delivery with the following email addresses:
- **`support@sharedtask.ai`** - Customer-facing support address (sender)
- **`admin@sharedtask.ai`** - Admin role identification only (not for email)
- **Your personal email** - Where support tickets are forwarded (EMAIL_REPLY_TO)

## 📧 Email Flow Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CUSTOMER      │    │   SYSTEM        │    │   YOU (ADMIN)   │
│                 │    │                 │    │                 │
│ Submits ticket  │───▶│ Sends TO:       │───▶│ Receives at:    │
│ via /support    │    │ EMAIL_REPLY_TO  │    │ your-email@     │
│                 │    │ FROM: support@  │    │ gmail.com       │
│                 │    │ sharedtask.ai   │    │                 │
│                 │◀───│ Admin replies   │◀───│ Uses /admin/    │
│ Receives reply  │    │ FROM: support@  │    │ support to      │
│ from support@   │    │ sharedtask.ai   │    │ send response   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Step 1: Resend Configuration

### A. Domain Setup in Resend

1. **Login to Resend Dashboard**: https://resend.com/domains
2. **Add Domain**: `sharedtask.ai`
3. **Add DNS Records** (in your domain provider):
   ```
   Type: MX
   Name: @
   Value: feedback-smtp.us-east-1.amazonses.com
   Priority: 10

   Type: TXT
   Name: @
   Value: "v=spf1 include:amazonses.com ~all"

   Type: CNAME
   Name: _amazonses.sharedtask.ai
   Value: [Resend will provide this]
   ```
4. **Verify Domain** in Resend dashboard

### B. Get API Key
1. Go to **API Keys** in Resend dashboard
2. Create new key: `SharedTask Production`
3. Copy the key (starts with `re_...`)

## 🔧 Step 2: Environment Variables Setup

### Production Environment (.env.local or deployment platform):

```bash
# Resend Configuration
RESEND_API_KEY=re_your_actual_resend_api_key

# Email Routing - CRITICAL SETUP
EMAIL_FROM=SharedTask Support <support@sharedtask.ai>
EMAIL_REPLY_TO=your-personal-email@gmail.com  # WHERE TICKETS GO

# Other required vars...
NEXTAUTH_URL=https://sharedtask.ai
NEXT_PUBLIC_APP_URL=https://sharedtask.ai
```

### Vercel Environment Variables:
```bash
# In Vercel dashboard > Settings > Environment Variables
RESEND_API_KEY=re_your_actual_key
EMAIL_FROM=SharedTask Support <support@sharedtask.ai>
EMAIL_REPLY_TO=your-personal-email@gmail.com
```

## 📋 Step 3: Testing the Email System

### A. Test Support Ticket Submission
1. Go to: `https://sharedtask.ai/support`
2. Fill out the form as a test customer
3. Submit the ticket
4. **Check your EMAIL_REPLY_TO inbox** for the ticket notification

### B. Test Admin Reply
1. Go to: `https://sharedtask.ai/admin/support`
2. Fill in customer email and compose reply
3. Send the email
4. **Customer should receive email from support@sharedtask.ai**

## 🔍 Step 4: Verification Checklist

- [ ] Domain verified in Resend
- [ ] DNS records added and propagated
- [ ] RESEND_API_KEY set in production
- [ ] EMAIL_FROM configured
- [ ] EMAIL_REPLY_TO set to your email
- [ ] Test ticket submitted successfully
- [ ] Test ticket received in your inbox
- [ ] Test admin reply sent successfully
- [ ] Customer received reply from support@sharedtask.ai

## 🚨 Common Issues & Solutions

### Issue: "Domain not verified"
**Solution**: Check DNS propagation (can take up to 48 hours)
```bash
# Check DNS propagation
dig MX sharedtask.ai
dig TXT sharedtask.ai
```

### Issue: "Emails not being received"
**Solutions**:
1. Check spam/junk folder
2. Verify EMAIL_REPLY_TO is correct
3. Check Resend logs for delivery status
4. Ensure domain is fully verified

### Issue: "Can't send from support@sharedtask.ai"
**Solutions**:
1. Verify domain ownership in Resend
2. Check RESEND_API_KEY is valid
3. Ensure EMAIL_FROM matches verified domain

## 📊 Monitoring & Logs

### Check Email Delivery:
1. **Resend Dashboard**: View delivery logs and bounces
2. **Application Logs**: Check console for email sending attempts
3. **Database**: Check `email_logs` table for sent emails

### Debug Commands:
```bash
# Check environment variables (in production)
echo $RESEND_API_KEY
echo $EMAIL_REPLY_TO

# Test email sending (development)
curl -X POST http://localhost:3000/api/support/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","subject":"Test","message":"Test message"}'
```

## 🎯 Quick Setup Summary

1. **Resend**: Add domain `sharedtask.ai` + DNS records
2. **Environment**: Set `EMAIL_REPLY_TO=your-email@gmail.com`
3. **Test**: Submit ticket → Check your inbox
4. **Verify**: Admin reply → Customer receives from support@

## 🆘 Need Help?

If you encounter issues:
1. Check Resend dashboard for domain status
2. Verify DNS records are correct
3. Test with a simple email first
4. Check application logs for errors

---

**Next Step**: Set your EMAIL_REPLY_TO environment variable and test the system!
