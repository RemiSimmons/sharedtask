// Admin utility functions

/**
 * List of admin email addresses
 * Add more emails here to grant admin access
 */
const ADMIN_EMAILS = [
  'contact@remisimmons.com'  // Single admin account
  // Add more admin emails here as needed
]

/**
 * Check if an email address has admin privileges
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) {
    return false
  }
  
  const normalizedEmail = email.toLowerCase().trim()
  return ADMIN_EMAILS.includes(normalizedEmail)
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

