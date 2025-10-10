import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ApiKeyManager } from '@/lib/api-keys'
import { z } from 'zod'

const updateApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  scopes: z.array(z.string()).optional(),
  expiresAt: z.string().datetime().optional()
})

// GET /api/auth/api-keys/[id] - Get specific API key details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Allow callers to request the secret field via ?includeSecret=true
    let includeSecret = false
    try {
      const url = new URL(request.url)
      includeSecret = url.searchParams.get('includeSecret') === 'true'
    } catch (e) {
      // If parsing fails, default to not including the secret.
      includeSecret = false
    }

    const apiKey = await ApiKeyManager.getApiKeyById(params.id, session.user.id)

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not found or access denied' },
        { status: 404 }
      )
    }

    // Redact secret unless explicitly requested
    const apiKeyToReturn = includeSecret ? { ...apiKey, secret: '[SECRET_KEY]' } : { ...apiKey, secret: undefined }

    return NextResponse.json({ apiKey: apiKeyToReturn })
  } catch (error) {
    console.error('Error fetching API key:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST method to prevent build errors
export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

// PUT /api/auth/api-keys/[id] - Update API key
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = updateApiKeySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const updatedKey = await ApiKeyManager.updateApiKey(
      params.id,
      session.user.id,
      validation.data
    )

    if (!updatedKey) {
      return NextResponse.json(
        { error: 'API key not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'API key updated successfully',
      apiKey: updatedKey
    })
  } catch (error) {
    console.error('Error updating API key:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/auth/api-keys/[id] - Partially update API key
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return PUT(request, { params })
}

// DELETE /api/auth/api-keys/[id] - Revoke API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const success = await ApiKeyManager.revokeApiKey(params.id, session.user.id)

    if (!success) {
      return NextResponse.json(
        { error: 'API key not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'API key revoked successfully'
    })
  } catch (error) {
    console.error('Error revoking API key:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Add runtime configuration to prevent static optimization issues
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'