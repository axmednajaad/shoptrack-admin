'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { TenantService, type TenantWithStats } from '@/services/tenantService'
import { UserService, type UserWithTenant } from '@/services/userService'
import Link from 'next/link'

export default function TenantViewPage() {
  const params = useParams()
  const tenantId = params.id as string

  const [tenant, setTenant] = useState<TenantWithStats | null>(null)
  const [users, setUsers] = useState<UserWithTenant[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (tenantId) {
      loadTenantData()
    }
  }, [tenantId])

  const loadTenantData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Load tenant details
      const { data: tenantData, error: tenantError } = await TenantService.getTenantById(tenantId)
      if (tenantError) {
        setError('Failed to load tenant details')
        console.error('Error loading tenant:', tenantError)
        return
      }

      // Load tenant users
      const { data: usersData, error: usersError } = await UserService.getUsersByTenant(tenantId)
      if (usersError) {
        console.error('Error loading users:', usersError)
      }

      // Load tenant activity
      const { data: activityData, error: activityError } = await TenantService.getTenantActivity(tenantId)
      if (activityError) {
        console.error('Error loading activity:', activityError)
      }

      setTenant(tenantData)
      setUsers(usersData || [])
      setActivity(activityData || [])
    } catch (err) {
      setError('Failed to load tenant data')
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

  const getRoleBadge = (role: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full"
    switch (role) {
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
          <p className="text-center text-gray-600 dark:text-gray-400 mt-2">Loading tenant details...</p>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !tenant) {
    return (
      <ProtectedRoute allowedRoles={['super_admin']}>
        <div className="p-6">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Tenant not found'}</p>
            <Link
              href="/super-admin/tenants"
              className="text-brand-500 hover:text-brand-600"
            >
              ← Back to Tenants
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
              <Link href="/super-admin/tenants" className="hover:text-brand-500">
                Tenants
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900 dark:text-white">{tenant.name}</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {tenant.name}
              </h1>
              <div className="flex items-center space-x-4 mt-2">
                <span className={getStatusBadge(tenant.status)}>
                  {tenant.status}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  Plan: {tenant.subscription_plan}
                </span>
              </div>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/super-admin/tenants/${tenant.id}/edit`}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Edit Tenant
              </Link>
              <Link
                href="/super-admin/tenants"
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
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{tenant.user_count}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{tenant.active_users}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">User Limit</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{tenant.max_users}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Created</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {new Date(tenant.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tenant Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Tenant Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <p className="text-gray-900 dark:text-white">{tenant.name}</p>
              </div>
              {tenant.address && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                  <p className="text-gray-900 dark:text-white">{tenant.address}</p>
                </div>
              )}
              {tenant.contact_info && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Info</label>
                  <p className="text-gray-900 dark:text-white">{tenant.contact_info}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subscription Plan</label>
                <p className="text-gray-900 dark:text-white capitalize">{tenant.subscription_plan}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Created</label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(tenant.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Updated</label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(tenant.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Users List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Users ({users.length})
              </h2>
              <Link
                href={`/super-admin/users/create?tenant=${tenant.id}`}
                className="text-brand-500 hover:text-brand-600 text-sm"
              >
                Add User
              </Link>
            </div>
            <div className="space-y-3">
              {users.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No users assigned to this tenant
                </p>
              ) : (
                users.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.full_name || 'No Name'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={getRoleBadge(user.role)}>
                        {user.role.replace('_', ' ')}
                      </span>
                      <Link
                        href={`/super-admin/users/${user.id}`}
                        className="text-brand-500 hover:text-brand-600 text-sm"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))
              )}
              {users.length > 5 && (
                <div className="text-center pt-2">
                  <Link
                    href={`/super-admin/users?tenant=${tenant.id}`}
                    className="text-brand-500 hover:text-brand-600 text-sm"
                  >
                    View all {users.length} users
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
