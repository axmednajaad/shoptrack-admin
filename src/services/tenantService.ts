import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Tenant = Database['public']['Tables']['tenants']['Row']
type TenantInsert = Database['public']['Tables']['tenants']['Insert']
type TenantUpdate = Database['public']['Tables']['tenants']['Update']

export interface TenantWithStats extends Tenant {
  user_count?: number
  active_users?: number
}

export interface TenantStats {
  total_tenants: number
  active_tenants: number
  inactive_tenants: number
  suspended_tenants: number
}

export class TenantService {
  // Get all tenants with optional filtering
  static async getAllTenants(filters?: {
    status?: string
    search?: string
    limit?: number
    offset?: number
  }): Promise<{ data: TenantWithStats[] | null; error: any }> {
    try {
      // First get tenants
      let query = supabase
        .from('tenants')
        .select('*')

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,address.ilike.%${filters.search}%`)
      }

      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1)
      }

      query = query.order('created_at', { ascending: false })

      const { data: tenants, error } = await query

      if (error || !tenants) {
        return { data: null, error }
      }

      // Get user counts for each tenant
      const tenantsWithStats: TenantWithStats[] = await Promise.all(
        tenants.map(async (tenant) => {
          const { count: userCount } = await supabase
            .from('user_profiles')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id)

          const { count: activeUserCount } = await supabase
            .from('user_profiles')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id)
            .eq('status', 'active')

          return {
            ...tenant,
            user_count: userCount || 0,
            active_users: activeUserCount || 0
          }
        })
      )

      return { data: tenantsWithStats, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get tenant by ID with detailed information
  static async getTenantById(id: string): Promise<{ data: TenantWithStats | null; error: any }> {
    try {
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !tenant) {
        return { data: null, error }
      }

      // Get user counts for this tenant
      const { count: userCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)

      const { count: activeUserCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')

      const tenantWithStats: TenantWithStats = {
        ...tenant,
        user_count: userCount || 0,
        active_users: activeUserCount || 0
      }

      return { data: tenantWithStats, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Create new tenant
  static async createTenant(tenant: TenantInsert): Promise<{ data: Tenant | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const tenantData: TenantInsert = {
        ...tenant,
        created_by: user?.id,
        status: tenant.status || 'active',
        subscription_plan: tenant.subscription_plan || 'basic',
        max_users: tenant.max_users || 10,
        settings: tenant.settings || {}
      }

      const { data, error } = await supabase
        .from('tenants')
        .insert([tenantData])
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Update tenant
  static async updateTenant(id: string, updates: TenantUpdate): Promise<{ data: Tenant | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Delete tenant
  static async deleteTenant(id: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', id)

      return { error }
    } catch (error) {
      return { error }
    }
  }

  // Get tenant statistics
  static async getTenantStats(): Promise<{ data: TenantStats | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('tenant_stats')
        .select('*')
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Update tenant status
  static async updateTenantStatus(id: string, status: 'active' | 'inactive' | 'suspended'): Promise<{ data: Tenant | null; error: any }> {
    return this.updateTenant(id, { status })
  }

  // Get tenants for dropdown/select
  static async getTenantsForSelect(): Promise<{ data: Array<{ id: string; name: string }> | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name')
        .eq('status', 'active')
        .order('name')

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get tenant users count
  static async getTenantUsersCount(tenantId: string): Promise<{ data: number; error: any }> {
    try {
      const { count, error } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)

      return { data: count || 0, error }
    } catch (error) {
      return { data: 0, error }
    }
  }

  // Check if tenant can add more users
  static async canAddUser(tenantId: string): Promise<{ canAdd: boolean; currentCount: number; maxUsers: number; error: any }> {
    try {
      // Get tenant info
      const { data: tenant, error: tenantError } = await this.getTenantById(tenantId)
      if (tenantError || !tenant) {
        return { canAdd: false, currentCount: 0, maxUsers: 0, error: tenantError }
      }

      // Get current user count
      const { data: currentCount, error: countError } = await this.getTenantUsersCount(tenantId)
      if (countError) {
        return { canAdd: false, currentCount: 0, maxUsers: tenant.max_users, error: countError }
      }

      const canAdd = currentCount < tenant.max_users

      return { canAdd, currentCount, maxUsers: tenant.max_users, error: null }
    } catch (error) {
      return { canAdd: false, currentCount: 0, maxUsers: 0, error }
    }
  }

  // Get tenant activity/audit log
  static async getTenantActivity(tenantId: string, limit: number = 10): Promise<{ data: any[] | null; error: any }> {
    try {
      // Get recent user activities for this tenant
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, role, status, last_login, created_at, updated_at')
        .eq('tenant_id', tenantId)
        .order('updated_at', { ascending: false })
        .limit(limit)

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get tenant settings
  static async getTenantSettings(tenantId: string): Promise<{ data: Record<string, any> | null; error: any }> {
    try {
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('settings')
        .eq('id', tenantId)
        .single()

      if (error) {
        return { data: null, error }
      }

      return { data: tenant.settings || {}, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Update tenant settings
  static async updateTenantSettings(tenantId: string, settings: Record<string, any>): Promise<{ data: Tenant | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .update({ settings })
        .eq('id', tenantId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get tenant with creator information
  static async getTenantWithCreator(tenantId: string): Promise<{ data: any | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          *,
          creator:user_profiles!created_by(id, full_name, email)
        `)
        .eq('id', tenantId)
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }
}
