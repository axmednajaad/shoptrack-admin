import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Category = Database['public']['Tables']['categories']['Row']
type CategoryInsert = Database['public']['Tables']['categories']['Insert']
type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export interface CategoryStats {
  total_categories: number
  categories_with_products: number
  empty_categories: number
}

export interface CreateCategoryData {
  name: string
  description?: string
}

export class CategoryService {
  // Get all categories for the current tenant
  static async getAllCategories(filters?: {
    search?: string
    limit?: number
    offset?: number
  }): Promise<{ data: Category[] | null; error: any }> {
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
        .from('categories')
        .select('*')
        .eq('tenant_id', userProfile.tenant_id)

      // Apply search filter
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
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

  // Get category by ID (within current tenant)
  static async getCategoryById(id: number): Promise<{ data: Category | null; error: any }> {
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
        .from('categories')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', userProfile.tenant_id)
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Create new category
  static async createCategory(categoryData: CreateCategoryData): Promise<{ data: Category | null; error: any }> {
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

      const insertData: CategoryInsert = {
        tenant_id: userProfile.tenant_id,
        name: categoryData.name,
        description: categoryData.description || null
      }

      const { data, error } = await supabase
        .from('categories')
        .insert([insertData])
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Update category
  static async updateCategory(id: number, updates: CategoryUpdate): Promise<{ data: Category | null; error: any }> {
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
        .from('categories')
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

  // Delete category
  static async deleteCategory(id: number): Promise<{ error: any }> {
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

      // Check if category has products
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id)
        .eq('tenant_id', userProfile.tenant_id)

      if (productCount && productCount > 0) {
        return { error: { message: `Cannot delete category. It contains ${productCount} product(s).` } }
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('tenant_id', userProfile.tenant_id)

      return { error }
    } catch (error) {
      return { error }
    }
  }

  // Get category statistics for current tenant
  static async getCategoryStats(): Promise<{ data: CategoryStats | null; error: any }> {
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

      // Get total categories
      const { count: totalCategories } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', userProfile.tenant_id)

      // Get categories with products (this would need a more complex query in real implementation)
      const stats: CategoryStats = {
        total_categories: totalCategories || 0,
        categories_with_products: 0, // Would need JOIN query to calculate
        empty_categories: totalCategories || 0 // Simplified for now
      }

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Search categories
  static async searchCategories(searchTerm: string, limit: number = 10): Promise<{ data: Category[] | null; error: any }> {
    return this.getAllCategories({
      search: searchTerm,
      limit
    })
  }

  // Get categories for dropdown/select options
  static async getCategoriesForSelect(): Promise<{ data: Category[] | null; error: any }> {
    return this.getAllCategories({
      limit: 100 // Get all categories for dropdown
    })
  }
}
