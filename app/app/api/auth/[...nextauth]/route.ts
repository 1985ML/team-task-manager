import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// Ensure proper handling of the NextAuth route
const handler = NextAuth(authOptions)

// Explicitly export the handlers
export { handler as GET, handler as POST }

// Add runtime configuration to prevent static optimization
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
