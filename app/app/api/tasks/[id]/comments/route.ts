
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/tasks/[id]/comments - Add comment to task
export async function POST(
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
    const { content } = body

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { message: 'Comment content is required' },
        { status: 400 }
      )
    }

    // Verify user can access this task
    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
        team: {
          members: {
            some: { userId: session.user.id }
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { message: 'Task not found or you do not have access' },
        { status: 404 }
      )
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
        taskId: params.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Create notification for task assignee (if different from commenter)
    if (task.assignedToId && task.assignedToId !== session.user.id) {
      await prisma.notification.create({
        data: {
          title: 'New Comment',
          message: `${session.user.name || 'Someone'} commented on "${task.title}"`,
          type: 'INFO',
          fromId: session.user.id,
          toId: task.assignedToId,
          entityId: task.id,
          entityType: 'task'
        }
      })
    }

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
