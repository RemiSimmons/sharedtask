import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from './supabase'

export const authOptions = {
  trustHost: true, // Allow multiple domains
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Get user from database (including email_verified status)
          const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('id, name, email, password_hash, email_verified')
            .eq('email', credentials.email as string)
            .single()

          if (error || !user) {
            console.log('User lookup failed:', error)
            return null
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password as string, user.password_hash || '')
          
          if (!isValidPassword) {
            return null
          }

          // Store email verification status in the user object
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.email_verified,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
    // Session duration: 7 days for better security-usability balance
    maxAge: 7 * 24 * 60 * 60, // 7 days
    // Update session every hour (session rotation for security)
    updateAge: 60 * 60, // 1 hour - triggers session refresh/rotation
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true, // Prevent JavaScript access (XSS protection)
        sameSite: 'lax' as const, // CSRF protection while allowing normal navigation
        path: '/', // Available across entire site
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        maxAge: 7 * 24 * 60 * 60, // 7 days
      },
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async signIn({ user, account, profile }: any) {
      // Handle Google OAuth sign in
      if (account?.provider === 'google') {
        try {
          const email = user.email
          const googleId = account.providerAccountId
          
          // Check if user already exists by email
          const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('id, oauth_provider, oauth_provider_id')
            .eq('email', email)
            .single()
          
          if (existingUser) {
            // User exists - link Google account automatically (Strategy 1a)
            if (!existingUser.oauth_provider || !existingUser.oauth_provider_id) {
              await supabaseAdmin
                .from('users')
                .update({
                  oauth_provider: 'google',
                  oauth_provider_id: googleId,
                  email_verified: true, // Google emails are pre-verified
                  email_verified_at: new Date().toISOString()
                })
                .eq('id', existingUser.id)
            }
            
            // Update user object with existing user ID for JWT callback
            user.id = existingUser.id
          } else {
            // New user - create account with Google OAuth
            const { data: newUser, error } = await supabaseAdmin
              .from('users')
              .insert({
                email: email,
                name: user.name || 'Google User',
                password_hash: '', // Empty for OAuth users
                oauth_provider: 'google',
                oauth_provider_id: googleId,
                email_verified: true,
                email_verified_at: new Date().toISOString(),
                role: 'user'
              })
              .select('id')
              .single()
            
            if (error || !newUser) {
              console.error('Failed to create Google OAuth user:', error)
              return false
            }
            
            user.id = newUser.id
          }
          
          return true
        } catch (error) {
          console.error('Google OAuth sign in error:', error)
          return false
        }
      }
      
      // Allow credentials login (existing flow)
      return true
    },
    async jwt({ token, user, account, trigger }: any) {
      // Initial sign in - set token data
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.emailVerified = user.emailVerified !== undefined ? user.emailVerified : true // Google users are verified
        token.loginAt = Date.now() // Track when user logged in (for session rotation)
        
        // Store OAuth provider info
        if (account?.provider === 'google') {
          token.provider = 'google'
        }
      }
      
      // Session update triggered - refresh email verification status
      if (trigger === 'update') {
        const { data: updatedUser } = await supabaseAdmin
          .from('users')
          .select('email_verified')
          .eq('id', token.id)
          .single()
        
        if (updatedUser) {
          token.emailVerified = updatedUser.email_verified
        }
      }
      
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.emailVerified = token.emailVerified as boolean
        
        // Add session metadata for tracking
        session.loginAt = token.loginAt
        session.provider = token.provider // Track auth provider
      }
      return session
    },
  },
  // Enable debug in development for troubleshooting
  debug: process.env.NODE_ENV === 'development',
}

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions)



