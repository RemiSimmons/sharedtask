export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_access_logs: {
        Row: {
          action: string
          created_at: string | null
          error_message: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          resource: string
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource: string
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource?: string
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_access_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      application_logs: {
        Row: {
          context: Json | null
          created_at: string | null
          endpoint: string | null
          id: string
          ip_address: string | null
          level: string
          message: string
          method: string | null
          response_time: number | null
          status_code: number | null
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          endpoint?: string | null
          id?: string
          ip_address?: string | null
          level: string
          message: string
          method?: string | null
          response_time?: number | null
          status_code?: number | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          endpoint?: string | null
          id?: string
          ip_address?: string | null
          level?: string
          message?: string
          method?: string | null
          response_time?: number | null
          status_code?: number | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          admin_email: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          status: string | null
          target_user_email: string | null
          timestamp: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_email: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          status?: string | null
          target_user_email?: string | null
          timestamp?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_email?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          status?: string | null
          target_user_email?: string | null
          timestamp?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          email_type: string
          error_message: string | null
          id: string
          recipient_email: string
          sent_at: string | null
          status: string
          subject: string
          subscription_id: string | null
          trial_id: string | null
          user_id: string | null
        }
        Insert: {
          email_type: string
          error_message?: string | null
          id?: string
          recipient_email: string
          sent_at?: string | null
          status: string
          subject: string
          subscription_id?: string | null
          trial_id?: string | null
          user_id?: string | null
        }
        Update: {
          email_type?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          sent_at?: string | null
          status?: string
          subject?: string
          subscription_id?: string | null
          trial_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
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
            foreignKeyName: "email_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          admin_password: string
          allow_contributors_add_names: boolean | null
          allow_contributors_add_tasks: boolean | null
          allow_multiple_contributors: boolean | null
          allow_multiple_tasks: boolean | null
          contributor_names: Json | null
          created_at: string | null
          description: string | null
          event_attire: string | null
          event_location: string | null
          event_time: string | null
          id: string
          max_contributors_per_task: number | null
          name: string
          task_label: string | null
          user_id: string | null
        }
        Insert: {
          admin_password: string
          allow_contributors_add_names?: boolean | null
          allow_contributors_add_tasks?: boolean | null
          allow_multiple_contributors?: boolean | null
          allow_multiple_tasks?: boolean | null
          contributor_names?: Json | null
          created_at?: string | null
          description?: string | null
          event_attire?: string | null
          event_location?: string | null
          event_time?: string | null
          id?: string
          max_contributors_per_task?: number | null
          name?: string
          task_label?: string | null
          user_id?: string | null
        }
        Update: {
          admin_password?: string
          allow_contributors_add_names?: boolean | null
          allow_contributors_add_tasks?: boolean | null
          allow_multiple_contributors?: boolean | null
          allow_multiple_tasks?: boolean | null
          contributor_names?: Json | null
          created_at?: string | null
          description?: string | null
          event_attire?: string | null
          event_location?: string | null
          event_time?: string | null
          id?: string
          max_contributors_per_task?: number | null
          name?: string
          task_label?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignments: {
        Row: {
          claimed_at: string | null
          contributor_name: string
          headcount: number
          id: string
          task_id: string | null
        }
        Insert: {
          claimed_at?: string | null
          contributor_name: string
          headcount?: number
          id?: string
          task_id?: string | null
        }
        Update: {
          claimed_at?: string | null
          contributor_name?: string
          headcount?: number
          id?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_name: string
          content: string
          created_at: string | null
          id: string
          task_id: string | null
        }
        Insert: {
          author_name: string
          content: string
          created_at?: string | null
          id?: string
          task_id?: string | null
        }
        Update: {
          author_name?: string
          content?: string
          created_at?: string | null
          id?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          project_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          project_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          project_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          interval: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          interval: string
          plan: string
          status: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          interval?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_trials: {
        Row: {
          converted_to_subscription_id: string | null
          created_at: string | null
          day_5_reminder_sent: boolean | null
          day_5_reminder_sent_at: string | null
          day_7_reminder_sent: boolean | null
          day_7_reminder_sent_at: string | null
          ends_at: string
          id: string
          plan: string
          started_at: string
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          converted_to_subscription_id?: string | null
          created_at?: string | null
          day_5_reminder_sent?: boolean | null
          day_5_reminder_sent_at?: string | null
          day_7_reminder_sent?: boolean | null
          day_7_reminder_sent_at?: string | null
          ends_at: string
          id?: string
          plan: string
          started_at?: string
          status: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          converted_to_subscription_id?: string | null
          created_at?: string | null
          day_5_reminder_sent?: boolean | null
          day_5_reminder_sent_at?: string | null
          day_7_reminder_sent?: boolean | null
          day_7_reminder_sent_at?: string | null
          ends_at?: string
          id?: string
          plan?: string
          started_at?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_trials_converted_to_subscription_id_fkey"
            columns: ["converted_to_subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_trials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          email_verification_expires: string | null
          email_verification_token: string | null
          email_verified: boolean | null
          email_verified_at: string | null
          id: string
          name: string
          password_hash: string | null
          reset_token: string | null
          reset_token_expires: string | null
          role: string | null
          oauth_provider: string | null
          oauth_provider_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          email_verification_expires?: string | null
          email_verification_token?: string | null
          email_verified?: boolean | null
          email_verified_at?: string | null
          id?: string
          name?: string
          password_hash?: string | null
          reset_token?: string | null
          reset_token_expires?: string | null
          role?: string | null
          oauth_provider?: string | null
          oauth_provider_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          email_verification_expires?: string | null
          email_verification_token?: string | null
          email_verified?: boolean | null
          email_verified_at?: string | null
          id?: string
          name?: string
          password_hash?: string | null
          reset_token?: string | null
          reset_token_expires?: string | null
          role?: string | null
          oauth_provider?: string | null
          oauth_provider_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_projects_with_details: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          id: string
          name: string
          task_count: number
          user_id: string
        }[]
      }
      get_users_with_project_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          email: string
          id: string
          name: string
          project_count: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// Custom types for application logic
export type PlanType = 'basic' | 'pro' | 'team'
export type BillingInterval = 'month' | 'year'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'trialing'
export type TrialStatus = 'active' | 'expired' | 'canceled'

// Subscription-related types
export interface UserSubscription {
  id: string
  user_id: string | null
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  stripe_price_id: string | null
  plan: string
  interval: string
  status: string
  current_period_start: string | null
  current_period_end: string | null
  created_at: string | null
  updated_at: string | null
}

export interface UserTrial {
  id: string
  user_id: string | null
  plan: string
  status: string
  started_at: string
  ends_at: string
  created_at: string | null
  updated_at: string | null
  converted_to_subscription_id: string | null
  day_5_reminder_sent: boolean | null
  day_5_reminder_sent_at: string | null
  day_7_reminder_sent: boolean | null
  day_7_reminder_sent_at: string | null
}

export interface InsertUserSubscription {
  user_id: string
  stripe_subscription_id?: string | null
  stripe_customer_id?: string | null
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

export interface InsertUserTrial {
  user_id: string
  plan: string
  status: string
  started_at?: string
  ends_at: string
  converted_to_subscription_id?: string | null
  created_at?: string | null
  day_5_reminder_sent?: boolean | null
  day_5_reminder_sent_at?: string | null
  day_7_reminder_sent?: boolean | null
  day_7_reminder_sent_at?: string | null
  updated_at?: string | null
}

export interface UpdateUserSubscription {
  plan?: string
  interval?: string
  status?: string
  current_period_start?: string | null
  current_period_end?: string | null
  cancel_at_period_end?: boolean | null
  canceled_at?: string | null
  created_at?: string | null
  stripe_customer_id?: string | null
  stripe_price_id?: string | null
  stripe_subscription_id?: string | null
  updated_at?: string | null
  user_id?: string | null
}

export interface UpdateUserTrial {
  plan?: string
  status?: string
  started_at?: string
  ends_at?: string
  converted_to_subscription_id?: string | null
  created_at?: string | null
  day_5_reminder_sent?: boolean | null
  day_5_reminder_sent_at?: string | null
  day_7_reminder_sent?: boolean | null
  day_7_reminder_sent_at?: string | null
  updated_at?: string | null
  user_id?: string | null
}

// Type aliases for easier imports
export type Project = Database['public']['Tables']['projects']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskAssignment = Database['public']['Tables']['task_assignments']['Row']
export type TaskComment = Database['public']['Tables']['task_comments']['Row']
export type InsertEmailLog = Database['public']['Tables']['email_logs']['Insert']
export type User = Database['public']['Tables']['users']['Row']

// Email types
export type EmailType = 'trial_welcome' | 'trial_reminder' | 'trial_expired' | 'trial_day_5' | 'trial_day_14' | 'subscription_welcome' | 'subscription_reminder' | 'subscription_canceled'
