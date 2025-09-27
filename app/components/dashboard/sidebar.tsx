
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  Calendar,
  BarChart3,
  Settings,
  Plus,
  FolderKanban,
  Folder
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  className?: string
  isOpen?: boolean
}

export function Sidebar({ className, isOpen = true }: SidebarProps) {
  const { data: session } = useSession() || {}
  const pathname = usePathname()

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      current: pathname === '/dashboard'
    },
    {
      name: 'Tasks',
      href: '/dashboard/tasks',
      icon: CheckSquare,
      current: pathname?.startsWith('/dashboard/tasks')
    },
    {
      name: 'Projects',
      href: '/dashboard/projects',
      icon: Folder,
      current: pathname?.startsWith('/dashboard/projects')
    },
    {
      name: 'Kanban Board',
      href: '/dashboard/kanban',
      icon: FolderKanban,
      current: pathname === '/dashboard/kanban'
    },
    {
      name: 'Teams',
      href: '/dashboard/teams',
      icon: Users,
      current: pathname?.startsWith('/dashboard/teams')
    },
    {
      name: 'Calendar',
      href: '/dashboard/calendar',
      icon: Calendar,
      current: pathname === '/dashboard/calendar'
    },
    {
      name: 'Analytics',
      href: '/dashboard/analytics',
      icon: BarChart3,
      current: pathname === '/dashboard/analytics'
    }
  ]

  const adminNavigation = [
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      current: pathname === '/dashboard/settings'
    }
  ]

  return (
    <div className={cn(
      "pb-12 w-64 bg-background border-r transition-transform duration-200 ease-in-out",
      !isOpen && "-translate-x-full lg:translate-x-0",
      className
    )}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            <Button asChild className="w-full justify-start">
              <Link href="/dashboard/tasks/new">
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Link>
            </Button>
          </div>
        </div>

        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Main
          </h2>
          <div className="space-y-1">
            {navigation.map((item) => (
              <Button
                key={item.name}
                variant={item.current ? "default" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              </Button>
            ))}
          </div>
        </div>

        {session?.user?.role === 'ADMIN' && (
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Administration
            </h2>
            <div className="space-y-1">
              {adminNavigation.map((item) => (
                <Button
                  key={item.name}
                  variant={item.current ? "default" : "ghost"}
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={item.href}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="px-3 py-2">
          <div className="px-4 py-2">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {session?.user?.role || 'MEMBER'}
              </Badge>
              <span>•</span>
              <span>{session?.user?.name || 'User'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
