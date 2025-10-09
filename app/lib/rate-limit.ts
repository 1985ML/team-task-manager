import { NextRequest, NextResponse } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

class InMemoryRateLimiter {
  private store: RateLimitStore = {}
  private readonly windowMs: number
  private readonly maxRequests: number

  constructor(windowMs: number = 60000, maxRequests: number = 300) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000)
  }

  private cleanup() {
    const now = Date.now()
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key]
      }
    })
  }

  async isAllowed(identifier: string): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
  }> {
    const now = Date.now()
    const key = identifier

    if (!this.store[key] || this.store[key].resetTime < now) {
      this.store[key] = {
        count: 1,
        resetTime: now + this.windowMs
      }
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: this.store[key].resetTime
      }
    }

    this.store[key].count++

    return {
      allowed: this.store[key].count <= this.maxRequests,
      remaining: Math.max(0, this.maxRequests - this.store[key].count),
      resetTime: this.store[key].resetTime
    }
  }
}

// Global rate limiter instance
const rateLimiter = new InMemoryRateLimiter(60000, 300) // 300 requests per minute

export async function rateLimit(identifier: string) {
  const result = await rateLimiter.isAllowed(identifier)

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '300',
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
        }
      }
    )
  }

  return null // No rate limit hit
}

export function addRateLimitHeaders(response: NextResponse, remaining: number, resetTime: number) {
  response.headers.set('X-RateLimit-Limit', '300')
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', resetTime.toString())
  return response
}