'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { UserService } from '@/services/userService'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import type { Database } from '@/lib/supabase'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']
type UserUpdate = Database['public']['Tables']['user_profiles']['Update']

export default function EditUserPage() {
  const params = useParams()
  const router = useRouter()
  const { userProfile: currentUser } = useAuth()
  const userId = params.id as string
  
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    role: 'tenant_user' as 'tenant_admin' | 'tenant_user',
    status: 'active' as 'active' | 'inactive' | 'pending'
  })

  useEffect(() => {
    if (userId && currentUser?.tenant_id) {
      loadUser()
    }
  }, [userId, currentUser?.tenant_id])

  const loadUser = async () => {
    if (!currentUser?.tenant_id) return

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await UserService.getUserById(userId)

      if (error) {
        setError('Failed to load user details')
        console.error('Error loading user:', error)
      } else if (!data) {
        setError('User not found')
      } else if (data.tenant_id !== currentUser.tenant_id) {
        setError('Access denied: User belongs to a different tenant')
      } else {
        setUser(data)
        setFormData({
          full_name: data.full_name || '',
          role: (data.role as 'tenant_admin' | 'tenant_user') || 'tenant_user',
          status: (data.status as 'active' | 'inactive' | 'pending') || 'active'
        })
      }
    } catch (err) {
      setError('Failed to load user details')
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
      if (!formData.full_name.trim()) {
        setError('Full name is required')
        setSaving(false)
        return
      }

      const updates: UserUpdate = {
        full_name: formData.full_name.trim(),
        role: formData.role,
        status: formData.status
      }

      const { data, error } = await UserService.updateUser(userId, updates)

      if (error) {
        setError(error.message || 'Failed to update user')
      } else if (data) {
        // Redirect to user detail page
        router.push(`/tenant-admin/users/${data.id}`)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Error updating user:', err)
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
          <p className="text-center text-gray-600 dark:text-gray-400 mt-2">Loading user...</p>
        </div>
      </ProtectedRoute>
    )
  }

  if (error && !user) {
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
              href="/tenant-admin/users"
              className="text-brand-500 hover:text-brand-600"
            >
              Back to Team Members
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const canEditRole = user?.role !== 'super_admin' && user?.id !== currentUser?.id

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
              <Link href="/tenant-admin/users" className="hover:text-brand-500">
                Team Members
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href={`/tenant-admin/users/${userId}`} className="hover:text-brand-500">
                {user?.full_name || 'User'}
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900 dark:text-white">Edit</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Team Member
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Update team member information and permissions
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
            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Email addresses cannot be changed
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="full_name"
                required
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter user's full name"
              />
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role *
              </label>
              <select
                id="role"
                required
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                disabled={!canEditRole}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white ${
                  !canEditRole ? 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' : ''
                }`}
              >
                <option value="tenant_user">Tenant User</option>
                <option value="tenant_admin">Tenant Admin</option>
              </select>
              {!canEditRole && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {user?.role === 'super_admin' ? 'Super admin roles cannot be changed' : 'You cannot change your own role'}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status *
              </label>
              <select
                id="status"
                required
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                disabled={user?.id === currentUser?.id}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white ${
                  user?.id === currentUser?.id ? 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' : ''
                }`}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
              {user?.id === currentUser?.id && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  You cannot change your own status
                </p>
              )}
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                <p><strong>Active:</strong> User can access the system normally</p>
                <p><strong>Inactive:</strong> User cannot log in or access the system</p>
                <p><strong>Pending:</strong> User account is awaiting activation</p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Link
                href={`/tenant-admin/users/${userId}`}
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

        {/* User Info */}
        {user && (
          <div className="mt-6 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Member Since:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                <p><strong>Last Login:</strong> {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
