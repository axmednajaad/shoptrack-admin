import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Customer = Database['public']['Tables']['customers']['Row']
type CustomerInsert = Database['public']['Tables']['customers']['Insert']
type CustomerUpdate = Database['public']['Tables']['customers']['Update']

export interface CustomerWithStats extends Customer {
  order_count?: number
  total_spent?: number
  last_order_date?: string
}

export interface CustomerStats {
  total_customers: number
  active_customers: number
  new_customers_this_month: number
  new_customers_this_week: number
  total_revenue: number
  average_order_value: number
}

export interface CreateCustomerData {
  name: string
  email?: string
  phone?: string
  address?: string
}

export class CustomerService {
  // Get all customers for the current tenant
  static async getAllCustomers(filters?: {
    search?: string
    limit?: number
    offset?: number
  }): Promise<{ data: Customer[] | null; error: any }> {
    try {
      // Get current user's tenant
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } }
      }

      // Get user's tenant_id
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!userProfile?.tenant_id) {
        return { data: null, error: { message: 'User not assigned to a tenant' } }
      }

      let query = supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', userProfile.tenant_id)

      // Apply search filter
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
      }

      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get customer by ID (within current tenant)
  static async getCustomerById(id: number): Promise<{ data: Customer | null; error: any }> {
    try {
      // Get current user's tenant
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } }
      }

      // Get user's tenant_id
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!userProfile?.tenant_id) {
        return { data: null, error: { message: 'User not assigned to a tenant' } }
      }

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', userProfile.tenant_id)
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Create new customer
  static async createCustomer(customerData: CreateCustomerData): Promise<{ data: Customer | null; error: any }> {
    try {
      // Get current user's tenant
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } }
      }

      // Get user's tenant_id
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!userProfile?.tenant_id) {
        return { data: null, error: { message: 'User not assigned to a tenant' } }
      }

      const insertData: CustomerInsert = {
        tenant_id: userProfile.tenant_id,
        name: customerData.name,
        email: customerData.email || null,
        phone: customerData.phone || null,
        address: customerData.address || null
      }

      const { data, error } = await supabase
        .from('customers')
        .insert([insertData])
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Update customer
  static async updateCustomer(id: number, updates: CustomerUpdate): Promise<{ data: Customer | null; error: any }> {
    try {
      // Get current user's tenant
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } }
      }

      // Get user's tenant_id
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!userProfile?.tenant_id) {
        return { data: null, error: { message: 'User not assigned to a tenant' } }
      }

      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .eq('tenant_id', userProfile.tenant_id)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Delete customer
  static async deleteCustomer(id: number): Promise<{ error: any }> {
    try {
      // Get current user's tenant
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { error: { message: 'User not authenticated' } }
      }

      // Get user's tenant_id
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!userProfile?.tenant_id) {
        return { error: { message: 'User not assigned to a tenant' } }
      }

      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
        .eq('tenant_id', userProfile.tenant_id)

      return { error }
    } catch (error) {
      return { error }
    }
  }

  // Get customer statistics for current tenant
  static async getCustomerStats(): Promise<{ data: CustomerStats | null; error: any }> {
    try {
      // Get current user's tenant
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } }
      }

      // Get user's tenant_id
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!userProfile?.tenant_id) {
        return { data: null, error: { message: 'User not assigned to a tenant' } }
      }

      // Get total customers
      const { count: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', userProfile.tenant_id)

      // Get new customers this month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count: newCustomersThisMonth } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', userProfile.tenant_id)
        .gte('created_at', startOfMonth.toISOString())

      // Get new customers this week
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      startOfWeek.setHours(0, 0, 0, 0)

      const { count: newCustomersThisWeek } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', userProfile.tenant_id)
        .gte('created_at', startOfWeek.toISOString())

      const stats: CustomerStats = {
        total_customers: totalCustomers || 0,
        active_customers: totalCustomers || 0, // All customers are considered active for now
        new_customers_this_month: newCustomersThisMonth || 0,
        new_customers_this_week: newCustomersThisWeek || 0,
        total_revenue: 0, // Would need orders table to calculate
        average_order_value: 0 // Would need orders table to calculate
      }

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Search customers
  static async searchCustomers(searchTerm: string, limit: number = 10): Promise<{ data: Customer[] | null; error: any }> {
    return this.getAllCustomers({
      search: searchTerm,
      limit
    })
  }

  // Get recent customers
  static async getRecentCustomers(limit: number = 5): Promise<{ data: Customer[] | null; error: any }> {
    return this.getAllCustomers({
      limit
    })
  }
}
