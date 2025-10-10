import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, requireScopes } from '@/lib/api-auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long'),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('ACTIVE'),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  teamId: z.string().min(1, 'Team is required')
})

// GET /api/v1/projects - List projects with filtering
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return auth.response!
  }

  if (!requireScopes(auth.context!, ['read'])) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const teamId = searchParams.get('teamId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: {
      team: {
        members: {
          some: { userId: string }
        }
      }
      status?: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
      teamId?: string
    } = {
      team: {
        members: {
          some: { userId: auth.context!.userId }
        }
      }
    }

    if (status && status !== 'all') {
      where.status = status as 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
    }

    if (teamId && teamId !== 'all') {
      where.teamId = teamId
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          team: {
            select: {
              id: true,
              name: true,
              color: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              tasks: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.project.count({ where })
    ])

    return NextResponse.json({
      projects,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/v1/projects - Create project
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return auth.response!
  }

  if (!requireScopes(auth.context!, ['write'])) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const validation = projectSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { name, description, status, startDate, dueDate, teamId } = validation.data

    // Verify user is member of the team
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: auth.context!.userId,
          teamId: teamId
        }
      }
    })

    if (!teamMember) {
      return NextResponse.json(
        { error: 'You are not a member of this team' },
        { status: 403 }
      )
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        status,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        teamId,
        createdById: auth.context!.userId
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            tasks: true
          }
        }
      }
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}