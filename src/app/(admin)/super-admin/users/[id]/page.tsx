'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { UserService, type UserWithTenant } from '@/services/userService'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import type { UserRole } from '@/lib/supabase'

export default function UserViewPage() {
  const params = useParams()
  const { user: currentUser } = useAuth()
  const userId = params.id as string

  const [user, setUser] = useState<UserWithTenant | null>(null)
  const [activity, setActivity] = useState<any[]>([])
  const [loginHistory, setLoginHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      loadUserData()
    }
  }, [userId])

  const loadUserData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Load user details
      const { data: userData, error: userError } = await UserService.getUserWithDetails(userId)
      if (userError) {
        setError('Failed to load user details')
        console.error('Error loading user:', userError)
        return
      }

      // Load user activity
      const { data: activityData, error: activityError } = await UserService.getUserActivityHistory(userId)
      if (activityError) {
        console.error('Error loading activity:', activityError)
      }

      // Load login history
      const { data: loginData, error: loginError } = await UserService.getUserLoginHistory(userId)
      if (loginError) {
        console.error('Error loading login history:', loginError)
      }

      setUser(userData)
      setActivity(activityData || [])
      setLoginHistory(loginData || [])
    } catch (err) {
      setError('Failed to load user data')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 text-sm font-medium rounded-full"
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`
      case 'inactive':
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200`
      case 'suspended':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const getRoleBadge = (role: UserRole) => {
    const baseClasses = "px-3 py-1 text-sm font-medium rounded-full"
    switch (role) {
      case 'super_admin':
        return `${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200`
      case 'tenant_admin':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`
      case 'tenant_user':
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['super_admin']}>
        <div className="p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
          <p className="text-center text-gray-600 dark:text-gray-400 mt-2">Loading user details...</p>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !user) {
    return (
      <ProtectedRoute allowedRoles={['super_admin']}>
        <div className="p-6">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error || 'User not found'}</p>
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
            <li className="text-gray-900 dark:text-white">{user.full_name || user.email}</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          {user.id === currentUser?.id && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                <strong>Note:</strong> You are viewing your own profile. Some administrative actions are not available for your own account.
              </p>
            </div>
          )}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {user.full_name || 'No Name'}
                {user.id === currentUser?.id && (
                  <span className="ml-2 text-lg text-blue-600 dark:text-blue-400">(You)</span>
                )}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{user.email}</p>
              <div className="flex items-center space-x-4 mt-3">
                <span className={getRoleBadge(user.role)}>
                  {user.role.replace('_', ' ')}
                </span>
                <span className={getStatusBadge(user.status)}>
                  {user.status}
                </span>
                {user.tenant && (
                  <span className="px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full">
                    {user.tenant.name}
                  </span>
                )}
              </div>
            </div>
            <div className="flex space-x-3">
              {user.id !== currentUser?.id ? (
                <Link
                  href={`/super-admin/users/${user.id}/edit`}
                  className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  Edit User
                </Link>
              ) : (
                <div className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed">
                  Cannot Edit Own Account
                </div>
              )}
              <Link
                href="/super-admin/users"
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Back to List
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">{user.status}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Role</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                  {user.role.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8h1m-1-4h1m4 4h1m-1-4h1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tenant</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {user.tenant ? user.tenant.name : 'No Tenant'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Login</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              User Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                <p className="text-gray-900 dark:text-white">{user.full_name || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <p className="text-gray-900 dark:text-white">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                <p className="text-gray-900 dark:text-white capitalize">{user.role.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <p className="text-gray-900 dark:text-white capitalize">{user.status}</p>
              </div>
              {user.tenant && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tenant</label>
                  <div className="flex items-center space-x-2">
                    <p className="text-gray-900 dark:text-white">{user.tenant.name}</p>
                    <Link
                      href={`/super-admin/tenants/${user.tenant.id}`}
                      className="text-brand-500 hover:text-brand-600 text-sm"
                    >
                      View Tenant
                    </Link>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Created</label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(user.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Updated</label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(user.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h2>
            <div className="space-y-4">
              {activity.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No activity recorded
                </p>
              ) : (
                activity.map((item, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-shrink-0 w-2 h-2 bg-brand-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{item.action}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.details}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Login History */}
        {loginHistory.length > 0 && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Login History
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Date & Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      IP Address
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {loginHistory.map((login, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {new Date(login.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {login.ip_address}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          login.success 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {login.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
