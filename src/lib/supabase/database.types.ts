export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      coding_submissions: {
        Row: {
          ai_issues: Json | null
          ai_review: string | null
          ai_score: number | null
          ai_strengths: Json | null
          code: string
          created_at: string
          id: string
          language: string
          question_id: string
          session_id: string
          submitted_at: string
        }
        Insert: {
          ai_issues?: Json | null
          ai_review?: string | null
          ai_score?: number | null
          ai_strengths?: Json | null
          code: string
          created_at?: string
          id?: string
          language: string
          question_id: string
          session_id: string
          submitted_at?: string
        }
        Update: {
          ai_issues?: Json | null
          ai_review?: string | null
          ai_score?: number | null
          ai_strengths?: Json | null
          code?: string
          created_at?: string
          id?: string
          language?: string
          question_id?: string
          session_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coding_submissions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "interview_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coding_submissions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cover_letters: {
        Row: {
          ai_model: string | null
          ai_provider: string | null
          company_name: string | null
          created_at: string
          edited_content: string | null
          generated_content: string | null
          id: string
          job_description: string | null
          resume_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_model?: string | null
          ai_provider?: string | null
          company_name?: string | null
          created_at?: string
          edited_content?: string | null
          generated_content?: string | null
          id?: string
          job_description?: string | null
          resume_id?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_model?: string | null
          ai_provider?: string | null
          company_name?: string | null
          created_at?: string
          edited_content?: string | null
          generated_content?: string | null
          id?: string
          job_description?: string | null
          resume_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cover_letters_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_letters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_answers: {
        Row: {
          ai_feedback: string | null
          answer_text: string | null
          created_at: string
          id: string
          is_correct: boolean | null
          question_id: string
          score: number | null
          selected_option_key: string | null
          session_id: string
          submitted_at: string
        }
        Insert: {
          ai_feedback?: string | null
          answer_text?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          question_id: string
          score?: number | null
          selected_option_key?: string | null
          session_id: string
          submitted_at?: string
        }
        Update: {
          ai_feedback?: string | null
          answer_text?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          question_id?: string
          score?: number | null
          selected_option_key?: string | null
          session_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "interview_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_questions: {
        Row: {
          ai_generated: boolean
          correct_option_key: string | null
          created_at: string
          id: string
          language: string | null
          options: Json | null
          prompt: string
          question_type: string
          sequence_number: number
          session_id: string
          starter_code: string | null
        }
        Insert: {
          ai_generated?: boolean
          correct_option_key?: string | null
          created_at?: string
          id?: string
          language?: string | null
          options?: Json | null
          prompt: string
          question_type: string
          sequence_number: number
          session_id: string
          starter_code?: string | null
        }
        Update: {
          ai_generated?: boolean
          correct_option_key?: string | null
          created_at?: string
          id?: string
          language?: string | null
          options?: Json | null
          prompt?: string
          question_type?: string
          sequence_number?: number
          session_id?: string
          starter_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_questions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          credits_consumed: number
          difficulty: string | null
          id: string
          max_score: number | null
          mode: string
          started_at: string | null
          status: string
          summary_feedback: string | null
          time_limit_seconds: number | null
          topic: string | null
          total_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          credits_consumed?: number
          difficulty?: string | null
          id?: string
          max_score?: number | null
          mode: string
          started_at?: string | null
          status?: string
          summary_feedback?: string | null
          time_limit_seconds?: number | null
          topic?: string | null
          total_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          credits_consumed?: number
          difficulty?: string | null
          id?: string
          max_score?: number | null
          mode?: string
          started_at?: string | null
          status?: string
          summary_feedback?: string | null
          time_limit_seconds?: number | null
          topic?: string | null
          total_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          channel: string
          created_at: string
          delivered_at: string | null
          id: string
          is_read: boolean
          link: string | null
          scheduled_for: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          channel?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          scheduled_for?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          channel?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          scheduled_for?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          headline: string | null
          id: string
          privacy_consent_at: string | null
          privacy_consent_version: string | null
          resume_context: Json | null
          target_role: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          headline?: string | null
          id: string
          privacy_consent_at?: string | null
          privacy_consent_version?: string | null
          resume_context?: Json | null
          target_role?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          headline?: string | null
          id?: string
          privacy_consent_at?: string | null
          privacy_consent_version?: string | null
          resume_context?: Json | null
          target_role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      resume_templates: {
        Row: {
          ats_safe: boolean
          created_at: string
          description: string | null
          family: string
          id: string
          is_active: boolean
          layout_key: string
          name: string
          preview_image_url: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          ats_safe?: boolean
          created_at?: string
          description?: string | null
          family?: string
          id?: string
          is_active?: boolean
          layout_key: string
          name: string
          preview_image_url?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          ats_safe?: boolean
          created_at?: string
          description?: string | null
          family?: string
          id?: string
          is_active?: boolean
          layout_key?: string
          name?: string
          preview_image_url?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      bullet_library: {
        Row: {
          created_at: string
          id: string
          source_role: string | null
          tags: Json
          text: string
          times_used: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          source_role?: string | null
          tags?: Json
          text: string
          times_used?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          source_role?: string | null
          tags?: Json
          text?: string
          times_used?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bullet_library_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_versions: {
        Row: {
          content: Json
          created_at: string
          id: string
          label: string | null
          reason: string
          resume_id: string
          score: number | null
          title: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          label?: string | null
          reason?: string
          resume_id: string
          score?: number | null
          title?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          label?: string | null
          reason?: string
          resume_id?: string
          score?: number | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_versions_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resume_versions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          content: Json
          created_at: string
          doc_type: string
          id: string
          is_primary: boolean
          is_public: boolean
          last_score: number | null
          share_slug: string | null
          target_role: string | null
          template_id: string | null
          template_slug: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          doc_type?: string
          id?: string
          is_primary?: boolean
          is_public?: boolean
          last_score?: number | null
          share_slug?: string | null
          target_role?: string | null
          template_id?: string | null
          template_slug?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          doc_type?: string
          id?: string
          is_primary?: boolean
          is_public?: boolean
          last_score?: number | null
          share_slug?: string | null
          target_role?: string | null
          template_id?: string | null
          template_slug?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resumes_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "resume_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resumes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_interval: string
          created_at: string
          features: Json
          id: string
          interview_credits_per_period: number
          is_active: boolean
          name: string
          price_cents: number
          slug: string
          sort_order: number
        }
        Insert: {
          billing_interval?: string
          created_at?: string
          features?: Json
          id?: string
          interview_credits_per_period?: number
          is_active?: boolean
          name: string
          price_cents?: number
          slug: string
          sort_order?: number
        }
        Update: {
          billing_interval?: string
          created_at?: string
          features?: Json
          id?: string
          interview_credits_per_period?: number
          is_active?: boolean
          name?: string
          price_cents?: number
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      usage_credits: {
        Row: {
          created_at: string
          id: string
          interviews_limit: number
          interviews_used: number
          period_end: string | null
          period_start: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interviews_limit?: number
          interviews_used?: number
          period_end?: string | null
          period_start?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interviews_limit?: number
          interviews_used?: number
          period_end?: string | null
          period_start?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string
          id: string
          mock_payment_reference: string | null
          plan_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          mock_payment_reference?: string | null
          plan_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          mock_payment_reference?: string | null
          plan_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_signups: {
        Row: {
          created_at: string
          email: string
          goals: string[]
          id: string
          linkedin_url: string | null
          name: string
          pronouns: string | null
          source: string
          stage: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          goals?: string[]
          id?: string
          linkedin_url?: string | null
          name: string
          pronouns?: string | null
          source?: string
          stage?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          goals?: string[]
          id?: string
          linkedin_url?: string | null
          name?: string
          pronouns?: string | null
          source?: string
          stage?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_signups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

