import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, requireScopes } from '@/lib/api-auth'
import { prisma } from '@/lib/db'

// GET /api/v1/teams/[id] - Get team details
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
    const team = await prisma.team.findFirst({
      where: {
        id: params.id,
        members: {
          some: { userId: auth.context!.userId }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true
              }
            }
          },
          orderBy: { joinedAt: 'asc' }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            _count: {
              select: { tasks: true }
            }
          },
          orderBy: { updatedAt: 'desc' }
        },
        _count: {
          select: {
            tasks: true,
            projects: true
          }
        }
      }
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(team)
  } catch (error) {
    console.error('Error fetching team:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}