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
      activity_feed: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          group_id: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description: string
          group_id: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          group_id?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      card_configurations: {
        Row: {
          card_name: string
          card_type: string
          closing_day: number | null
          created_at: string
          created_by: string
          due_day: number | null
          group_id: string
          id: string
          updated_at: string
        }
        Insert: {
          card_name: string
          card_type: string
          closing_day?: number | null
          created_at?: string
          created_by: string
          due_day?: number | null
          group_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          card_name?: string
          card_type?: string
          closing_day?: number | null
          created_at?: string
          created_by?: string
          due_day?: number | null
          group_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          color: string
          created_at: string
          created_by: string
          group_id: string
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by: string
          group_id: string
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string
          group_id?: string
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_splits: {
        Row: {
          created_at: string
          created_by: string
          group_id: string
          id: string
          split_name: string
          total_amount: number
          transaction_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          group_id: string
          id?: string
          split_name: string
          total_amount: number
          transaction_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          group_id?: string
          id?: string
          split_name?: string
          total_amount?: number
          transaction_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string
          description: string
          due_date: string | null
          group_id: string
          id: string
          is_recurring: boolean | null
          next_due_date: string | null
          recurrence_type: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by: string
          description: string
          due_date?: string | null
          group_id: string
          id?: string
          is_recurring?: boolean | null
          next_due_date?: string | null
          recurrence_type?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string
          description?: string
          due_date?: string | null
          group_id?: string
          id?: string
          is_recurring?: boolean | null
          next_due_date?: string | null
          recurrence_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          card_name: string
          card_type: string
          category: string
          created_at: string
          created_by: string
          date: string
          description: string
          group_id: string
          id: string
          installment_number: number | null
          installments: number | null
          is_recurring: boolean | null
          updated_at: string
        }
        Insert: {
          amount: number
          card_name: string
          card_type: string
          category: string
          created_at?: string
          created_by: string
          date: string
          description: string
          group_id: string
          id?: string
          installment_number?: number | null
          installments?: number | null
          is_recurring?: boolean | null
          updated_at?: string
        }
        Update: {
          amount?: number
          card_name?: string
          card_type?: string
          category?: string
          created_at?: string
          created_by?: string
          date?: string
          description?: string
          group_id?: string
          id?: string
          installment_number?: number | null
          installments?: number | null
          is_recurring?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          image_url: string | null
          invite_code: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          image_url?: string | null
          invite_code?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          image_url?: string | null
          invite_code?: string
          name?: string
        }
        Relationships: []
      }
      income_entries: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          date: string
          description: string
          group_id: string
          id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          date?: string
          description: string
          group_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          date?: string
          description?: string
          group_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      installment_tracking: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          due_month: number
          due_year: number
          group_id: string
          id: string
          installment_number: number
          is_paid: boolean | null
          paid_at: string | null
          total_installments: number
          transaction_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          due_month: number
          due_year: number
          group_id: string
          id?: string
          installment_number: number
          is_paid?: boolean | null
          paid_at?: string | null
          total_installments: number
          transaction_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          due_month?: number
          due_year?: number
          group_id?: string
          id?: string
          installment_number?: number
          is_paid?: boolean | null
          paid_at?: string | null
          total_installments?: number
          transaction_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          group_id: string
          id: string
          minimum_stock: number | null
          name: string
          quantity: number | null
          unit: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by: string
          group_id: string
          id?: string
          minimum_stock?: number | null
          name: string
          quantity?: number | null
          unit?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string
          group_id?: string
          id?: string
          minimum_stock?: number | null
          name?: string
          quantity?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
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
          is_profile_public: boolean | null
          name: string | null
          show_email_in_groups: boolean | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          is_profile_public?: boolean | null
          name?: string | null
          show_email_in_groups?: boolean | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_profile_public?: boolean | null
          name?: string | null
          show_email_in_groups?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      split_payments: {
        Row: {
          amount_owed: number
          amount_paid: number | null
          created_at: string
          id: string
          is_settled: boolean | null
          settled_at: string | null
          split_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_owed: number
          amount_paid?: number | null
          created_at?: string
          id?: string
          is_settled?: boolean | null
          settled_at?: string | null
          split_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_owed?: number
          amount_paid?: number | null
          created_at?: string
          id?: string
          is_settled?: boolean | null
          settled_at?: string | null
          split_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed: boolean | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          group_id: string
          id: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          completed?: boolean | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          group_id: string
          id?: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          completed?: boolean | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          group_id?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_recurring_expenses: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_user_display_info: {
        Args: { target_user_id: string }
        Returns: {
          display_name: string
          show_email: boolean
          user_id: string
        }[]
      }
      is_user_group_member: {
        Args: { group_id: string; user_id: string }
        Returns: boolean
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
