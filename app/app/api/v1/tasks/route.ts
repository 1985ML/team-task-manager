import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, requireScopes } from '@/lib/api-auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
  assignedToId: z.string().optional(),
  teamId: z.string().min(1, 'Team is required'),
  projectId: z.string().optional()
})

// GET /api/v1/tasks - List tasks with advanced filtering
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
    const priority = searchParams.get('priority')
    const teamId = searchParams.get('teamId')
    const projectId = searchParams.get('projectId')
    const assignedToMe = searchParams.get('assignedToMe') === 'true'
    const assignedToId = searchParams.get('assignedToId')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {
      team: {
        members: {
          some: { userId: auth.context!.userId }
        }
      }
    }

    if (assignedToMe) {
      where.assignedToId = auth.context!.userId
    } else if (assignedToId) {
      where.assignedToId = assignedToId
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (priority && priority !== 'all') {
      where.priority = priority
    }

    if (teamId && teamId !== 'all') {
      where.teamId = teamId
    }

    if (projectId && projectId !== 'all') {
      if (projectId === 'no-project') {
        where.projectId = null
      } else {
        where.projectId = projectId
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          team: {
            select: {
              id: true,
              name: true,
              color: true
            }
          },
          project: {
            select: {
              id: true,
              name: true,
              status: true
            }
          },
          _count: {
            select: { comments: true }
          }
        },
        orderBy: [
          { status: 'asc' },
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: offset
      }),
      prisma.task.count({ where })
    ])

    return NextResponse.json({
      tasks,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/v1/tasks - Create task
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
    const validation = taskSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { title, description, status, priority, dueDate, assignedToId, teamId, projectId } = validation.data

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

    // If projectId is provided, verify it belongs to the team
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          teamId: teamId
        }
      })

      if (!project) {
        return NextResponse.json(
          { error: 'Project does not belong to this team' },
          { status: 400 }
        )
      }
    }

    // Get the next position for the task
    const lastTask = await prisma.task.findFirst({
      where: { teamId },
      orderBy: { position: 'desc' }
    })
    const nextPosition = (lastTask?.position || 0) + 1

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedToId: assignedToId || null,
        teamId,
        projectId: projectId || null,
        createdById: auth.context!.userId,
        position: nextPosition
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}