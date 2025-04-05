export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          additional_notes: string | null
          booking_date: string | null
          coins_earned: number
          coins_used: number
          created_at: string
          customer_email: string | null
          customer_phone: string | null
          id: string
          merchant_id: string
          payment_id: string | null
          salon_id: string | null
          salon_name: string | null
          service_duration: number | null
          service_name: string
          service_price: number | null
          slot_id: string
          status: string
          time_slot: string | null
          updated_at: string
          user_id: string
          worker_id: string | null
        }
        Insert: {
          additional_notes?: string | null
          booking_date?: string | null
          coins_earned?: number
          coins_used?: number
          created_at?: string
          customer_email?: string | null
          customer_phone?: string | null
          id?: string
          merchant_id: string
          payment_id?: string | null
          salon_id?: string | null
          salon_name?: string | null
          service_duration?: number | null
          service_name: string
          service_price?: number | null
          slot_id: string
          status?: string
          time_slot?: string | null
          updated_at?: string
          user_id: string
          worker_id?: string | null
        }
        Update: {
          additional_notes?: string | null
          booking_date?: string | null
          coins_earned?: number
          coins_used?: number
          created_at?: string
          customer_email?: string | null
          customer_phone?: string | null
          id?: string
          merchant_id?: string
          payment_id?: string | null
          salon_id?: string | null
          salon_name?: string | null
          service_duration?: number | null
          service_name?: string
          service_price?: number | null
          slot_id?: string
          status?: string
          time_slot?: string | null
          updated_at?: string
          user_id?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_payment_details: {
        Row: {
          account_name: string
          account_number: string
          created_at: string
          id: string
          ifsc_code: string
          merchant_id: string
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          account_name: string
          account_number: string
          created_at?: string
          id?: string
          ifsc_code: string
          merchant_id: string
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          account_name?: string
          account_number?: string
          created_at?: string
          id?: string
          ifsc_code?: string
          merchant_id?: string
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_payment_details_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_settings: {
        Row: {
          break_end: string | null
          break_start: string | null
          created_at: string
          merchant_id: string
          total_workers: number
          updated_at: string
          worker_assignment_strategy: string
          working_hours_end: string
          working_hours_start: string
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          created_at?: string
          merchant_id: string
          total_workers?: number
          updated_at?: string
          worker_assignment_strategy?: string
          working_hours_end?: string
          working_hours_start?: string
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          created_at?: string
          merchant_id?: string
          total_workers?: number
          updated_at?: string
          worker_assignment_strategy?: string
          working_hours_end?: string
          working_hours_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_settings_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchants: {
        Row: {
          business_address: string
          business_email: string
          business_name: string
          business_phone: string
          created_at: string
          id: string
          service_category: string
          status: string
          updated_at: string
        }
        Insert: {
          business_address: string
          business_email: string
          business_name: string
          business_phone: string
          created_at?: string
          id?: string
          service_category: string
          status?: string
          updated_at?: string
        }
        Update: {
          business_address?: string
          business_email?: string
          business_name?: string
          business_phone?: string
          created_at?: string
          id?: string
          service_category?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          admin_commission: number
          amount: number
          booking_id: string | null
          coins_earned: number
          coins_used: number
          created_at: string | null
          id: string
          merchant_amount: number
          merchant_id: string | null
          payment_method: string
          payment_status: string
          platform_fee: number
          transaction_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_commission?: number
          amount: number
          booking_id?: string | null
          coins_earned?: number
          coins_used?: number
          created_at?: string | null
          id?: string
          merchant_amount?: number
          merchant_id?: string | null
          payment_method: string
          payment_status?: string
          platform_fee?: number
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_commission?: number
          amount?: number
          booking_id?: string | null
          coins_earned?: number
          coins_used?: number
          created_at?: string | null
          id?: string
          merchant_amount?: number
          merchant_id?: string | null
          payment_method?: string
          payment_status?: string
          platform_fee?: number
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          coins: number | null
          created_at: string
          gender: string | null
          id: string
          is_admin: boolean | null
          is_merchant: boolean | null
          phone_number: string | null
          updated_at: string
          username: string
        }
        Insert: {
          age?: number | null
          coins?: number | null
          created_at?: string
          gender?: string | null
          id: string
          is_admin?: boolean | null
          is_merchant?: boolean | null
          phone_number?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          age?: number | null
          coins?: number | null
          created_at?: string
          gender?: string | null
          id?: string
          is_admin?: boolean | null
          is_merchant?: boolean | null
          phone_number?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string
          duration: number
          id: string
          merchant_id: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          duration?: number
          id?: string
          merchant_id: string
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          duration?: number
          id?: string
          merchant_id?: string
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      slots: {
        Row: {
          created_at: string
          date: string
          end_time: string
          id: string
          is_booked: boolean
          merchant_id: string
          salon_id: string | null
          service_duration: number | null
          service_id: string | null
          service_name: string | null
          service_price: number | null
          start_time: string
          updated_at: string
          worker_id: string | null
        }
        Insert: {
          created_at?: string
          date: string
          end_time: string
          id?: string
          is_booked?: boolean
          merchant_id: string
          salon_id?: string | null
          service_duration?: number | null
          service_id?: string | null
          service_name?: string | null
          service_price?: number | null
          start_time: string
          updated_at?: string
          worker_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          is_booked?: boolean
          merchant_id?: string
          salon_id?: string | null
          service_duration?: number | null
          service_id?: string | null
          service_name?: string | null
          service_price?: number | null
          start_time?: string
          updated_at?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "slots_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slots_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slots_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_unavailability: {
        Row: {
          created_at: string
          date: string
          end_time: string
          id: string
          reason: string | null
          start_time: string
          updated_at: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time: string
          id?: string
          reason?: string | null
          start_time: string
          updated_at?: string
          worker_id: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          reason?: string | null
          start_time?: string
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_unavailability_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      workers: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          merchant_id: string
          name: string
          notes: string | null
          specialty: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          merchant_id: string
          name: string
          notes?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          merchant_id?: string
          name?: string
          notes?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workers_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      insert_merchant_record: {
        Args: {
          user_id: string
          b_name: string
          b_address: string
          b_email: string
          b_phone: string
          s_category: string
          merchant_status?: string
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
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
