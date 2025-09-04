'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  tenantId: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, tenantData?: { name: string; address?: string; contact_info?: string }) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  updateTenantId: (tenantId: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      
      // Get tenant ID from user metadata
      if (session?.user?.user_metadata?.tenant_id) {
        setTenantId(session.user.user_metadata.tenant_id)
      }
      
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        // Update tenant ID from user metadata
        if (session?.user?.user_metadata?.tenant_id) {
          setTenantId(session.user.user_metadata.tenant_id)
        } else {
          setTenantId(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (
    email: string, 
    password: string, 
    tenantData?: { name: string; address?: string; contact_info?: string }
  ) => {
    // First, create the user account
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error || !data.user) {
      return { error }
    }

    // If tenant data is provided, create a tenant and associate it with the user
    if (tenantData) {
      try {
        // Create tenant
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .insert([tenantData])
          .select()
          .single()

        if (tenantError) {
          console.error('Error creating tenant:', tenantError)
          return { error: tenantError as AuthError }
        }

        // Update user metadata with tenant_id
        const { error: updateError } = await supabase.auth.updateUser({
          data: { tenant_id: tenant.id }
        })

        if (updateError) {
          console.error('Error updating user metadata:', updateError)
          return { error: updateError }
        }
      } catch (err) {
        console.error('Error in tenant creation process:', err)
        return { error: err as AuthError }
      }
    }

    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setTenantId(null)
  }

  const updateTenantId = async (newTenantId: string) => {
    const { error } = await supabase.auth.updateUser({
      data: { tenant_id: newTenantId }
    })
    
    if (!error) {
      setTenantId(newTenantId)
    }
  }

  const value = {
    user,
    session,
    tenantId,
    loading,
    signIn,
    signUp,
    signOut,
    updateTenantId,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
