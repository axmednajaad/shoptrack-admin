'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireTenant?: boolean
}

export default function ProtectedRoute({ children, requireTenant = true }: ProtectedRouteProps) {
  const { user, tenantId, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // User is not authenticated, redirect to sign in
        router.push('/signin')
        return
      }

      if (requireTenant && !tenantId) {
        // User is authenticated but doesn't have a tenant, redirect to tenant setup
        router.push('/setup-tenant')
        return
      }
    }
  }, [user, tenantId, loading, router, requireTenant])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500"></div>
      </div>
    )
  }

  // Don't render children if user is not authenticated or doesn't have required tenant
  if (!user || (requireTenant && !tenantId)) {
    return null
  }

  return <>{children}</>
}
