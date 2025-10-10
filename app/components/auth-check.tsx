
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface AuthCheckProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export function AuthCheck({ children, requireAuth = false }: AuthCheckProps) {
  const { data: session, status } = useSession() || {}
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated' && requireAuth) {
      router.replace('/auth/login')
    }
    if (status === 'authenticated' && !requireAuth) {
      router.replace('/dashboard')
    }
  }, [status, router, requireAuth])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-pulse text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  // If authentication is required but user is not authenticated, don't render children
  if (requireAuth && status === 'unauthenticated') {
    return null
  }

  // If authentication is not required but user is authenticated, don't render children (will redirect)
  if (!requireAuth && status === 'authenticated') {
    return null
  }

  return <>{children}</>
}
