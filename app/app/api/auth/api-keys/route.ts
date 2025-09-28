import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ApiKeyManager } from '@/lib/api-keys'
import { z } from 'zod'

const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  scopes: z.array(z.string()).default(['read', 'write']),
  expiresAt: z.string().datetime().optional()
})

// GET /api/auth/api-keys - List user's API keys
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const apiKeys = await ApiKeyManager.getUserApiKeys(session.user.id)
    
    return NextResponse.json({ apiKeys })
  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/auth/api-keys - Create new API key
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = createApiKeySchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { name, scopes, expiresAt } = validation.data
    
    const result = await ApiKeyManager.createApiKey(
      session.user.id,
      name,
      scopes,
      expiresAt ? new Date(expiresAt) : undefined
    )

    return NextResponse.json({
      message: 'API key created successfully',
      apiKey: result.apiKey, // Only return the key once
      keyData: result.keyData
    })
  } catch (error) {
    console.error('Error creating API key:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}