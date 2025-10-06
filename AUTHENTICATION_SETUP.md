# Authentication Setup Guide

This guide explains the simple email/password authentication system implemented for admin users.

## Overview

The authentication system uses NextAuth.js with a credentials provider and bcrypt for password hashing. It's designed to be simple and user-friendly for elderly users.

## Database Changes

### New Tables
- `users` table with `id`, `email`, `password_hash`, `created_at`
- `projects` table now includes `user_id` foreign key

### Updated Schema
Run the updated `database-schema.sql` in your Supabase SQL Editor to add the users table and update the projects table.

## Environment Variables

Add these to your `.env.local` file:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your_nextauth_secret_key_here

# Generate a secret key with: openssl rand -base64 32
```

## User Flow

### For New Users
1. Visit the landing page
2. Click "Create Project" → redirected to signup
3. Fill out simple signup form (email + password, minimum 8 characters)
4. Automatically signed in after successful signup
5. Redirected to admin dashboard

### For Returning Users
1. Visit `/auth/signin` or get redirected when accessing admin routes
2. Enter email and password
3. Redirected to admin dashboard

### Admin Dashboard
- View all user's projects
- Create new projects
- Manage existing projects
- Access project admin views
- Generate shareable contributor links

## Routes

### Public Routes
- `/` - Landing page
- `/demo` - Interactive demo (unchanged)
- `/project/[id]` - Public contributor view (unchanged)
- `/auth/signin` - Sign in form
- `/auth/signup` - Sign up form

### Protected Routes (require authentication)
- `/admin` - Admin dashboard
- `/admin/project/[id]` - Admin project management

## Key Features

### Simple & Clear Design
- Large, readable fonts and buttons
- Clear error messages
- Minimal form fields
- Consistent visual design

### Security
- Passwords hashed with bcrypt (12 salt rounds)
- Session-based authentication
- Protected API routes
- Input validation

### User Experience
- Automatic sign-in after signup
- Clear navigation
- Helpful error messages
- Mobile-responsive design

## API Routes

### Authentication
- `POST /api/auth/signup` - Create new user account
- `GET/POST /api/auth/[...nextauth]` - NextAuth endpoints

### Protected Routes
- `GET /api/admin/projects` - Get user's projects
- `POST /api/projects` - Create new project (requires auth)

## Testing

1. Start the development server: `npm run dev`
2. Visit `http://localhost:3001`
3. Click "Create Project" to test signup flow
4. Create a project and test admin functionality
5. Test the shareable contributor links (still work without auth)

## Migration from Previous System

The demo mode and public contributor access remain unchanged. Only admin/project creation now requires authentication.

Existing shareable links continue to work without requiring users to sign up.









