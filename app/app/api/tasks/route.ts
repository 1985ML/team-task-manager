
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/tasks - Get all tasks for user's teams
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const teamId = searchParams.get('teamId')
    const projectId = searchParams.get('projectId')
    const assignedToMe = searchParams.get('assignedToMe') === 'true'

    // Build where clause
    const where: any = {
      team: {
        members: {
          some: { userId: session.user.id }
        }
      }
    }

    if (assignedToMe) {
      where.assignedToId = session.user.id
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

    const tasks = await prisma.task.findMany({
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
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 3 // Latest 3 comments
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
      ]
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, status, priority, dueDate, assignedToId, teamId, projectId } = body

    if (!title || !teamId) {
      return NextResponse.json(
        { message: 'Title and team are required' },
        { status: 400 }
      )
    }

    // Verify user is member of the team
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId: teamId
        }
      }
    })

    if (!teamMember) {
      return NextResponse.json(
        { message: 'You are not a member of this team' },
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
          { message: 'Project does not belong to this team' },
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
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedToId: assignedToId || null,
        teamId,
        projectId: projectId || null,
        createdById: session.user.id,
        position: nextPosition
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
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

    // Create notification if assigned to someone
    if (assignedToId && assignedToId !== session.user.id) {
      await prisma.notification.create({
        data: {
          title: 'New Task Assigned',
          message: `You have been assigned to "${title}"`,
          type: 'TASK_ASSIGNED',
          fromId: session.user.id,
          toId: assignedToId,
          entityId: task.id,
          entityType: 'task'
        }
      })
    }

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
