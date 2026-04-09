import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

export const signupSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .max(255, 'Email address is too long')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password is too long (maximum 128 characters)'),
  name: z.string()
    .min(1, 'Please enter your full name')
    .max(100, 'Name is too long (maximum 100 characters)')
    .trim()
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
})

export const signinSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(1, 'Password is required')
    .max(128, 'Password must be less than 128 characters'),
})

export const forgotPasswordSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim(),
})

export const resetPasswordSchema = z.object({
  token: z.string()
    .min(1, 'Reset token is required')
    .max(255, 'Invalid token format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required')
    .max(128, 'Password must be less than 128 characters'),
  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
})

// ============================================================================
// PROJECT SCHEMAS
// ============================================================================

export const projectSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(200, 'Project name must be less than 200 characters')
    .trim(),
  taskLabel: z.string()
    .min(1, 'Task label is required')
    .max(100, 'Task label must be less than 100 characters')
    .trim()
    .optional()
    .default('Task Name'),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .optional(),
  allowMultipleTasks: z.boolean()
    .optional()
    .default(false),
  allowMultipleContributors: z.boolean()
    .optional()
    .default(false),
  maxContributorsPerTask: z.number()
    .int('Must be a whole number')
    .min(1, 'Must allow at least 1 contributor')
    .max(100, 'Cannot exceed 100 contributors per task')
    .optional()
    .nullable(),
  allowContributorsAddNames: z.boolean()
    .optional()
    .default(true),
  allowContributorsAddTasks: z.boolean()
    .optional()
    .default(true),
  eventLocation: z.string()
    .max(100, 'Location must be less than 100 characters')
    .trim()
    .optional()
    .nullable(),
  eventTime: z.string()
    .max(100, 'Time must be less than 100 characters')
    .trim()
    .optional()
    .nullable(),
  eventAttire: z.string()
    .max(100, 'Attire must be less than 100 characters')
    .trim()
    .optional()
    .nullable(),
  contributors: z.array(z.string().trim().min(1, 'Contributor name cannot be empty'))
    .max(50, 'Cannot add more than 50 contributors')
    .optional()
    .default([]),
  projectPassword: z.string()
    .min(6, 'Project password must be at least 6 characters')
    .max(50, 'Project password must be less than 50 characters')
    .optional(),
})

export const updateProjectSchema = projectSchema.partial().extend({
  id: z.string()
    .uuid('Invalid project ID format'),
})

// ============================================================================
// TASK SCHEMAS
// ============================================================================

export const taskSchema = z.object({
  name: z.string()
    .min(1, 'Task name is required')
    .max(200, 'Task name must be less than 200 characters')
    .trim(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .optional(),
  projectId: z.string()
    .uuid('Invalid project ID format'),
})

export const updateTaskSchema = taskSchema.partial().extend({
  id: z.string()
    .uuid('Invalid task ID format'),
  status: z.enum(['available', 'claimed', 'completed'])
    .optional(),
})

export const taskAssignmentSchema = z.object({
  taskId: z.string()
    .uuid('Invalid task ID format'),
  contributorName: z.string()
    .min(1, 'Contributor name is required')
    .max(100, 'Contributor name must be less than 100 characters')
    .trim()
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
})

export const taskCommentSchema = z.object({
  taskId: z.string()
    .uuid('Invalid task ID format'),
  authorName: z.string()
    .min(1, 'Author name is required')
    .max(100, 'Author name must be less than 100 characters')
    .trim()
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  content: z.string()
    .min(1, 'Comment content is required')
    .max(1000, 'Comment must be less than 1000 characters')
    .trim(),
})

// ============================================================================
// USER PROFILE SCHEMAS
// ============================================================================

export const updateProfileSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .optional(),
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim()
    .optional(),
})

// ============================================================================
// CONTACT/SUPPORT SCHEMAS
// ============================================================================

export const contactSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim(),
  subject: z.string()
    .min(1, 'Subject is required')
    .max(200, 'Subject must be less than 200 characters')
    .trim(),
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be less than 2000 characters')
    .trim(),
})

// ============================================================================
// ADMIN SCHEMAS
// ============================================================================

export const adminAuthSchema = z.object({
  projectId: z.string()
    .uuid('Invalid project ID format'),
  password: z.string()
    .min(1, 'Password is required')
    .max(50, 'Password must be less than 50 characters'),
})

export const adminActionSchema = z.object({
  action: z.enum([
    'export_users',
    'export_projects',
    'clear_cache',
    'system_health',
    'verify_user',
    'suspend_user',
    'activate_user',
    'reset_user_password',
    'delete_user'
  ], {
    errorMap: () => ({ message: 'Invalid admin action' })
  }),
  params: z.object({
    userId: z.string()
      .uuid('Invalid user ID format')
      .optional(),
  }).optional(),
})

export const supportReplySchema = z.object({
  to: z.string()
    .email('Invalid recipient email format')
    .max(255, 'Email must be less than 255 characters'),
  subject: z.string()
    .min(1, 'Subject is required')
    .max(200, 'Subject must be less than 200 characters')
    .trim(),
  message: z.string()
    .min(1, 'Message is required')
    .max(5000, 'Message must be less than 5000 characters')
    .trim(),
  ticketId: z.string()
    .max(100, 'Ticket ID is too long')
    .optional(),
})

export const verifyEmailSchema = z.object({
  token: z.string()
    .min(1, 'Token is required')
    .max(255, 'Invalid token format'),
})

export const adminUserActionSchema = z.object({
  userId: z.string()
    .uuid('Invalid user ID format'),
  role: z.enum(['admin', 'super_admin'], {
    errorMap: () => ({ message: 'Role must be admin or super_admin' })
  }).optional(),
  updates: z.record(z.any()).optional(),
})

export const demoConvertSchema = z.object({
  projectName: z.string()
    .min(1, 'Project name is required')
    .max(200, 'Project name must be less than 200 characters')
    .trim(),
  taskLabel: z.string()
    .max(100, 'Task label must be less than 100 characters')
    .trim()
    .optional(),
  adminPassword: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(50, 'Password must be less than 50 characters'),
  allowMultipleTasks: z.boolean().optional(),
  allowMultipleContributors: z.boolean().optional(),
  maxContributorsPerTask: z.number().int().min(1).max(100).optional().nullable(),
  allowContributorsAddNames: z.boolean().optional(),
  allowContributorsAddTasks: z.boolean().optional(),
  demoData: z.object({
    tasks: z.array(z.any()).max(50, 'Cannot convert more than 50 tasks'),
    projectSettings: z.any().optional(),
  }),
})

// ============================================================================
// COMMON VALIDATION HELPERS
// ============================================================================

export const uuidSchema = z.string().uuid('Invalid ID format')

export const paginationSchema = z.object({
  page: z.coerce.number()
    .int('Page must be a whole number')
    .min(1, 'Page must be at least 1')
    .max(1000, 'Page cannot exceed 1000')
    .optional()
    .default(1),
  limit: z.coerce.number()
    .int('Limit must be a whole number')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(10),
})

// ============================================================================
// VALIDATION ERROR HANDLER
// ============================================================================

export function formatValidationError(error: z.ZodError) {
  // Get the first error message for user-friendly display
  const firstError = error.errors[0]
  const userFriendlyMessage = firstError ? firstError.message : 'Validation failed'
  
  return {
    error: userFriendlyMessage,
    message: userFriendlyMessage, // Duplicate for compatibility
    details: error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    })),
  }
}

// ============================================================================
// SANITIZATION HELPERS
// ============================================================================

/**
 * Sanitize HTML content using DOMPurify
 * This removes all potentially dangerous HTML/JS while keeping safe formatting
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return ''
  
  // Configure DOMPurify for safe HTML
  const clean = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  })
  
  return clean.trim()
}

/**
 * Sanitize plain text input (no HTML allowed)
 * This aggressively removes all HTML and special characters
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return ''
  
  // Remove all HTML tags
  let sanitized = validator.stripLow(input, true)
  
  // Use DOMPurify to remove any remaining HTML
  sanitized = DOMPurify.sanitize(sanitized, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
  
  // Normalize whitespace
  sanitized = sanitized
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .slice(0, 10000) // Prevent extremely long inputs
  
  return sanitized
}

/**
 * Sanitize user name input
 * Only allows letters, spaces, hyphens, and apostrophes
 */
export function sanitizeName(input: string): string {
  if (!input || typeof input !== 'string') return ''
  
  let sanitized = validator.stripLow(input, true)
  sanitized = DOMPurify.sanitize(sanitized, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
  
  // Remove any non-name characters
  sanitized = sanitized.replace(/[^a-zA-Z\s'-]/g, '')
  
  return sanitized.trim().slice(0, 100)
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') return ''
  
  const sanitized = validator.normalizeEmail(input.toLowerCase().trim(), {
    gmail_remove_dots: false,
    gmail_remove_subaddress: false,
    outlookdotcom_remove_subaddress: false,
    yahoo_remove_subaddress: false,
    icloud_remove_subaddress: false,
  })
  
  return sanitized || input.toLowerCase().trim()
}

/**
 * Validate and sanitize URL input
 */
export function sanitizeUrl(input: string): string | null {
  if (!input || typeof input !== 'string') return null
  
  const trimmed = input.trim()
  
  if (!validator.isURL(trimmed, {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true,
  })) {
    return null
  }
  
  return trimmed
}

/**
 * Validate UUID format
 */
export function isValidUuid(input: string): boolean {
  return validator.isUUID(input)
}

/**
 * Sanitize JSON input to prevent NoSQL injection
 */
export function sanitizeJsonInput<T>(input: any): T | null {
  try {
    // If it's already parsed JSON, re-stringify and parse to ensure it's clean
    if (typeof input === 'object' && input !== null) {
      const stringified = JSON.stringify(input)
      return JSON.parse(stringified) as T
    }
    
    // If it's a string, parse it
    if (typeof input === 'string') {
      return JSON.parse(input) as T
    }
    
    return null
  } catch (error) {
    console.error('JSON sanitization error:', error)
    return null
  }
}
