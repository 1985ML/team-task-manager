import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { rateLimit } from './rate-limit'
import { ApiKeyManager } from './api-keys'
import { authOptions } from './auth'

export interface AuthContext {
  userId: string
  authType: 'session' | 'api_key'
  scopes?: string[]
}

export async function authenticateRequest(request: NextRequest): Promise<{
  success: boolean
  context?: AuthContext
  response?: NextResponse
}> {
  const url = new URL(request.url)

  // Apply rate limiting for API routes
  if (url.pathname.startsWith('/api/v1/')) {
    const identifier = getClientIdentifier(request)
    const rateLimitResponse = await rateLimit(identifier)
    if (rateLimitResponse) {
      return { success: false, response: rateLimitResponse }
    }
  }

  // Check for API key authentication first
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const apiKey = authHeader.substring(7)
    const validation = await ApiKeyManager.validateApiKey(apiKey)
    
    if (validation.valid && validation.userId) {
      return {
        success: true,
        context: {
          userId: validation.userId,
          authType: 'api_key',
          scopes: validation.scopes
        }
      }
    }
    
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }
  }

  // Fall back to session authentication for non-API routes
  if (!url.pathname.startsWith('/api/v1/')) {
    try {
      const session = await getServerSession(authOptions)
      if (session?.user?.id) {
        return {
          success: true,
          context: {
            userId: session.user.id,
            authType: 'session'
          }
        }
      }
    } catch (error) {
      console.error('Session authentication error:', error)
    }
  }

  return {
    success: false,
    response: NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }
}

function getClientIdentifier(request: NextRequest): string {
  // Try to get client IP from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp
  }
  
  // Fallback to a default identifier
  return 'unknown'
}

export function requireScopes(context: AuthContext, requiredScopes: string[]): boolean {
  if (context.authType === 'session') {
    return true // Session auth has full access
  }
  
  if (!context.scopes) {
    return false
  }
  
  return requiredScopes.every(scope => context.scopes!.includes(scope))
}