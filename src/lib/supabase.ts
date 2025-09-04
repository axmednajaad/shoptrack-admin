import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database types (we'll expand this as we build features)
export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          address: string | null
          contact_info: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          contact_info?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          contact_info?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: number
          tenant_id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          tenant_id: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          tenant_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: number
          tenant_id: string
          name: string
          price: number
          stock_quantity: number
          category_id: number | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          tenant_id: string
          name: string
          price: number
          stock_quantity?: number
          category_id?: number | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          tenant_id?: string
          name?: string
          price?: number
          stock_quantity?: number
          category_id?: number | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
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
  }
}
