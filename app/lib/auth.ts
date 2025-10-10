import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

// Add environment variable validation
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required')
}

// Validate database connection
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}

// Default admin credentials for testing
const DEFAULT_ADMIN_EMAIL = 'admin@test.com'
const DEFAULT_ADMIN_PASSWORD = 'admin123'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // For testing: bypass password check for default admin in development
        if (process.env.NODE_ENV === 'development' &&
            credentials.email === DEFAULT_ADMIN_EMAIL &&
            credentials.password === DEFAULT_ADMIN_PASSWORD) {

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (user) {
            return {
              id: user.id,
              email: user.email,
              name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
              role: user.role,
            }
          }
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          role: user.role,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login'
  }
}
