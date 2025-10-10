import { PrismaClient } from '@prisma/client'

// Add better type safety
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Initialize Prisma Client with better error handling
let prisma: PrismaClient

try {
  prisma = globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
} catch (error) {
  console.error('Failed to initialize Prisma Client:', error)
  throw new Error('Failed to initialize database connection')
}

// For development, store the Prisma Client in globalThis to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export { prisma }
