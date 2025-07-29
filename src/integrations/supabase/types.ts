export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "scenario_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_usage: {
        Row: {
          category: string
          created_at: string
          id: string
          question: string
          used_with: string | null
          user_id: string
          was_helpful: boolean | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          question: string
          used_with?: string | null
          user_id: string
          was_helpful?: boolean | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          question?: string
          used_with?: string | null
          user_id?: string
          was_helpful?: boolean | null
        }
        Relationships: []
      }
      dating_prospects: {
        Row: {
          attractiveness_rating: number | null
          created_at: string
          flags: Json | null
          id: string
          is_active: boolean | null
          nickname: string
          notes: string | null
          overall_ranking: number
          updated_at: string
          user_id: string
        }
        Insert: {
          attractiveness_rating?: number | null
          created_at?: string
          flags?: Json | null
          id?: string
          is_active?: boolean | null
          nickname: string
          notes?: string | null
          overall_ranking?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          attractiveness_rating?: number | null
          created_at?: string
          flags?: Json | null
          id?: string
          is_active?: boolean | null
          nickname?: string
          notes?: string | null
          overall_ranking?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          entry_type: string | null
          id: string
          mood_rating: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entry_type?: string | null
          id?: string
          mood_rating?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_type?: string | null
          id?: string
          mood_rating?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mental_health_checkins: {
        Row: {
          ai_recommendation: string | null
          anxious_thoughts: number
          checkin_date: string
          created_at: string
          depressive_thoughts: number
          energy_level: number
          id: string
          mental_clarity: number
          stress_level: number
          user_id: string
        }
        Insert: {
          ai_recommendation?: string | null
          anxious_thoughts: number
          checkin_date?: string
          created_at?: string
          depressive_thoughts: number
          energy_level: number
          id?: string
          mental_clarity: number
          stress_level: number
          user_id: string
        }
        Update: {
          ai_recommendation?: string | null
          anxious_thoughts?: number
          checkin_date?: string
          created_at?: string
          depressive_thoughts?: number
          energy_level?: number
          id?: string
          mental_clarity?: number
          stress_level?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          gender: string | null
          id: string
          love_language: string | null
          personality_type: string | null
          relationship_status: string | null
          updated_at: string
        }
        Insert: {
          age?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          love_language?: string | null
          personality_type?: string | null
          relationship_status?: string | null
          updated_at?: string
        }
        Update: {
          age?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          love_language?: string | null
          personality_type?: string | null
          relationship_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      scenario_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_comment_id: string | null
          scenario_index: number
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          scenario_index: number
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          scenario_index?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenario_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "scenario_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_interactions: {
        Row: {
          created_at: string
          id: string
          interaction_type: string
          scenario_index: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_type: string
          scenario_index: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_type?: string
          scenario_index?: number
          user_id?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          daily_reminders: boolean | null
          id: string
          onboarding_completed: boolean | null
          push_notifications: boolean | null
          theme_preference: string | null
          therapy_reminders: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_reminders?: boolean | null
          id?: string
          onboarding_completed?: boolean | null
          push_notifications?: boolean | null
          theme_preference?: string | null
          therapy_reminders?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_reminders?: boolean | null
          id?: string
          onboarding_completed?: boolean | null
          push_notifications?: boolean | null
          theme_preference?: string | null
          therapy_reminders?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
  public: {
    Enums: {},
  },
} as const
