'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface DatabaseSetupCheckProps {
  children: React.ReactNode
}

export default function DatabaseSetupCheck({ children }: DatabaseSetupCheckProps) {
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkDatabaseSetup()
  }, [])

  const checkDatabaseSetup = async () => {
    try {
      // Try to query the user_profiles table
      const { error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1)

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist
          setError('Database tables not set up')
          setIsSetupComplete(false)
        } else {
          // Other error, but table exists
          setIsSetupComplete(true)
        }
      } else {
        // Success
        setIsSetupComplete(true)
      }
    } catch (err) {
      console.error('Database setup check failed:', err)
      setError('Failed to check database setup')
      setIsSetupComplete(false)
    }
  }

  if (isSetupComplete === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking database setup...</p>
        </div>
      </div>
    )
  }

  if (!isSetupComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Database Setup Required
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The database tables need to be set up before you can use the application.
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Setup Steps:</h3>
              <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>1. Go to your Supabase project dashboard</li>
                <li>2. Navigate to SQL Editor</li>
                <li>3. Run the SQL script from <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">database_roles_setup.sql</code></li>
                <li>4. Refresh this page</li>
              </ol>
            </div>

            <button 
              onClick={checkDatabaseSetup}
              className="bg-brand-500 text-white px-6 py-2 rounded-lg hover:bg-brand-600 transition-colors"
            >
              Check Again
            </button>

            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
