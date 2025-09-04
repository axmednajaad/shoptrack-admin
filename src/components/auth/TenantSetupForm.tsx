'use client'

import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Input from '@/components/form/input/InputField'
import Label from '@/components/form/Label'
import Button from '@/components/ui/button/Button'
import { supabase } from '@/lib/supabase'

export default function TenantSetupForm() {
  const [businessName, setBusinessName] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { updateTenantId, user } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Create tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert([{
          name: businessName,
          address: businessAddress || null,
          contact_info: contactInfo || null,
        }])
        .select()
        .single()

      if (tenantError) {
        setError(tenantError.message)
        return
      }

      // Update user metadata with tenant_id
      await updateTenantId(tenant.id)
      
      // Redirect to dashboard
      router.push('/')
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Setup Your Business
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Please provide your business information to get started with ShopTrack.
            </p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label>
                  Business Name <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Enter your business name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label>
                  Business Address
                </Label>
                <Input
                  type="text"
                  placeholder="Enter your business address (optional)"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                />
              </div>
              
              <div>
                <Label>
                  Contact Information
                </Label>
                <Input
                  type="text"
                  placeholder="Phone, email, or other contact info (optional)"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                />
              </div>
              
              <div>
                <Button 
                  className="w-full" 
                  size="sm" 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Setting up..." : "Setup Business"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
