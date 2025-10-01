export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string
          name: string
          role: string | null
          email_verified: boolean | null
          email_verified_at: string | null
          reset_token: string | null
          reset_token_expires: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          name: string
          role?: string | null
          email_verified?: boolean | null
          email_verified_at?: string | null
          reset_token?: string | null
          reset_token_expires?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          name?: string
          role?: string | null
          email_verified?: boolean | null
          email_verified_at?: string | null
          reset_token?: string | null
          reset_token_expires?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          user_id: string | null
          name: string
          task_label: string | null
          admin_password: string
          allow_multiple_tasks: boolean | null
          allow_multiple_contributors: boolean | null
          max_contributors_per_task: number | null
          contributor_names: Json
          description: string | null
          allow_contributors_add_names: boolean | null
          allow_contributors_add_tasks: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          task_label?: string | null
          admin_password: string
          allow_multiple_tasks?: boolean | null
          allow_multiple_contributors?: boolean | null
          max_contributors_per_task?: number | null
          contributor_names?: Json
          description?: string | null
          allow_contributors_add_names?: boolean | null
          allow_contributors_add_tasks?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          task_label?: string | null
          admin_password?: string
          allow_multiple_tasks?: boolean | null
          allow_multiple_contributors?: boolean | null
          max_contributors_per_task?: number | null
          contributor_names?: Json
          description?: string | null
          allow_contributors_add_names?: boolean | null
          allow_contributors_add_tasks?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      tasks: {
        Row: {
          id: string
          project_id: string | null
          name: string
          description: string | null
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          name: string
          description?: string | null
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string | null
          name?: string
          description?: string | null
          status?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      task_assignments: {
        Row: {
          id: string
          task_id: string | null
          contributor_name: string
          claimed_at: string | null
        }
        Insert: {
          id?: string
          task_id?: string | null
          contributor_name: string
          claimed_at?: string | null
        }
        Update: {
          id?: string
          task_id?: string | null
          contributor_name?: string
          claimed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      task_comments: {
        Row: {
          id: string
          task_id: string | null
          author_name: string
          content: string
          created_at: string | null
        }
        Insert: {
          id?: string
          task_id?: string | null
          author_name: string
          content: string
          created_at?: string | null
        }
        Update: {
          id?: string
          task_id?: string | null
          author_name?: string
          content?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_price_id: string | null
          plan: string
          interval: string
          status: string
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          plan: string
          interval: string
          status: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          plan?: string
          interval?: string
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_trials: {
        Row: {
          id: string
          user_id: string | null
          plan: string
          status: string
          started_at: string
          ends_at: string
          day_5_reminder_sent: boolean | null
          day_5_reminder_sent_at: string | null
          day_14_reminder_sent: boolean | null
          day_14_reminder_sent_at: string | null
          converted_to_subscription_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          plan: string
          status?: string
          started_at?: string
          ends_at: string
          day_5_reminder_sent?: boolean | null
          day_5_reminder_sent_at?: string | null
          day_14_reminder_sent?: boolean | null
          day_14_reminder_sent_at?: string | null
          converted_to_subscription_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          plan?: string
          status?: string
          started_at?: string
          ends_at?: string
          day_5_reminder_sent?: boolean | null
          day_5_reminder_sent_at?: string | null
          day_14_reminder_sent?: boolean | null
          day_14_reminder_sent_at?: string | null
          converted_to_subscription_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_trials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_trials_converted_to_subscription_id_fkey"
            columns: ["converted_to_subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          }
        ]
      }
      email_logs: {
        Row: {
          id: string
          user_id: string | null
          email_type: string
          recipient_email: string
          subject: string
          sent_at: string | null
          status: string
          error_message: string | null
          trial_id: string | null
          subscription_id: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          email_type: string
          recipient_email: string
          subject: string
          sent_at?: string | null
          status: string
          error_message?: string | null
          trial_id?: string | null
          subscription_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          email_type?: string
          recipient_email?: string
          subject?: string
          sent_at?: string | null
          status?: string
          error_message?: string | null
          trial_id?: string | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_trial_id_fkey"
            columns: ["trial_id"]
            isOneToOne: false
            referencedRelation: "user_trials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types for working with the database
export type User = Database['public']['Tables']['users']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskAssignment = Database['public']['Tables']['task_assignments']['Row']
export type TaskComment = Database['public']['Tables']['task_comments']['Row']
export type UserSubscription = Database['public']['Tables']['user_subscriptions']['Row']
export type UserTrial = Database['public']['Tables']['user_trials']['Row']
export type EmailLog = Database['public']['Tables']['email_logs']['Row']

export type InsertUser = Database['public']['Tables']['users']['Insert']
export type InsertProject = Database['public']['Tables']['projects']['Insert']
export type InsertTask = Database['public']['Tables']['tasks']['Insert']
export type InsertTaskAssignment = Database['public']['Tables']['task_assignments']['Insert']
export type InsertTaskComment = Database['public']['Tables']['task_comments']['Insert']
export type InsertUserSubscription = Database['public']['Tables']['user_subscriptions']['Insert']
export type InsertUserTrial = Database['public']['Tables']['user_trials']['Insert']
export type InsertEmailLog = Database['public']['Tables']['email_logs']['Insert']

export type UpdateUser = Database['public']['Tables']['users']['Update']
export type UpdateProject = Database['public']['Tables']['projects']['Update']
export type UpdateTask = Database['public']['Tables']['tasks']['Update']
export type UpdateTaskAssignment = Database['public']['Tables']['task_assignments']['Update']
export type UpdateTaskComment = Database['public']['Tables']['task_comments']['Update']
export type UpdateUserSubscription = Database['public']['Tables']['user_subscriptions']['Update']
export type UpdateUserTrial = Database['public']['Tables']['user_trials']['Update']
export type UpdateEmailLog = Database['public']['Tables']['email_logs']['Update']

// Subscription and trial status types
export type SubscriptionStatus = 'active' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'past_due' | 'canceled' | 'unpaid'
export type TrialStatus = 'active' | 'expired' | 'converted'
export type PlanType = 'basic' | 'pro' | 'team'
export type BillingInterval = 'monthly' | 'yearly'
export type EmailType = 'trial_day_5' | 'trial_day_14' | 'subscription_welcome' | 'subscription_canceled'
