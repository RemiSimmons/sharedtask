#!/bin/bash

# SharedTask Email Configuration Helper
# Run this script to set up your email environment variables

echo "🔧 SharedTask Email Configuration Setup"
echo "======================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from env.example..."
    cp env.example .env.local
    echo "✅ .env.local created"
else
    echo "📄 Found existing .env.local"
fi

echo ""
echo "📧 Email Configuration Required:"
echo ""

# Get EMAIL_REPLY_TO
echo "1. Setting support ticket destination email..."
EMAIL_REPLY_TO="contact@remisimmons.com"
echo "   ✅ Tickets will be sent to: $EMAIL_REPLY_TO"

# Get RESEND_API_KEY
echo ""
echo "2. What's your Resend API key?"
echo "   (Get this from https://resend.com/api-keys)"
echo "   (Should start with 're_')"
read -p "   Enter API key: " RESEND_API_KEY

# Validate API key format
if [[ ! "$RESEND_API_KEY" =~ ^re_ ]]; then
    echo "⚠️  Warning: API key should start with 're_'"
fi

echo ""
echo "📝 Updating .env.local..."

# Update or add EMAIL_REPLY_TO
if grep -q "EMAIL_REPLY_TO=" .env.local; then
    sed -i.bak "s/EMAIL_REPLY_TO=.*/EMAIL_REPLY_TO=$EMAIL_REPLY_TO/" .env.local
else
    echo "EMAIL_REPLY_TO=$EMAIL_REPLY_TO" >> .env.local
fi

# Update or add EMAIL_FROM
if grep -q "EMAIL_FROM=" .env.local; then
    sed -i.bak "s/EMAIL_FROM=.*/EMAIL_FROM=SharedTask Support <support@sharedtask.ai>/" .env.local
else
    echo "EMAIL_FROM=SharedTask Support <support@sharedtask.ai>" >> .env.local
fi

# Update RESEND_API_KEY
if grep -q "RESEND_API_KEY=" .env.local; then
    sed -i.bak "s/RESEND_API_KEY=.*/RESEND_API_KEY=$RESEND_API_KEY/" .env.local
else
    echo "RESEND_API_KEY=$RESEND_API_KEY" >> .env.local
fi

# Clean up backup file
rm -f .env.local.bak

echo "✅ Email configuration updated!"
echo ""
echo "📋 Summary:"
echo "   EMAIL_REPLY_TO: $EMAIL_REPLY_TO"
echo "   EMAIL_FROM: SharedTask Support <support@sharedtask.ai>"
echo "   RESEND_API_KEY: ${RESEND_API_KEY:0:8}..."
echo ""
echo "🚀 Next Steps:"
echo "   1. Verify domain 'sharedtask.ai' in Resend dashboard"
echo "   2. Add DNS records for email verification"
echo "   3. Test the system: npm run dev"
echo "   4. Visit http://localhost:3000/support to test"
echo ""
echo "📖 For detailed setup instructions, see:"
echo "   EMAIL_SETUP_GUIDE.md"
echo ""
echo "🎉 Email system ready for testing!"
