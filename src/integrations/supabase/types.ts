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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      marketplace_profiles: {
        Row: {
          availability: string | null
          bio: string | null
          created_at: string
          display_name: string
          hourly_rate: string | null
          id: string
          portfolio_url: string | null
          rating: number | null
          skills: string[] | null
          total_jobs: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          hourly_rate?: string | null
          id?: string
          portfolio_url?: string | null
          rating?: number | null
          skills?: string[] | null
          total_jobs?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          hourly_rate?: string | null
          id?: string
          portfolio_url?: string | null
          rating?: number | null
          skills?: string[] | null
          total_jobs?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marketplace_proposals: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          message: string
          service_id: string | null
          status: string
          to_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          message: string
          service_id?: string | null
          status?: string
          to_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          message?: string
          service_id?: string | null
          status?: string
          to_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_proposals_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "marketplace_services"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_services: {
        Row: {
          building_id: string
          category: string
          created_at: string
          description: string | null
          id: string
          price_range: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          building_id: string
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          price_range?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          building_id?: string
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          price_range?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workspace_agents: {
        Row: {
          agent_type: string
          building_id: string
          config: Json | null
          created_at: string
          id: string
          model: string | null
          name: string
          skills: string[] | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_type?: string
          building_id: string
          config?: Json | null
          created_at?: string
          id?: string
          model?: string | null
          name: string
          skills?: string[] | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_type?: string
          building_id?: string
          config?: Json | null
          created_at?: string
          id?: string
          model?: string | null
          name?: string
          skills?: string[] | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workspace_messengers: {
        Row: {
          agent_id: string | null
          bot_token_configured: boolean | null
          building_id: string
          created_at: string
          id: string
          platform: string
          status: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          bot_token_configured?: boolean | null
          building_id: string
          created_at?: string
          id?: string
          platform: string
          status?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          bot_token_configured?: boolean | null
          building_id?: string
          created_at?: string
          id?: string
          platform?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_messengers_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "workspace_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_prompts: {
        Row: {
          building_id: string | null
          category: string | null
          content: string
          created_at: string
          id: string
          is_public: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
          usage_count: number | null
          user_id: string
          version: number | null
        }
        Insert: {
          building_id?: string | null
          category?: string | null
          content: string
          created_at?: string
          id?: string
          is_public?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
          usage_count?: number | null
          user_id: string
          version?: number | null
        }
        Update: {
          building_id?: string | null
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          is_public?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          usage_count?: number | null
          user_id?: string
          version?: number | null
        }
        Relationships: []
      }
      workspace_skills: {
        Row: {
          category: string | null
          config: Json | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_system: boolean | null
          name: string
        }
        Insert: {
          category?: string | null
          config?: Json | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name: string
        }
        Update: {
          category?: string | null
          config?: Json | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
        }
        Relationships: []
      }
      workspace_tasks: {
        Row: {
          agent_id: string | null
          building_id: string
          completed_at: string | null
          created_at: string
          id: string
          result: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          building_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          result?: string | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          building_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          result?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_tasks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "workspace_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_workflows: {
        Row: {
          agent_id: string | null
          building_id: string
          created_at: string
          description: string | null
          id: string
          last_run_at: string | null
          name: string
          provider: string
          run_count: number | null
          status: string
          updated_at: string
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          agent_id?: string | null
          building_id: string
          created_at?: string
          description?: string | null
          id?: string
          last_run_at?: string | null
          name: string
          provider?: string
          run_count?: number | null
          status?: string
          updated_at?: string
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          agent_id?: string | null
          building_id?: string
          created_at?: string
          description?: string | null
          id?: string
          last_run_at?: string | null
          name?: string
          provider?: string
          run_count?: number | null
          status?: string
          updated_at?: string
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspace_workflows_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "workspace_agents"
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
  public: {
    Enums: {},
  },
} as const
