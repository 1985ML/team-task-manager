
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardHeader } from '@/components/dashboard/header'
import { Sidebar } from '@/components/dashboard/sidebar'
import { ClientOnly } from '@/components/client-only'
import { useRouter } from 'next/navigation'

function DashboardContent({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { data: session, status } = useSession() || {}
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-lg text-muted-foreground">Loading dashboard...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        notificationCount={0} // TODO: Implement real notification count
      />
      
      <div className="flex">
        <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block`}>
          <Sidebar isOpen={sidebarOpen} />
        </div>
        
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClientOnly 
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-pulse text-lg text-muted-foreground">Loading dashboard...</div>
        </div>
      }
    >
      <DashboardContent>
        {children}
      </DashboardContent>
    </ClientOnly>
  )
}
