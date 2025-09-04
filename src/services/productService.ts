import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Product = Database['public']['Tables']['products']['Row']
type ProductInsert = Database['public']['Tables']['products']['Insert']
type ProductUpdate = Database['public']['Tables']['products']['Update']

export interface ProductWithCategory extends Product {
  category?: {
    id: number
    name: string
    description: string | null
  }
}

export interface ProductStats {
  total_products: number
  low_stock_products: number
  out_of_stock_products: number
  total_value: number
  average_price: number
  products_by_category: { [key: string]: number }
}

export interface CreateProductData {
  name: string
  price: number
  cost: number
  stock_quantity: number
  category_id?: number
  description?: string
}

export class ProductService {
  // Get all products for the current tenant
  static async getAllProducts(filters?: {
    search?: string
    category_id?: number
    low_stock?: boolean
    limit?: number
    offset?: number
  }): Promise<{ data: ProductWithCategory[] | null; error: any }> {
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
        .from('products')
        .select(`
          *,
          category:categories(id, name, description)
        `)
        .eq('tenant_id', userProfile.tenant_id)

      // Apply search filter
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      // Apply category filter
      if (filters?.category_id) {
        query = query.eq('category_id', filters.category_id)
      }

      // Apply low stock filter
      if (filters?.low_stock) {
        query = query.lte('stock_quantity', 10) // Consider 10 or less as low stock
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

  // Get product by ID (within current tenant)
  static async getProductById(id: number): Promise<{ data: ProductWithCategory | null; error: any }> {
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
        .from('products')
        .select(`
          *,
          category:categories(id, name, description)
        `)
        .eq('id', id)
        .eq('tenant_id', userProfile.tenant_id)
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Create new product
  static async createProduct(productData: CreateProductData): Promise<{ data: Product | null; error: any }> {
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

      const insertData: ProductInsert = {
        tenant_id: userProfile.tenant_id,
        name: productData.name,
        price: productData.price,
        cost: productData.cost,
        stock_quantity: productData.stock_quantity,
        category_id: productData.category_id || null,
        description: productData.description || null
      }

      const { data, error } = await supabase
        .from('products')
        .insert([insertData])
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Update product
  static async updateProduct(id: number, updates: ProductUpdate): Promise<{ data: Product | null; error: any }> {
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
        .from('products')
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

  // Delete product
  static async deleteProduct(id: number): Promise<{ error: any }> {
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
        .from('products')
        .delete()
        .eq('id', id)
        .eq('tenant_id', userProfile.tenant_id)

      return { error }
    } catch (error) {
      return { error }
    }
  }

  // Get product statistics for current tenant
  static async getProductStats(): Promise<{ data: ProductStats | null; error: any }> {
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

      // Get all products for calculations
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', userProfile.tenant_id)

      if (!products) {
        return { data: null, error: { message: 'Failed to fetch products' } }
      }

      const totalProducts = products.length
      const lowStockProducts = products.filter(p => p.stock_quantity <= 10).length
      const outOfStockProducts = products.filter(p => p.stock_quantity === 0).length
      const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0)
      const averagePrice = totalProducts > 0 ? products.reduce((sum, p) => sum + p.price, 0) / totalProducts : 0

      const stats: ProductStats = {
        total_products: totalProducts,
        low_stock_products: lowStockProducts,
        out_of_stock_products: outOfStockProducts,
        total_value: totalValue,
        average_price: averagePrice,
        products_by_category: {} // Would need more complex query to populate
      }

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Search products
  static async searchProducts(searchTerm: string, limit: number = 10): Promise<{ data: ProductWithCategory[] | null; error: any }> {
    return this.getAllProducts({
      search: searchTerm,
      limit
    })
  }

  // Get low stock products
  static async getLowStockProducts(limit: number = 10): Promise<{ data: ProductWithCategory[] | null; error: any }> {
    return this.getAllProducts({
      low_stock: true,
      limit
    })
  }

  // Update stock quantity
  static async updateStock(id: number, newQuantity: number): Promise<{ data: Product | null; error: any }> {
    return this.updateProduct(id, { stock_quantity: newQuantity })
  }

  // Get recent products
  static async getRecentProducts(limit: number = 5): Promise<{ data: ProductWithCategory[] | null; error: any }> {
    return this.getAllProducts({
      limit
    })
  }
}
