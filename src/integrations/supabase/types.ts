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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          coin_symbol: string
          condition_type: string
          created_at: string
          id: string
          is_active: boolean
          source_label: string | null
          source_type: string
          target_price: number
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          coin_symbol: string
          condition_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          source_label?: string | null
          source_type?: string
          target_price: number
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          coin_symbol?: string
          condition_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          source_label?: string | null
          source_type?: string
          target_price?: number
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cache_crypto_data: {
        Row: {
          change_24h: number | null
          last_updated: string
          market_cap: number | null
          price: number | null
          symbol: string
          volume: number | null
        }
        Insert: {
          change_24h?: number | null
          last_updated?: string
          market_cap?: number | null
          price?: number | null
          symbol: string
          volume?: number | null
        }
        Update: {
          change_24h?: number | null
          last_updated?: string
          market_cap?: number | null
          price?: number | null
          symbol?: string
          volume?: number | null
        }
        Relationships: []
      }
      cache_fear_greed: {
        Row: {
          id: string
          last_updated: string
          value: number
          value_classification: string
        }
        Insert: {
          id?: string
          last_updated?: string
          value?: number
          value_classification?: string
        }
        Update: {
          id?: string
          last_updated?: string
          value?: number
          value_classification?: string
        }
        Relationships: []
      }
      cache_news: {
        Row: {
          fetched_at: string
          id: string
          published_at: string | null
          source: string | null
          summary: string | null
          title: string
          url: string
        }
        Insert: {
          fetched_at?: string
          id?: string
          published_at?: string | null
          source?: string | null
          summary?: string | null
          title: string
          url: string
        }
        Update: {
          fetched_at?: string
          id?: string
          published_at?: string | null
          source?: string | null
          summary?: string | null
          title?: string
          url?: string
        }
        Relationships: []
      }
      dashboards: {
        Row: {
          created_at: string
          id: string
          layout_json: Json
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          layout_json?: Json
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          layout_json?: Json
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          event_data: Json
          event_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json
          event_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json
          event_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          payment_method: string | null
          promo_code_id: string | null
          refund_status: string | null
          status: string
          subscription_id: string | null
          subscription_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          promo_code_id?: string | null
          refund_status?: string | null
          status?: string
          subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          promo_code_id?: string | null
          refund_status?: string | null
          status?: string
          subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_payments_promo"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          plan: string
          trial_ends_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          plan?: string
          trial_ends_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          plan?: string
          trial_ends_at?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          current_uses: number
          discount_type: string
          discount_value: number
          expires_at: string | null
          first_time_only: boolean
          id: string
          is_active: boolean
          max_uses: number | null
          revenue_generated: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          discount_type?: string
          discount_value: number
          expires_at?: string | null
          first_time_only?: boolean
          id?: string
          is_active?: boolean
          max_uses?: number | null
          revenue_generated?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          first_time_only?: boolean
          id?: string
          is_active?: boolean
          max_uses?: number | null
          revenue_generated?: number
          updated_at?: string
        }
        Relationships: []
      }
      promo_usage: {
        Row: {
          created_at: string
          discount_amount: number
          id: string
          payment_id: string | null
          promo_code_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discount_amount?: number
          id?: string
          payment_id?: string | null
          promo_code_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          discount_amount?: number
          id?: string
          payment_id?: string | null
          promo_code_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_usage_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_usage_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      public_templates: {
        Row: {
          clone_count: number
          created_at: string
          created_by: string
          id: string
          is_public: boolean
          layout_json: Json
          name: string
          public_share_id: string | null
          use_count: number
          widgets_json: Json
        }
        Insert: {
          clone_count?: number
          created_at?: string
          created_by: string
          id?: string
          is_public?: boolean
          layout_json?: Json
          name: string
          public_share_id?: string | null
          use_count?: number
          widgets_json?: Json
        }
        Update: {
          clone_count?: number
          created_at?: string
          created_by?: string
          id?: string
          is_public?: boolean
          layout_json?: Json
          name?: string
          public_share_id?: string | null
          use_count?: number
          widgets_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "public_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          created_at: string
          id: string
          message: string | null
          metadata: Json | null
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          status: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          status?: string
          type?: string
        }
        Relationships: []
      }
      triggered_alerts: {
        Row: {
          alert_id: string
          coin_symbol: string
          created_at: string
          id: string
          triggered_price: number
          user_id: string
        }
        Insert: {
          alert_id: string
          coin_symbol: string
          created_at?: string
          id?: string
          triggered_price: number
          user_id: string
        }
        Update: {
          alert_id?: string
          coin_symbol?: string
          created_at?: string
          id?: string
          triggered_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "triggered_alerts_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "triggered_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      widgets: {
        Row: {
          config_json: Json
          created_at: string
          dashboard_id: string
          height: number
          id: string
          position_x: number
          position_y: number
          type: string
          width: number
        }
        Insert: {
          config_json?: Json
          created_at?: string
          dashboard_id: string
          height?: number
          id?: string
          position_x?: number
          position_y?: number
          type: string
          width?: number
        }
        Update: {
          config_json?: Json
          created_at?: string
          dashboard_id?: string
          height?: number
          id?: string
          position_x?: number
          position_y?: number
          type?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "widgets_dashboard_id_fkey"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "dashboards"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      count_dashboard_widgets: {
        Args: { _dashboard_id: string }
        Returns: number
      }
      count_user_alerts: { Args: { _user_id: string }; Returns: number }
      count_user_dashboards: { Args: { _user_id: string }; Returns: number }
      get_user_plan: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      owns_dashboard: { Args: { _dashboard_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
