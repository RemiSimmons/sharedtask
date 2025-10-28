#!/usr/bin/env node

/**
 * Google OAuth Configuration Diagnostic Tool
 * Run this to check if your environment is properly configured
 * 
 * Usage: node -r dotenv/config diagnose-oauth.js
 * Or: node diagnose-oauth.js (if .env.local is already loaded)
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Google OAuth Configuration Diagnostic\n')
console.log('=' .repeat(50))

// Try to load .env.local manually since we might not have dotenv
const envPath = path.join(__dirname, '.env.local')
if (fs.existsSync(envPath)) {
  console.log('📁 Found .env.local file\n')
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim()
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  })
} else {
  console.log('⚠️  No .env.local file found!')
  console.log('📝 Create one by copying env.example:')
  console.log('   cp env.example .env.local\n')
}

let hasErrors = false

// Check 1: NEXTAUTH_URL
console.log('\n1️⃣  Checking NEXTAUTH_URL...')
const nextauthUrl = process.env.NEXTAUTH_URL
if (!nextauthUrl) {
  console.log('   ❌ NEXTAUTH_URL is not set')
  console.log('   📝 Add to .env.local: NEXTAUTH_URL=http://localhost:3000')
  hasErrors = true
} else if (nextauthUrl !== 'http://localhost:3000') {
  console.log(`   ⚠️  NEXTAUTH_URL is: ${nextauthUrl}`)
  console.log('   📝 For development, it should be: http://localhost:3000')
  hasErrors = true
} else {
  console.log(`   ✅ NEXTAUTH_URL is correctly set: ${nextauthUrl}`)
}

// Check 2: NEXTAUTH_SECRET
console.log('\n2️⃣  Checking NEXTAUTH_SECRET...')
const nextauthSecret = process.env.NEXTAUTH_SECRET
if (!nextauthSecret) {
  console.log('   ❌ NEXTAUTH_SECRET is not set')
  console.log('   📝 Generate one with: openssl rand -base64 32')
  console.log('   📝 Add to .env.local: NEXTAUTH_SECRET=your_generated_secret')
  hasErrors = true
} else if (nextauthSecret.length < 32) {
  console.log('   ⚠️  NEXTAUTH_SECRET is too short (should be 32+ characters)')
  console.log('   📝 Generate a stronger one with: openssl rand -base64 32')
  hasErrors = true
} else {
  console.log('   ✅ NEXTAUTH_SECRET is set (length: ' + nextauthSecret.length + ' chars)')
}

// Check 3: GOOGLE_CLIENT_ID
console.log('\n3️⃣  Checking GOOGLE_CLIENT_ID...')
const googleClientId = process.env.GOOGLE_CLIENT_ID
if (!googleClientId) {
  console.log('   ❌ GOOGLE_CLIENT_ID is not set')
  console.log('   📝 Get this from: https://console.cloud.google.com/apis/credentials')
  console.log('   📝 Add to .env.local: GOOGLE_CLIENT_ID=your_client_id')
  hasErrors = true
} else if (googleClientId.includes('your_google') || googleClientId.includes('placeholder')) {
  console.log('   ❌ GOOGLE_CLIENT_ID is still a placeholder')
  console.log('   📝 Replace with actual Client ID from Google Cloud Console')
  hasErrors = true
} else if (!googleClientId.endsWith('.apps.googleusercontent.com')) {
  console.log('   ⚠️  GOOGLE_CLIENT_ID format looks incorrect')
  console.log(`   📝 Current value: ${googleClientId}`)
  console.log('   📝 Should end with: .apps.googleusercontent.com')
  hasErrors = true
} else {
  console.log('   ✅ GOOGLE_CLIENT_ID is set')
  console.log(`   📝 Value: ${googleClientId.substring(0, 20)}...`)
}

// Check 4: GOOGLE_CLIENT_SECRET
console.log('\n4️⃣  Checking GOOGLE_CLIENT_SECRET...')
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
if (!googleClientSecret) {
  console.log('   ❌ GOOGLE_CLIENT_SECRET is not set')
  console.log('   📝 Get this from: https://console.cloud.google.com/apis/credentials')
  console.log('   📝 Add to .env.local: GOOGLE_CLIENT_SECRET=your_client_secret')
  hasErrors = true
} else if (googleClientSecret.includes('your_google') || googleClientSecret.includes('placeholder')) {
  console.log('   ❌ GOOGLE_CLIENT_SECRET is still a placeholder')
  console.log('   📝 Replace with actual Client Secret from Google Cloud Console')
  hasErrors = true
} else {
  console.log('   ✅ GOOGLE_CLIENT_SECRET is set')
  console.log('   📝 Length: ' + googleClientSecret.length + ' characters')
}

// Check 5: Supabase (should already be set)
console.log('\n5️⃣  Checking Supabase configuration...')
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.log('   ⚠️  NEXT_PUBLIC_SUPABASE_URL is not set')
  hasErrors = true
} else {
  console.log('   ✅ NEXT_PUBLIC_SUPABASE_URL is set')
}

if (!supabaseAnonKey) {
  console.log('   ⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
  hasErrors = true
} else {
  console.log('   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set')
}

if (!supabaseServiceRole) {
  console.log('   ⚠️  SUPABASE_SERVICE_ROLE_KEY is not set')
  hasErrors = true
} else {
  console.log('   ✅ SUPABASE_SERVICE_ROLE_KEY is set')
}

// Summary
console.log('\n' + '=' .repeat(50))
if (hasErrors) {
  console.log('\n❌ Configuration Issues Found\n')
  console.log('Please fix the issues above and then:')
  console.log('1. Make sure all changes are saved to .env.local')
  console.log('2. Restart your development server')
  console.log('3. Run this diagnostic again: node diagnose-oauth.js')
  console.log('\n📖 For detailed help, see: GOOGLE_OAUTH_TROUBLESHOOTING.md')
  process.exit(1)
} else {
  console.log('\n✅ All Configuration Checks Passed!\n')
  console.log('Your environment variables are properly configured.')
  console.log('\nNext steps:')
  console.log('1. Make sure you\'ve configured Google Cloud Console:')
  console.log('   - Add redirect URI: http://localhost:3000/api/auth/callback/google')
  console.log('   - Configure OAuth consent screen')
  console.log('2. Restart your dev server if not already running')
  console.log('3. Visit: http://localhost:3000/auth/signin')
  console.log('4. Click "Continue with Google"')
  console.log('\n📖 Full setup guide: GOOGLE_OAUTH_SETUP.md')
  process.exit(0)
}

