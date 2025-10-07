import { z } from 'zod'

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
// SUBSCRIPTION SCHEMAS
// ============================================================================

export const subscriptionSchema = z.object({
  plan: z.enum(['basic', 'pro', 'team'], {
    errorMap: () => ({ message: 'Plan must be basic, pro, or team' })
  }),
  interval: z.enum(['monthly', 'yearly'], {
    errorMap: () => ({ message: 'Interval must be monthly or yearly' })
  }),
})

export const trialSchema = z.object({
  plan: z.enum(['basic', 'pro', 'team'], {
    errorMap: () => ({ message: 'Plan must be basic, pro, or team' })
  }),
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

export function sanitizeHtml(input: string): string {
  // Basic HTML sanitization - remove potentially dangerous tags
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .slice(0, 10000) // Prevent extremely long inputs
}
