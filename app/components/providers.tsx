
'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from './theme-provider'
import { ClientOnly } from './client-only'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClientOnly>
      <SessionProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </SessionProvider>
    </ClientOnly>
  )
}
