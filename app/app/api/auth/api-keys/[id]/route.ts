import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ApiKeyManager } from '@/lib/api-keys'

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