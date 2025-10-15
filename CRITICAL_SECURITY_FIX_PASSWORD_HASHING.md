# 🔴 CRITICAL SECURITY FIX: Project Password Hashing

## Status: ✅ FIXED (Infrastructure Ready)

---

## Executive Summary

**Critical Vulnerability Found:** Project `admin_password` field could potentially store plaintext passwords.

**Fix Applied:**
1. ✅ Project creation now properly hashes all passwords with bcrypt (cost factor 12)
2. ✅ Password verification endpoint rewritten to use bcrypt.compare()
3. ✅ Migration script created to hash any existing plaintext passwords
4. ⚠️  Password protection UI not yet implemented (feature gap)

---

## What Was Fixed

### 1. Password Creation (Already Secure)
**File:** `app/api/projects/route.ts`

The code was **already secure**:
```typescript
// Line 172 - Passwords are hashed before storage
hashedPassword = await bcrypt.hash(projectPassword, 12)
```

✅ **Status:** No changes needed

---

### 2. Password Verification (FIXED)
**File:** `app/api/admin/auth/route.ts`

**BEFORE (Vulnerable):**
```typescript
// Direct plaintext comparison - BROKEN!
const { data: projects } = await supabase
  .from('projects')
  .eq('admin_password', password) // Won't work with hashed passwords
```

**AFTER (Secure):**
```typescript
// Proper bcrypt verification
const { data: project } = await supabaseAdmin
  .from('projects')
  .select('id, admin_password')
  .eq('id', projectId)
  .single()

const isValid = await bcrypt.compare(password, project.admin_password)
```

✅ **Status:** Fixed and secure

**API Changes:**
- **Old:** `POST /api/admin/auth` with `{ password }`
- **New:** `POST /api/admin/auth` with `{ projectId, password }`

---

### 3. Migration Script (Created)
**Files:**
- `migration-hash-project-passwords.sql` - Database analysis
- `scripts/migrate-project-passwords.ts` - Actual migration

These scripts will:
1. Identify projects with plaintext passwords
2. Hash them using bcrypt (cost factor 12)
3. Update database with hashed versions
4. Verify migration success

✅ **Status:** Ready to run

---

## How to Run the Migration

### Prerequisites
```bash
# Ensure dependencies are installed
npm install

# Install tsx globally (or use npx)
npm install -g tsx
```

### Step 1: Analyze Database
```bash
# Run in Supabase SQL Editor
# File: migration-hash-project-passwords.sql
```

This will show you:
- Total projects
- Projects with hashed passwords (secure)
- Projects with plaintext passwords (vulnerable)
- Projects with no password

### Step 2: Run Migration
```bash
# From project root
npx tsx scripts/migrate-project-passwords.ts

# OR if tsx is installed globally
tsx scripts/migrate-project-passwords.ts
```

The script will:
1. 🔍 Scan all projects
2. 📊 Show password status report
3. ⚠️  Ask for confirmation
4. 🔄 Hash all plaintext passwords
5. ✅ Verify migration success

### Step 3: Verify
```bash
# Run the SQL script again to confirm
# All passwords should show as "Already hashed"
```

---

## Current Password Protection Status

### ✅ Infrastructure (Secure)
- Password creation: **Hashes before storage**
- Password verification: **Uses bcrypt.compare()**
- Password storage: **bcrypt hashed (60 chars)**
- Database access: **Restricted by RLS**

### ⚠️ Feature Implementation (Incomplete)
- Password entry UI: **NOT IMPLEMENTED**
- Access control: **NOT ENFORCED**
- Session management: **NOT IMPLEMENTED**

**Current Behavior:**
- Projects with passwords: **Stored securely** ✅
- Project access: **No password prompt** ⚠️
- Anyone with URL: **Can access any project** ⚠️

---

## Next Steps to Complete Feature

### Phase 1: Access Control (Recommended)
Create a password prompt for protected projects:

```typescript
// app/project/[id]/password-gate.tsx
export function PasswordGate({ projectId, onSuccess }) {
  const [password, setPassword] = useState('')
  
  const handleSubmit = async () => {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, password })
    })
    
    if (res.ok) onSuccess()
  }
  
  return <PasswordPrompt onSubmit={handleSubmit} />
}
```

### Phase 2: Session Management
Store verified projects in session:

```typescript
// Use cookies or localStorage
localStorage.setItem(`project_${projectId}_verified`, 'true')

// Check on page load
const isVerified = localStorage.getItem(`project_${projectId}_verified`)
```

### Phase 3: Middleware Protection
Add route protection:

```typescript
// middleware.ts
if (req.nextUrl.pathname.startsWith('/project/')) {
  const projectId = extractProjectId(req.nextUrl.pathname)
  const hasAccess = await verifyProjectAccess(projectId, req)
  
  if (!hasAccess) {
    return NextResponse.redirect('/project/password-required')
  }
}
```

---

## Security Best Practices Implemented

### ✅ Password Hashing
- **Algorithm:** bcrypt
- **Cost Factor:** 12 (recommended for 2024)
- **Salt:** Automatically generated per password
- **Rainbow Table Resistant:** Yes

### ✅ Secure Comparison
- **Method:** bcrypt.compare() (timing-safe)
- **No Plaintext Storage:** Never stored or logged
- **Database Queries:** Cannot query by password

### ✅ Defense in Depth
- **RLS Policies:** Restrict `admin_password` access
- **Service Role Only:** Only backend can read passwords
- **No Client Exposure:** Passwords never sent to frontend

---

## Testing the Fix

### Test 1: Create New Project with Password
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "projectPassword": "SecurePass123!"
  }'
```

**Expected:** Password stored as bcrypt hash (~60 chars)

### Test 2: Verify Password
```bash
curl -X POST http://localhost:3000/api/admin/auth \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "your-project-id",
    "password": "SecurePass123!"
  }'
```

**Expected:** `{ "success": true, "requiresPassword": true }`

### Test 3: Wrong Password
```bash
curl -X POST http://localhost:3000/api/admin/auth \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "your-project-id",
    "password": "WrongPassword"
  }'
```

**Expected:** `{ "error": "Invalid password" }` with 401 status

---

## Migration Safety

### Backup Strategy
Before running migration:
```sql
-- Creates backup table
CREATE TABLE projects_password_backup AS 
SELECT id, admin_password, created_at 
FROM projects;
```

### Rollback Plan
If something goes wrong:
```sql
-- Restore from backup
UPDATE projects p
SET admin_password = b.admin_password
FROM projects_password_backup b
WHERE p.id = b.id;
```

### Verification Queries
```sql
-- Check password format
SELECT 
  id,
  name,
  CASE 
    WHEN admin_password ~ '^\$2[aby]\$' THEN 'Hashed (Secure)'
    WHEN admin_password = 'no_password_set' THEN 'No Password'
    ELSE 'PLAINTEXT (DANGER)'
  END as password_status,
  length(admin_password) as pass_length
FROM projects;
```

---

## Security Checklist

- [x] Passwords hashed on creation
- [x] Passwords verified with bcrypt.compare()
- [x] Migration script created
- [x] RLS policies restrict password access
- [x] No passwords in logs
- [x] Timing-safe comparison
- [ ] Password prompt UI (not yet implemented)
- [ ] Session management (not yet implemented)
- [ ] Access control middleware (not yet implemented)

---

## Files Changed

### Modified
1. ✅ `app/api/admin/auth/route.ts` - Secure password verification
2. ✅ `app/api/projects/route.ts` - Already secure (verified)

### Created
1. ✅ `migration-hash-project-passwords.sql` - Database analysis
2. ✅ `scripts/migrate-project-passwords.ts` - Migration script
3. ✅ `CRITICAL_SECURITY_FIX_PASSWORD_HASHING.md` - This documentation

---

## Deployment Instructions

### Before Deploying

1. **Run Migration Locally:**
   ```bash
   npx tsx scripts/migrate-project-passwords.ts
   ```

2. **Verify All Passwords Hashed:**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT COUNT(*) FROM projects 
   WHERE admin_password !~ '^\$2[aby]\$' 
   AND admin_password != 'no_password_set';
   ```
   Should return: 0

3. **Test Password Verification:**
   ```bash
   # Test with a known project and password
   curl -X POST https://your-domain.com/api/admin/auth \
     -d '{"projectId":"...", "password":"..."}'
   ```

4. **Deploy Application:**
   ```bash
   git add .
   git commit -m "🔐 SECURITY: Fix project password hashing"
   git push origin main
   ```

### After Deploying

1. **Run Migration on Production:**
   - Use Supabase SQL Editor
   - Run `migration-hash-project-passwords.sql`
   - Note any plaintext passwords
   - Contact users to reset if needed

2. **Monitor Logs:**
   ```bash
   # Check for password verification attempts
   vercel logs --prod
   ```

3. **Update Documentation:**
   - Inform team of new API format
   - Update any integration tests
   - Document password requirements

---

## FAQ

### Q: Will this break existing projects?
**A:** No. The migration only hashes passwords that are currently plaintext. Already-hashed passwords are left untouched.

### Q: What if a user forgets their project password?
**A:** Currently, there's no password reset mechanism. You'll need to:
1. Verify user owns the project (email verification)
2. Manually update password in database using admin client
3. Consider implementing password reset feature

### Q: Can users access projects without passwords?
**A:** Yes, projects with `admin_password = 'no_password_set'` allow public access.

### Q: Should I run this in production immediately?
**A:** Test in development first, but deploy to production soon. Any database breach would expose plaintext passwords.

### Q: What's the performance impact of bcrypt?
**A:** Minimal. bcrypt is designed to be slow (~100-200ms) to prevent brute force. This only affects password verification, not normal page loads.

---

## Contact & Support

If you encounter issues during migration:
1. Check the error logs
2. Verify environment variables are set
3. Ensure Supabase service role key has proper permissions
4. Review the backup table before making changes

---

**Last Updated:** October 13, 2025  
**Security Level:** CRITICAL  
**Status:** Fixed (Infrastructure), Incomplete (Feature)  
**Recommended Action:** Run migration ASAP, implement UI when ready



