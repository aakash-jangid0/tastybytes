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
      staff: {
        Row: {
          id: string
          user_id: string | null
          full_name: string
          email: string
          phone: string | null
          role: string
          joining_date: string
          monthly_salary: number
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          full_name: string
          email: string
          phone?: string | null
          role: string
          joining_date: string
          monthly_salary: number
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          full_name?: string
          email?: string
          phone?: string | null
          role?: string
          joining_date?: string
          monthly_salary?: number
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string | null
          phone: string | null
          role: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          phone?: string | null
          role?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          phone?: string | null
          role?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax: number
          discount: number
          total_amount: number
          payment_status: Database["public"]["Enums"]["payment_status"]
          customer_name: string | null
          customer_phone: string | null
          table_number: string | null
          order_type: string | null
          payment_method: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax?: number
          discount?: number
          total_amount: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          customer_name?: string | null
          customer_phone?: string | null
          table_number?: string | null
          order_type?: string | null
          payment_method?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax?: number
          discount?: number
          total_amount?: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          customer_name?: string | null
          customer_phone?: string | null
          table_number?: string | null
          order_type?: string | null
          payment_method?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string | null
          name: string
          quantity: number
          price: number
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          order_id?: string | null
          name: string
          quantity: number
          price: number
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          order_id?: string | null
          name?: string
          quantity?: number
          price?: number
          notes?: string | null
          created_at?: string | null
        }
      }
      salary_records: {
        Row: {
          id: string
          staff_id: string
          month: number
          year: number
          total_working_days: number
          days_worked: number
          monthly_salary: number
          amount_paid: number
          status: string
          note: string | null
          paid_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          staff_id: string
          month: number
          year: number
          total_working_days: number
          days_worked: number
          monthly_salary: number
          amount_paid: number
          status?: string
          note?: string | null
          paid_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          staff_id?: string
          month?: number
          year?: number
          total_working_days?: number
          days_worked?: number
          monthly_salary?: number
          amount_paid?: number
          status?: string
          note?: string | null
          paid_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      menu_items: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          image: string
          category: string
          preparation_time: number
          is_available: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description: string
          price: number
          image: string
          category: string
          preparation_time: number
          is_available?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          image?: string
          category?: string
          preparation_time?: number
          is_available?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Enums: {
      order_status: "pending" | "preparing" | "ready" | "delivered" | "cancelled"
      payment_status: "pending" | "completed" | "failed"
    }
  }
}