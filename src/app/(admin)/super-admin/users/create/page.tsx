'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { UserService } from '@/services/userService'
import { TenantService } from '@/services/tenantService'
import Link from 'next/link'
import type { UserRole } from '@/lib/supabase'

export default function CreateUserPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [tenants, setTenants] = useState<Array<{ id: string; name: string }>>([])
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'tenant_user' as UserRole,
    tenant_id: '',
    status: 'active' as 'active' | 'inactive' | 'suspended'
  })

  useEffect(() => {
    loadTenants()

    // Pre-select tenant if provided in query params
    const tenantParam = searchParams.get('tenant')
    if (tenantParam) {
      setFormData(prev => ({ ...prev, tenant_id: tenantParam }))
    }
  }, [searchParams])

  const loadTenants = async () => {
    const { data } = await TenantService.getTenantsForSelect()
    setTenants(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await UserService.createUser({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: formData.role,
        tenant_id: formData.tenant_id || null,
        status: formData.status
      })

      if (error) {
        alert('Failed to create user: ' + error.message)
      } else {
        router.push('/super-admin/users')
      }
    } catch (error) {
      alert('An unexpected error occurred')
      console.error('Error creating user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <ProtectedRoute allowedRoles={['super_admin']}>
      <div className="p-6">
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/super-admin/users"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              ← Back to Users
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">
            Create New User
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Add a new user to the system
          </p>
        </div>

        <div className="max-w-2xl">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter email address"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter password (min 6 characters)"
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter full name"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role <span className="text-red-500">*</span>
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

              {/* Tenant Assignment */}
              {(formData.role === 'tenant_admin' || formData.role === 'tenant_user') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assign to Tenant {formData.role === 'tenant_admin' ? <span className="text-red-500">*</span> : ''}
                  </label>
                  <select
                    name="tenant_id"
                    value={formData.tenant_id}
                    onChange={handleInputChange}
                    required={formData.role === 'tenant_admin'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select a tenant</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </option>
                    ))}
                  </select>
                  {formData.role === 'tenant_admin' && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Tenant Admins must be assigned to a tenant
                    </p>
                  )}
                </div>
              )}

              {/* Status */}
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
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/super-admin/users"
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="bg-brand-500 text-white px-6 py-2 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  )
}
