import { supabase } from '@/lib/supabase'
import type { Database, UserRole } from '@/lib/supabase'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']
type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']

export interface UserWithTenant extends UserProfile {
  tenant?: {
    id: string
    name: string
    status: string
  }
}

export interface UserStats {
  total_users: number
  super_admins: number
  tenant_admins: number
  tenant_users: number
  active_users: number
  inactive_users: number
  recent_logins: number
}

export interface CreateUserData {
  email: string
  password: string
  full_name: string
  role: UserRole
  tenant_id?: string | null
  status?: 'active' | 'inactive' | 'suspended'
}

export class UserService {
  // Get all users with optional filtering
  static async getAllUsers(filters?: {
    role?: UserRole
    status?: string
    tenant_id?: string
    search?: string
    limit?: number
    offset?: number
  }): Promise<{ data: UserWithTenant[] | null; error: any }> {
    try {
      let query = supabase
        .from('user_profiles')
        .select(`
          *,
          tenant:tenants(id, name, status)
        `)

      // Apply filters
      if (filters?.role) {
        query = query.eq('role', filters.role)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.tenant_id) {
        query = query.eq('tenant_id', filters.tenant_id)
      }

      if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
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

  // Get user by ID
  static async getUserById(id: string): Promise<{ data: UserWithTenant | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          tenant:tenants(id, name, status)
        `)
        .eq('id', id)
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Create new user (Super Admin only)
  static async createUser(userData: CreateUserData): Promise<{ data: UserProfile | null; error: any }> {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name
        }
      })

      if (authError || !authData.user) {
        return { data: null, error: authError }
      }

      // Then create/update the user profile
      const profileData: UserProfileInsert = {
        id: authData.user.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        tenant_id: userData.tenant_id || null,
        status: userData.status || 'active',
        created_by: currentUser?.id,
        permissions: {}
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .upsert([profileData])
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Update user profile
  static async updateUser(id: string, updates: UserProfileUpdate): Promise<{ data: UserProfile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Delete user
  static async deleteUser(id: string): Promise<{ error: any }> {
    try {
      // Delete from auth (this will cascade to user_profiles)
      const { error: authError } = await supabase.auth.admin.deleteUser(id)
      
      if (authError) {
        return { error: authError }
      }

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  // Get user statistics
  static async getUserStats(): Promise<{ data: UserStats | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Update user status
  static async updateUserStatus(id: string, status: 'active' | 'inactive' | 'suspended'): Promise<{ data: UserProfile | null; error: any }> {
    return this.updateUser(id, { status })
  }

  // Update user role
  static async updateUserRole(id: string, role: UserRole): Promise<{ data: UserProfile | null; error: any }> {
    return this.updateUser(id, { role })
  }

  // Assign user to tenant
  static async assignUserToTenant(userId: string, tenantId: string | null): Promise<{ data: UserProfile | null; error: any }> {
    return this.updateUser(userId, { tenant_id: tenantId })
  }

  // Get users by tenant
  static async getUsersByTenant(tenantId: string): Promise<{ data: UserProfile[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Reset user password (Super Admin only)
  static async resetUserPassword(userId: string, newPassword: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      })

      return { error }
    } catch (error) {
      return { error }
    }
  }

  // Send password reset email
  static async sendPasswordResetEmail(email: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      return { error }
    } catch (error) {
      return { error }
    }
  }

  // Update user permissions
  static async updateUserPermissions(userId: string, permissions: Record<string, any>): Promise<{ data: UserProfile | null; error: any }> {
    return this.updateUser(userId, { permissions })
  }

  // Bulk update users
  static async bulkUpdateUsers(userIds: string[], updates: UserProfileUpdate): Promise<{ data: UserProfile[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .in('id', userIds)
        .select()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get recent user activity
  static async getRecentUserActivity(limit: number = 10): Promise<{ data: UserProfile[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .not('last_login', 'is', null)
        .order('last_login', { ascending: false })
        .limit(limit)

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get all users excluding the current user
  static async getAllUsersExcludingCurrent(filters?: {
    role?: UserRole
    status?: string
    tenant_id?: string
    search?: string
    limit?: number
    offset?: number
  }): Promise<{ data: UserWithTenant[] | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { data, error } = await this.getAllUsers(filters)

      if (error || !data) {
        return { data, error }
      }

      // Filter out the current user
      const filteredData = data.filter(userProfile => userProfile.id !== user?.id)

      return { data: filteredData, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get user activity history
  static async getUserActivityHistory(userId: string, limit: number = 20): Promise<{ data: any[] | null; error: any }> {
    try {
      // For now, we'll return basic user profile changes
      // In a real app, you'd have an audit log table
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        return { data: null, error }
      }

      // Mock activity data based on user profile
      const activities = [
        {
          id: 1,
          action: 'Profile Created',
          timestamp: data.created_at,
          details: 'User account was created'
        },
        {
          id: 2,
          action: 'Last Login',
          timestamp: data.last_login || data.created_at,
          details: 'User last signed in'
        },
        {
          id: 3,
          action: 'Profile Updated',
          timestamp: data.updated_at,
          details: 'User profile was last updated'
        }
      ].filter(activity => activity.timestamp)

      return { data: activities, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get user with detailed information including creator
  static async getUserWithDetails(userId: string): Promise<{ data: any | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          tenant:tenants(id, name, status, subscription_plan),
          creator:user_profiles!created_by(id, full_name, email)
        `)
        .eq('id', userId)
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Check if user can be assigned to tenant (considering tenant limits)
  static async canAssignToTenant(userId: string, tenantId: string): Promise<{ canAssign: boolean; reason?: string; error: any }> {
    try {
      // Get current user
      const { data: user, error: userError } = await this.getUserById(userId)
      if (userError || !user) {
        return { canAssign: false, reason: 'User not found', error: userError }
      }

      // If user is already in this tenant, they can stay
      if (user.tenant_id === tenantId) {
        return { canAssign: true, error: null }
      }

      // Check tenant capacity using TenantService
      const { TenantService } = await import('./tenantService')
      const { canAdd, currentCount, maxUsers, error: capacityError } = await TenantService.canAddUser(tenantId)

      if (capacityError) {
        return { canAssign: false, reason: 'Error checking tenant capacity', error: capacityError }
      }

      if (!canAdd) {
        return {
          canAssign: false,
          reason: `Tenant is at capacity (${currentCount}/${maxUsers} users)`,
          error: null
        }
      }

      return { canAssign: true, error: null }
    } catch (error) {
      return { canAssign: false, reason: 'Unexpected error', error }
    }
  }

  // Get user login history (mock implementation)
  static async getUserLoginHistory(userId: string, limit: number = 10): Promise<{ data: any[] | null; error: any }> {
    try {
      const { data: user, error } = await supabase
        .from('user_profiles')
        .select('last_login, created_at')
        .eq('id', userId)
        .single()

      if (error) {
        return { data: null, error }
      }

      // Mock login history - in a real app, you'd have a login_history table
      const loginHistory = []
      if (user.last_login) {
        loginHistory.push({
          id: 1,
          timestamp: user.last_login,
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0...',
          success: true
        })
      }

      return { data: loginHistory, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}
