# Admin Security & CORS Setup Guide

## 🔒 Security Implementation Complete!

This guide covers the comprehensive admin security and CORS configuration that has been implemented to secure your SharedTask application.

## ✅ What's Been Implemented

### 1. **Admin Role-Based Access Control**
- ✅ User roles: `user`, `admin`, `super_admin`
- ✅ Permission-based access control system
- ✅ Secure admin authentication middleware
- ✅ Comprehensive audit logging

### 2. **CORS Configuration**
- ✅ Environment-specific CORS policies
- ✅ Preflight request handling
- ✅ Security-focused origin validation
- ✅ Production-ready configuration

### 3. **Secured Admin Endpoints**
- ✅ Error management (`/api/admin/errors`) - Admin+ only
- ✅ System monitoring (`/api/admin/monitoring`) - Admin+ only
- ✅ Analytics (`/api/admin/analytics`) - Admin+ only
- ✅ User management (`/api/admin/users`) - Super Admin only

## 🚀 Setup Instructions

### Step 1: Database Migration

Run the admin role migration in your Supabase SQL Editor:

```bash
# Execute the SQL file
cat add-admin-role-migration.sql
```

This will:
- Add `role` column to users table
- Create `admin_access_logs` table for security auditing
- Set up proper indexes and constraints

### Step 2: Create Your First Admin User

**Option A: Via SQL (Recommended)**
```sql
-- Update an existing user to super_admin
UPDATE users 
SET role = 'super_admin' 
WHERE email = 'your-admin-email@example.com';
```

**Option B: Via API (After Step 1)**
```bash
# First create a regular account, then promote via SQL
```

### Step 3: Environment Configuration

Update your `.env.local` with CORS settings:

```bash
# Add to your .env.local
NODE_ENV=development  # or production

# For production, update the CORS origins in lib/cors-middleware.ts
```

### Step 4: Update Production CORS Origins

Edit `lib/cors-middleware.ts` and update the production origins:

```typescript
const PRODUCTION_CORS_OPTIONS: CorsOptions = {
  origin: [
    'https://your-actual-domain.com',
    'https://www.your-actual-domain.com',
    // Add all your production domains
  ],
  // ... rest of config
}
```

## 🔐 Security Features

### Role Hierarchy
```
super_admin > admin > user
```

### Permission Matrix
| Feature | User | Admin | Super Admin |
|---------|------|-------|-------------|
| Error Management | ❌ | ✅ | ✅ |
| System Monitoring | ❌ | ✅ | ✅ |
| Analytics | ❌ | ✅ | ✅ |
| User Management | ❌ | ❌ | ✅ |
| Admin Promotion | ❌ | ❌ | ✅ |
| Audit Logs | ❌ | ❌ | ✅ |

### Security Audit Logging

All admin actions are automatically logged:
- User access attempts
- Permission denials
- Admin promotions/revocations
- System access patterns

Access logs via: `GET /api/admin/users?action=audit`

## 🌐 CORS Configuration

### Development
- Allows `localhost:3000`, `localhost:3001`, `127.0.0.1:3000`
- Permissive headers for development ease
- Credentials enabled

### Production
- Strict origin validation
- Limited headers for security
- Shorter cache times
- Security violation logging

### Custom CORS Usage

```typescript
// In your API routes
import { withCors } from '@/lib/cors-middleware'

export const GET = withCors(async (request) => {
  // Your handler
}, {
  origin: ['https://trusted-domain.com'],
  methods: ['GET', 'POST']
})
```

## 🛡️ Security Best Practices Implemented

### 1. **Defense in Depth**
- Middleware-level authentication
- Route-level permission checks
- Database-level RLS policies
- Audit logging at every level

### 2. **Principle of Least Privilege**
- Users get minimum required permissions
- Granular permission system
- Role-based access control

### 3. **Security Monitoring**
- All admin actions logged
- Failed access attempts tracked
- CORS violations monitored
- Audit trail for compliance

### 4. **Secure Defaults**
- Users default to 'user' role
- CORS defaults to restrictive in production
- Admin access requires explicit permission
- No hardcoded admin credentials

## 🔧 Admin Management API

### Promote User to Admin
```bash
POST /api/admin/users?action=promote
{
  "userId": "user-uuid",
  "role": "admin" # or "super_admin"
}
```

### Revoke Admin Access
```bash
POST /api/admin/users?action=revoke
{
  "userId": "user-uuid"
}
```

### List All Admins
```bash
GET /api/admin/users?action=admins
```

### View Audit Logs
```bash
GET /api/admin/users?action=audit&limit=100&offset=0
```

## 🚨 Security Alerts

The system will automatically alert on:
- Multiple failed admin access attempts
- Unusual access patterns
- Permission escalation attempts
- CORS policy violations

## 📊 Monitoring Dashboard Access

Now properly secured admin endpoints:

- **Error Management**: `/api/admin/errors` - View and manage application errors
- **System Monitoring**: `/api/admin/monitoring` - System health and performance
- **Analytics**: `/api/admin/analytics` - User and usage analytics
- **User Management**: `/api/admin/users` - Admin user management

## 🔄 Migration Notes

### Before This Update
- ❌ Any authenticated user could access admin features
- ❌ No CORS configuration
- ❌ No audit logging
- ❌ No role-based permissions

### After This Update
- ✅ Only admins can access sensitive features
- ✅ Comprehensive CORS protection
- ✅ Full audit trail of admin actions
- ✅ Granular permission system
- ✅ Production-ready security

## 🎯 Next Steps

1. **Run the database migration** (`add-admin-role-migration.sql`)
2. **Create your first super admin** (update user role via SQL)
3. **Update production CORS origins** (in `lib/cors-middleware.ts`)
4. **Test admin access** (try accessing `/api/admin/errors`)
5. **Monitor audit logs** (check admin access patterns)

## 🔒 Security Checklist

- [ ] Database migration completed
- [ ] First super admin created
- [ ] Production CORS origins configured
- [ ] Admin access tested
- [ ] Audit logging verified
- [ ] Error management secured
- [ ] System monitoring secured
- [ ] User management tested

Your SharedTask application is now **enterprise-grade secure**! 🛡️✨

---

**Important**: Keep your super admin credentials secure and regularly review audit logs for any suspicious activity.











