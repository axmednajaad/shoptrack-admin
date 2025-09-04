'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { CategoryService } from '@/services/categoryService'
import Link from 'next/link'
import type { Database } from '@/lib/supabase'

type Category = Database['public']['Tables']['categories']['Row']
type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export default function EditCategoryPage() {
  const params = useParams()
  const router = useRouter()
  const categoryId = parseInt(params.id as string)
  
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    if (categoryId) {
      loadCategory()
    }
  }, [categoryId])

  const loadCategory = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await CategoryService.getCategoryById(categoryId)

      if (error) {
        setError('Failed to load category details')
        console.error('Error loading category:', error)
      } else if (!data) {
        setError('Category not found')
      } else {
        setCategory(data)
        setFormData({
          name: data.name || '',
          description: data.description || ''
        })
      }
    } catch (err) {
      setError('Failed to load category details')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setError('Category name is required')
        setSaving(false)
        return
      }

      const updates: CategoryUpdate = {
        name: formData.name.trim(),
        description: formData.description.trim() || null
      }

      const { data, error } = await CategoryService.updateCategory(categoryId, updates)

      if (error) {
        setError(error.message || 'Failed to update category')
      } else if (data) {
        // Redirect to category detail page
        router.push(`/tenant-admin/categories/${data.id}`)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Error updating category:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['tenant_admin']}>
        <div className="p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
          <p className="text-center text-gray-600 dark:text-gray-400 mt-2">Loading category...</p>
        </div>
      </ProtectedRoute>
    )
  }

  if (error && !category) {
    return (
      <ProtectedRoute allowedRoles={['tenant_admin']}>
        <div className="p-6">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {error}
            </h3>
            <Link
              href="/tenant-admin/categories"
              className="text-brand-500 hover:text-brand-600"
            >
              Back to Categories
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['tenant_admin']}>
      <div className="p-6">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <li>
              <Link href="/tenant-admin" className="hover:text-brand-500">
                Tenant Admin
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/tenant-admin/categories" className="hover:text-brand-500">
                Categories
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href={`/tenant-admin/categories/${categoryId}`} className="hover:text-brand-500">
                {category?.name || 'Category'}
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900 dark:text-white">Edit</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Category
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Update category information and organization
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Category Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter category name"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter category description (optional)"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Link
                href={`/tenant-admin/categories/${categoryId}`}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="bg-brand-500 text-white px-6 py-2 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Category Info */}
        {category && (
          <div className="mt-6 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Category ID:</strong> {category.id}</p>
                <p><strong>Created:</strong> {new Date(category.created_at).toLocaleDateString()}</p>
                <p><strong>Last Updated:</strong> {new Date(category.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
