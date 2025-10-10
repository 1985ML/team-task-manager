
'use client'

import { useHasMounted } from '@/hooks/use-has-mounted'

interface ClientOnlyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ClientOnly({ children, fallback }: ClientOnlyProps) {
  const hasMounted = useHasMounted()

  if (!hasMounted) {
    return fallback || null
  }

  return <>{children}</>
}
