// Admin utility functions

/**
 * List of admin email addresses
 * Add more emails here to grant admin access
 */
const ADMIN_EMAILS = [
  'contact@remisimmons.com'
  // Add more admin emails here as needed
  // 'admin@example.com',
  // 'manager@example.com'
]

/**
 * Check if an email address has admin privileges
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
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

