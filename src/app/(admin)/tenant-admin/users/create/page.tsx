'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { UserService } from '@/services/userService'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

interface CreateUserData {
  email: string
  full_name: string
  role: 'tenant_admin' | 'tenant_user'
  password: string
}

export default function CreateUserPage() {
  const router = useRouter()
  const { userProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    full_name: '',
    role: 'tenant_user',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.email.trim()) {
        setError('Email is required')
        setLoading(false)
        return
      }

      if (!formData.full_name.trim()) {
        setError('Full name is required')
        setLoading(false)
        return
      }

      if (!formData.password.trim()) {
        setError('Password is required')
        setLoading(false)
        return
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long')
        setLoading(false)
        return
      }

      if (!userProfile?.tenant_id) {
        setError('Unable to determine tenant')
        setLoading(false)
        return
      }

      const { data, error } = await UserService.createUser({
        email: formData.email.trim(),
        full_name: formData.full_name.trim(),
        role: formData.role,
        password: formData.password,
        tenant_id: userProfile.tenant_id
      })

      if (error) {
        setError(error.message || 'Failed to create user')
      } else if (data) {
        // Redirect to user detail page
        router.push(`/tenant-admin/users/${data.id}`)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Error creating user:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateUserData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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
              <Link href="/tenant-admin/users" className="hover:text-brand-500">
                Team Members
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900 dark:text-white">Create</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Add Team Member
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create a new team member account with appropriate permissions
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
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                placeholder="user@example.com"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                This will be used for login and notifications
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
                onChange={(e) => handleInputChange('role', e.target.value as 'tenant_admin' | 'tenant_user')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="tenant_user">Tenant User</option>
                <option value="tenant_admin">Tenant Admin</option>
              </select>
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                <p><strong>Tenant User:</strong> Can access basic features within your organization</p>
                <p><strong>Tenant Admin:</strong> Can manage users, customers, and organization settings</p>
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Temporary Password *
              </label>
              <input
                type="password"
                id="password"
                required
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter a temporary password"
                minLength={6}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Minimum 6 characters. The user should change this on first login.
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/tenant-admin/users"
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="bg-brand-500 text-white px-6 py-2 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Team Member'}
              </button>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                Team Member Creation Tips
              </h3>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <ul className="list-disc list-inside space-y-1">
                  <li>Email addresses must be unique across the entire system</li>
                  <li>New users will be automatically assigned to your tenant</li>
                  <li>Users should change their temporary password on first login</li>
                  <li>You can modify user roles and permissions later</li>
                  <li>Only tenant admins can create other tenant admin accounts</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Role Permissions Info */}
        <div className="mt-6 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Role Permissions Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Tenant User</h4>
              <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                <li>• View customer information</li>
                <li>• Access basic reports</li>
                <li>• Update own profile</li>
                <li>• Limited system access</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Tenant Admin</h4>
              <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Full customer management</li>
                <li>• Team member management</li>
                <li>• Access to all reports</li>
                <li>• Organization settings</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
