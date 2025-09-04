'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { UserService, type UserWithTenant } from '@/services/userService'
import { TenantService } from '@/services/tenantService'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import type { UserRole } from '@/lib/supabase'

export default function UserEditPage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const userId = params.id as string

  const [user, setUser] = useState<UserWithTenant | null>(null)
  const [tenants, setTenants] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPasswordReset, setShowPasswordReset] = useState(false)

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'tenant_user' as UserRole,
    tenant_id: '',
    status: 'active' as 'active' | 'inactive' | 'suspended',
    permissions: {} as Record<string, any>
  })

  const [passwordResetData, setPasswordResetData] = useState({
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (userId) {
      loadData()
    }
  }, [userId])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Load user details
      const { data: userData, error: userError } = await UserService.getUserWithDetails(userId)
      if (userError || !userData) {
        setError('Failed to load user details')
        return
      }

      // Load tenants for dropdown
      const { data: tenantsData } = await TenantService.getTenantsForSelect()

      setUser(userData)
      setTenants(tenantsData || [])
      setFormData({
        full_name: userData.full_name || '',
        email: userData.email,
        role: userData.role,
        tenant_id: userData.tenant_id || '',
        status: userData.status,
        permissions: userData.permissions || {}
      })
    } catch (err) {
      setError('Failed to load user data')
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
      // Check tenant capacity if changing tenant
      if (formData.tenant_id && formData.tenant_id !== user?.tenant_id) {
        const { canAssign, reason, error: capacityError } = await UserService.canAssignToTenant(userId, formData.tenant_id)
        if (capacityError || !canAssign) {
          setError(reason || 'Cannot assign user to this tenant')
          setSaving(false)
          return
        }
      }

      const { data, error } = await UserService.updateUser(userId, {
        full_name: formData.full_name,
        role: formData.role,
        tenant_id: formData.tenant_id || null,
        status: formData.status,
        permissions: formData.permissions
      })

      if (error) {
        setError('Failed to update user: ' + error.message)
      } else {
        router.push(`/super-admin/users/${userId}`)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Error updating user:', err)
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordResetData.newPassword !== passwordResetData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (passwordResetData.newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const { error } = await UserService.resetUserPassword(userId, passwordResetData.newPassword)
      if (error) {
        setError('Failed to reset password: ' + error.message)
      } else {
        setShowPasswordReset(false)
        setPasswordResetData({ newPassword: '', confirmPassword: '' })
        alert('Password reset successfully')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Error resetting password:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!user) return

    setSaving(true)
    setError(null)

    try {
      const { error } = await UserService.deleteUser(userId)
      if (error) {
        setError('Failed to delete user: ' + error.message)
      } else {
        router.push('/super-admin/users')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Error deleting user:', err)
    } finally {
      setSaving(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['super_admin']}>
        <div className="p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
          <p className="text-center text-gray-600 dark:text-gray-400 mt-2">Loading user...</p>
        </div>
      </ProtectedRoute>
    )
  }

  if (error && !user) {
    return (
      <ProtectedRoute allowedRoles={['super_admin']}>
        <div className="p-6">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Link
              href="/super-admin/users"
              className="text-brand-500 hover:text-brand-600"
            >
              ← Back to Users
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // Prevent editing current user
  if (user && currentUser && user.id === currentUser.id) {
    return (
      <ProtectedRoute allowedRoles={['super_admin']}>
        <div className="p-6">
          <div className="text-center">
            <p className="text-yellow-600 dark:text-yellow-400 mb-4">
              You cannot edit your own account from this page.
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Use your profile settings to update your own information.
            </p>
            <Link
              href="/super-admin/users"
              className="text-brand-500 hover:text-brand-600"
            >
              ← Back to Users
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['super_admin']}>
      <div className="p-6">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <li>
              <Link href="/super-admin" className="hover:text-brand-500">
                Super Admin
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/super-admin/users" className="hover:text-brand-500">
                Users
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href={`/super-admin/users/${userId}`} className="hover:text-brand-500">
                {user?.full_name || user?.email}
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900 dark:text-white">Edit</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit User: {user?.full_name || user?.email}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Update user information, role, and permissions
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPasswordReset(true)}
                    className="w-full px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    Reset Password
                  </button>
                </div>
              </div>
            </div>

            {/* Role & Permissions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Role & Permissions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="tenant_user">Tenant User</option>
                    <option value="tenant_admin">Tenant Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {formData.role === 'super_admin' && 'Full system access, can manage all tenants and users'}
                    {formData.role === 'tenant_admin' && 'Can manage users and data within assigned tenant'}
                    {formData.role === 'tenant_user' && 'Limited access to tenant data'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tenant Assignment
                  </label>
                  <select
                    name="tenant_id"
                    value={formData.tenant_id}
                    onChange={handleInputChange}
                    disabled={formData.role === 'super_admin'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    <option value="">No Tenant</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </option>
                    ))}
                  </select>
                  {formData.role === 'super_admin' && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Super Admins are not assigned to specific tenants
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete User
              </button>

              <div className="flex space-x-4">
                <Link
                  href={`/super-admin/users/${userId}`}
                  className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
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
            </div>
          </form>
        </div>

        {/* Password Reset Modal */}
        {showPasswordReset && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Reset Password
              </h3>
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordResetData.newPassword}
                    onChange={(e) => setPasswordResetData(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                    minLength={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={passwordResetData.confirmPassword}
                    onChange={(e) => setPasswordResetData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    minLength={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPasswordReset(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-brand-500 text-white px-4 py-2 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Delete User
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete "{user?.full_name || user?.email}"? This action cannot be undone.
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
                  disabled={saving}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
