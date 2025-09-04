'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface AuthRedirectProps {
  children: React.ReactNode
  redirectAuthenticatedTo?: string
}

export default function AuthRedirect({ 
  children, 
  redirectAuthenticatedTo 
}: AuthRedirectProps) {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && userProfile && redirectAuthenticatedTo) {
      // User is authenticated, redirect based on role or to specified route
      if (redirectAuthenticatedTo === 'role-based') {
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
            router.push('/dashboard')
        }
      } else {
        router.push(redirectAuthenticatedTo)
      }
    }
  }, [user, userProfile, loading, redirectAuthenticatedTo, router])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500"></div>
      </div>
    )
  }

  // If user is authenticated and should be redirected, don't render children
  if (user && userProfile && redirectAuthenticatedTo) {
    return null
  }

  return <>{children}</>
}
