/**
 * Utility functions for consistent date formatting across the application
 * to prevent hydration mismatches between server and client
 */

export const formatDate = (date: string | Date, options?: {
  includeTime?: boolean
  format?: 'short' | 'long' | 'numeric'
}): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (options?.includeTime) {
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: options.format === 'long' ? 'long' : 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: options?.format === 'long' ? 'long' : 'short',
    day: 'numeric'
  })
}

export const formatDateShort = (date: string | Date): string => {
  return formatDate(date, { format: 'short' })
}

export const formatDateLong = (date: string | Date): string => {
  return formatDate(date, { format: 'long' })
}

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, { includeTime: true })
}

export const formatDateTimeLong = (date: string | Date): string => {
  return formatDate(date, { includeTime: true, format: 'long' })
}
