'use client'

import { useAuth } from '@/context/AuthContext'
import { UserRole } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  redirectTo?: string
}

export default function ProtectedRoute({
  children,
  allowedRoles = [],
  redirectTo = '/signin'
}: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // If no user, redirect to sign in
      if (!user) {
        router.push(redirectTo)
        return
      }

      // If no profile loaded yet, wait
      if (!userProfile) {
        return
      }

      // If specific roles are required and user doesn't have permission
      if (allowedRoles.length > 0 && !allowedRoles.includes(userProfile.role)) {
        // Redirect based on user role
        switch (userProfile.role) {
          case 'super_admin':
            router.push('/super-admin')
            break
          case 'tenant_admin':
            router.push('/tenant-admin')
            break
          case 'tenant_user':
            router.push('/dashboard')
            break
          default:
            router.push('/signin')
        }
        return
      }
    }
  }, [user, userProfile, loading, allowedRoles, redirectTo, router])

  // Show loading while checking authentication
  if (loading || (user && !userProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500"></div>
      </div>
    )
  }

  // If not authenticated, don't render children
  if (!user || !userProfile) {
    return null
  }

  // If role restrictions exist and user doesn't have permission, don't render
  if (allowedRoles.length > 0 && !allowedRoles.includes(userProfile.role)) {
    return null
  }

  return <>{children}</>
}
