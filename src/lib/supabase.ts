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

// User roles enum
export type UserRole = 'super_admin' | 'tenant_admin' | 'tenant_user'

// Database types (we'll expand this as we build features)
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          role: UserRole
          tenant_id: string | null
          full_name: string | null
          status: 'active' | 'inactive' | 'suspended'
          last_login: string | null
          created_by: string | null
          permissions: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role: UserRole
          tenant_id?: string | null
          full_name?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          last_login?: string | null
          created_by?: string | null
          permissions?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: UserRole
          tenant_id?: string | null
          full_name?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          last_login?: string | null
          created_by?: string | null
          permissions?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      tenants: {
        Row: {
          id: string
          name: string
          address: string | null
          contact_info: string | null
          status: 'active' | 'inactive' | 'suspended'
          settings: Record<string, any>
          subscription_plan: string
          max_users: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          contact_info?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          settings?: Record<string, any>
          subscription_plan?: string
          max_users?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          contact_info?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          settings?: Record<string, any>
          subscription_plan?: string
          max_users?: number
          created_by?: string | null
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
          cost: number
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
          cost?: number
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
          cost?: number
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
