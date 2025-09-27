
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/tasks/[id] - Get task by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
        team: {
          members: {
            some: { userId: session.user.id }
          }
        }
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
            color: true,
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
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
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { message: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/tasks/[id] - Update task
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, status, priority, dueDate, assignedToId } = body

    // Verify user can edit this task
    const existingTask = await prisma.task.findFirst({
      where: {
        id: params.id,
        team: {
          members: {
            some: { userId: session.user.id }
          }
        }
      },
      include: { assignedTo: true }
    })

    if (!existingTask) {
      return NextResponse.json(
        { message: 'Task not found or you do not have permission to edit it' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status !== undefined) {
      updateData.status = status
      if (status === 'DONE' && existingTask.status !== 'DONE') {
        updateData.completedAt = new Date()
      } else if (status !== 'DONE' && existingTask.status === 'DONE') {
        updateData.completedAt = null
      }
    }
    if (priority !== undefined) updateData.priority = priority
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId

    const task = await prisma.task.update({
      where: { id: params.id },
      data: updateData,
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
        }
      }
    })

    // Create notifications for status changes or assignments
    if (status === 'DONE' && existingTask.status !== 'DONE') {
      // Task completed notification
      await prisma.notification.create({
        data: {
          title: 'Task Completed',
          message: `${session.user.name || 'Someone'} completed "${task.title}"`,
          type: 'TASK_COMPLETED',
          fromId: session.user.id,
          toId: existingTask.createdById,
          entityId: task.id,
          entityType: 'task'
        }
      })
    }

    if (assignedToId && assignedToId !== existingTask.assignedToId && assignedToId !== session.user.id) {
      // Task reassigned notification
      await prisma.notification.create({
        data: {
          title: 'Task Assigned',
          message: `You have been assigned to "${task.title}"`,
          type: 'TASK_ASSIGNED',
          fromId: session.user.id,
          toId: assignedToId,
          entityId: task.id,
          entityType: 'task'
        }
      })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/tasks/[id] - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user can delete this task (creator or admin)
    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
        OR: [
          { createdById: session.user.id },
          {
            team: {
              members: {
                some: {
                  userId: session.user.id,
                  role: { in: ['OWNER', 'ADMIN'] }
                }
              }
            }
          }
        ]
      }
    })

    if (!task) {
      return NextResponse.json(
        { message: 'Task not found or you do not have permission to delete it' },
        { status: 404 }
      )
    }

    await prisma.task.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
