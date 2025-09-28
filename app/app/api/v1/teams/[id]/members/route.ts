import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, requireScopes } from '@/lib/api-auth'
import { prisma } from '@/lib/db'

// GET /api/v1/teams/[id]/members - Get team members
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return auth.response!
  }

  if (!requireScopes(auth.context!, ['read'])) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  try {
    // Verify user is member of this team
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: auth.context!.userId,
          teamId: params.id
        }
      }
    })

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Team not found or access denied' },
        { status: 404 }
      )
    }

    const members = await prisma.teamMember.findMany({
      where: { teamId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true
          }
        }
      },
      orderBy: { joinedAt: 'asc' }
    })

    return NextResponse.json({ members })
  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}