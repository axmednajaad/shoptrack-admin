'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { CategoryService } from '@/services/categoryService'
import Link from 'next/link'
import type { Database } from '@/lib/supabase'

type Category = Database['public']['Tables']['categories']['Row']

export default function CategoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const categoryId = parseInt(params.id as string)
  
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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
      }
    } catch (err) {
      setError('Failed to load category details')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await CategoryService.deleteCategory(categoryId)
      if (error) {
        alert('Failed to delete category: ' + error.message)
      } else {
        router.push('/tenant-admin/categories')
      }
    } catch (err) {
      alert('An unexpected error occurred')
      console.error('Error deleting category:', err)
    }
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

  if (error || !category) {
    return (
      <ProtectedRoute allowedRoles={['tenant_admin']}>
        <div className="p-6">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {error || 'Category not found'}
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
            <li className="text-gray-900 dark:text-white">{category.name}</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {category.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Category ID: {category.id}
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/tenant-admin/categories/${category.id}/edit`}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Edit Category
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>

        {/* Category Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Category Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Category Name
                </label>
                <p className="text-gray-900 dark:text-white">{category.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Description
                </label>
                <p className="text-gray-900 dark:text-white">
                  {category.description || (
                    <span className="text-gray-500 dark:text-gray-400">No description provided</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Category Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Created
                </label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(category.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Last Updated
                </label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(category.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Category ID
                </label>
                <p className="text-gray-900 dark:text-white font-mono">
                  {category.id}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/tenant-admin/categories/${category.id}/edit`}
              className="bg-brand-500 text-white px-4 py-2 rounded-lg hover:bg-brand-600 transition-colors"
            >
              Edit Category
            </Link>
            <Link
              href={`/tenant-admin/products?category=${category.id}`}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              View Products in Category
            </Link>
            <Link
              href="/tenant-admin/products/create"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add Product to Category
            </Link>
            <Link
              href="/tenant-admin/categories"
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Back to Categories
            </Link>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Delete Category
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete <strong>{category.name}</strong>? This action cannot be undone. Products in this category will become uncategorized.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete Category
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
