
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    if (requireAuth && status === 'unauthenticated') {
      router.replace('/auth/login')
    } else if (!requireAuth && status === 'authenticated') {
      router.replace('/dashboard')
    }
  }, [status, router, requireAuth, mounted])

  // Don't render anything during loading or server-side rendering
  if (!mounted || status === 'loading') {
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
