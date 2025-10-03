// Admin utility functions

/**
 * List of admin email addresses
 * Add more emails here to grant admin access
 */
const ADMIN_EMAILS = [
  'admin@sharedtask.ai',
  'contact@remisimmons.com'  // Your current admin email
  // Add more admin emails here as needed
  // 'manager@example.com'
  // Note: 'Aderemis@gmail.com' is NOT an admin - regular user only
]

/**
 * Check if an email address has admin privileges
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) {
    console.log('isAdmin: No email provided')
    return false
  }
  
  const normalizedEmail = email.toLowerCase().trim()
  const isAdminResult = ADMIN_EMAILS.includes(normalizedEmail)
  
  console.log('Admin check:', {
    originalEmail: email,
    normalizedEmail,
    adminEmails: ADMIN_EMAILS,
    isAdmin: isAdminResult
  })
  
  return isAdminResult
}

/**
 * Check if a user session has admin privileges
 */
export function isAdminUser(user: { email?: string | null } | null | undefined): boolean {
  return isAdmin(user?.email)
}

/**
 * Get the list of admin emails (for debugging/logging)
 */
export function getAdminEmails(): string[] {
  return [...ADMIN_EMAILS]
}

