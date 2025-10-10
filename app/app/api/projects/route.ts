
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('ACTIVE'),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  teamId: z.string().min(1, 'Team is required')
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    const status = searchParams.get('status')

    // Build where clause
    const where: {
      team: {
        members: {
          some: {
            userId: string
          }
        }
      }
      teamId?: string
      status?: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
    } = {
      team: {
        members: {
          some: {
            userId: session.user.id
          }
        }
      }
    }

    if (teamId) {
      where.teamId = teamId
    }

    if (status) {
      where.status = status as 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        team: {
          select: {
            id: true,
            name: true
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
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createProjectSchema.parse(body)

    // Check if user is a member of the team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        teamId: validatedData.teamId
      }
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Not a member of this team' }, { status: 403 })
    }

    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        status: validatedData.status,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        teamId: validatedData.teamId,
        createdById: session.user.id
      },
      include: {
        team: {
          select: {
            id: true,
            name: true
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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
