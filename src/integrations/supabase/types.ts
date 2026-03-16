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
      agent_activity_log: {
        Row: {
          action_type: string
          agent_id: string
          agent_name: string
          building_id: string | null
          created_at: string
          description: string
          id: string
          metadata: Json | null
        }
        Insert: {
          action_type?: string
          agent_id: string
          agent_name: string
          building_id?: string | null
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          action_type?: string
          agent_id?: string
          agent_name?: string
          building_id?: string | null
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      agent_creations: {
        Row: {
          agent_id: string
          agent_name: string
          building_id: string | null
          content: string | null
          created_at: string
          creation_type: string
          id: string
          reactions: number | null
          reuse_count: number | null
          tags: string[] | null
          title: string
        }
        Insert: {
          agent_id: string
          agent_name: string
          building_id?: string | null
          content?: string | null
          created_at?: string
          creation_type?: string
          id?: string
          reactions?: number | null
          reuse_count?: number | null
          tags?: string[] | null
          title: string
        }
        Update: {
          agent_id?: string
          agent_name?: string
          building_id?: string | null
          content?: string | null
          created_at?: string
          creation_type?: string
          id?: string
          reactions?: number | null
          reuse_count?: number | null
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      agent_protocols: {
        Row: {
          created_at: string
          from_agent: string
          id: string
          message: string | null
          metadata: Json | null
          protocol_type: string
          resolved_at: string | null
          status: string | null
          to_agent: string
        }
        Insert: {
          created_at?: string
          from_agent: string
          id?: string
          message?: string | null
          metadata?: Json | null
          protocol_type?: string
          resolved_at?: string | null
          status?: string | null
          to_agent: string
        }
        Update: {
          created_at?: string
          from_agent?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          protocol_type?: string
          resolved_at?: string | null
          status?: string | null
          to_agent?: string
        }
        Relationships: []
      }
      business_offers: {
        Row: {
          business_id: string
          created_at: string
          from_user_id: string
          id: string
          message: string | null
          offer_amount: number
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          from_user_id: string
          id?: string
          message?: string | null
          offer_amount: number
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          from_user_id?: string
          id?: string
          message?: string | null
          offer_amount?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_offers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "digital_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_channels: {
        Row: {
          building_id: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          type: string
        }
        Insert: {
          building_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          type?: string
        }
        Update: {
          building_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          author_name: string
          channel_id: string
          content: string
          created_at: string
          file_name: string | null
          file_size: string | null
          id: string
          thread_id: string | null
          user_id: string
        }
        Insert: {
          author_name: string
          channel_id: string
          content: string
          created_at?: string
          file_name?: string | null
          file_size?: string | null
          id?: string
          thread_id?: string | null
          user_id: string
        }
        Update: {
          author_name?: string
          channel_id?: string
          content?: string
          created_at?: string
          file_name?: string | null
          file_size?: string | null
          id?: string
          thread_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      city_events: {
        Row: {
          agents_involved: string[] | null
          created_at: string
          description: string | null
          event_type: string
          id: string
          importance: number | null
          metadata: Json | null
          title: string
        }
        Insert: {
          agents_involved?: string[] | null
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          importance?: number | null
          metadata?: Json | null
          title: string
        }
        Update: {
          agents_involved?: string[] | null
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          importance?: number | null
          metadata?: Json | null
          title?: string
        }
        Relationships: []
      }
      digital_businesses: {
        Row: {
          building_id: string | null
          business_model: string | null
          category: string
          category_data: Json | null
          country: string | null
          created_at: string
          description: string | null
          founded_at: string | null
          founder_name: string
          growth_percent: number | null
          growth_rate: number | null
          id: string
          logo_url: string | null
          mrr: number
          name: string
          owner_id: string
          product_url: string | null
          profit: number | null
          revenue_multiple: number | null
          sale_price: number | null
          status: string
          team_size: number | null
          updated_at: string
        }
        Insert: {
          building_id?: string | null
          business_model?: string | null
          category?: string
          category_data?: Json | null
          country?: string | null
          created_at?: string
          description?: string | null
          founded_at?: string | null
          founder_name?: string
          growth_percent?: number | null
          growth_rate?: number | null
          id?: string
          logo_url?: string | null
          mrr?: number
          name: string
          owner_id: string
          product_url?: string | null
          profit?: number | null
          revenue_multiple?: number | null
          sale_price?: number | null
          status?: string
          team_size?: number | null
          updated_at?: string
        }
        Update: {
          building_id?: string | null
          business_model?: string | null
          category?: string
          category_data?: Json | null
          country?: string | null
          created_at?: string
          description?: string | null
          founded_at?: string | null
          founder_name?: string
          growth_percent?: number | null
          growth_rate?: number | null
          id?: string
          logo_url?: string | null
          mrr?: number
          name?: string
          owner_id?: string
          product_url?: string | null
          profit?: number | null
          revenue_multiple?: number | null
          sale_price?: number | null
          status?: string
          team_size?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      emergent_terms: {
        Row: {
          agents_using: string[] | null
          category: string | null
          created_at: string
          estimated_meaning: string | null
          first_seen_at: string
          id: string
          occurrences: number | null
          status: string | null
          term: string
          updated_at: string
        }
        Insert: {
          agents_using?: string[] | null
          category?: string | null
          created_at?: string
          estimated_meaning?: string | null
          first_seen_at?: string
          id?: string
          occurrences?: number | null
          status?: string | null
          term: string
          updated_at?: string
        }
        Update: {
          agents_using?: string[] | null
          category?: string | null
          created_at?: string
          estimated_meaning?: string | null
          first_seen_at?: string
          id?: string
          occurrences?: number | null
          status?: string | null
          term?: string
          updated_at?: string
        }
        Relationships: []
      }
      emergent_workflows: {
        Row: {
          description: string | null
          detection_count: number | null
          first_detected_at: string
          id: string
          is_saved: boolean | null
          last_detected_at: string
          name: string
          saved_by: string | null
          sequence: Json
        }
        Insert: {
          description?: string | null
          detection_count?: number | null
          first_detected_at?: string
          id?: string
          is_saved?: boolean | null
          last_detected_at?: string
          name: string
          saved_by?: string | null
          sequence?: Json
        }
        Update: {
          description?: string | null
          detection_count?: number | null
          first_detected_at?: string
          id?: string
          is_saved?: boolean | null
          last_detected_at?: string
          name?: string
          saved_by?: string | null
          sequence?: Json
        }
        Relationships: []
      }
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
      meeting_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          meeting_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          meeting_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          meeting_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_notes_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_participants: {
        Row: {
          id: string
          joined_at: string | null
          meeting_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          meeting_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          meeting_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          building_id: string | null
          created_at: string
          created_by: string
          duration_minutes: number
          external_link: string | null
          id: string
          room: string
          scheduled_at: string
          status: string
          title: string
        }
        Insert: {
          building_id?: string | null
          created_at?: string
          created_by: string
          duration_minutes?: number
          external_link?: string | null
          id?: string
          room: string
          scheduled_at?: string
          status?: string
          title: string
        }
        Update: {
          building_id?: string | null
          created_at?: string
          created_by?: string
          duration_minutes?: number
          external_link?: string | null
          id?: string
          room?: string
          scheduled_at?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          building_id: string | null
          city: string | null
          company_name: string | null
          created_at: string
          display_name: string
          id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          building_id?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string
          id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          building_id?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string
          id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          category: string
          created_at: string
          id: string
          log_type: string
          message: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          log_type?: string
          message: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          log_type?: string
          message?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          building_id: string | null
          id: string
          last_seen: string
          position_x: number | null
          position_y: number | null
          position_z: number | null
          status: string
          user_id: string
        }
        Insert: {
          building_id?: string | null
          id?: string
          last_seen?: string
          position_x?: number | null
          position_y?: number | null
          position_z?: number | null
          status?: string
          user_id: string
        }
        Update: {
          building_id?: string | null
          id?: string
          last_seen?: string
          position_x?: number | null
          position_y?: number | null
          position_z?: number | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      admin_get_counts: { Args: never; Returns: Json }
      admin_list_profiles: {
        Args: never
        Returns: {
          avatar_url: string | null
          building_id: string | null
          city: string | null
          company_name: string | null
          created_at: string
          display_name: string
          id: string
          status: string | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "member" | "guest"
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
    Enums: {
      app_role: ["admin", "manager", "member", "guest"],
    },
  },
} as const
