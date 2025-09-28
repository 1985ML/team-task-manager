import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, requireScopes } from '@/lib/api-auth'
import { prisma } from '@/lib/db'
import { RecurringTaskService } from '@/lib/recurring-tasks'
import { z } from 'zod'

const recurringTaskSchema = z.object({
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
  interval: z.number().min(1).max(365),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  endDate: z.string().datetime().optional()
})

// POST /api/v1/tasks/[id]/recurring - Set up recurring task
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return auth.response!
  }

  if (!requireScopes(auth.context!, ['write'])) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const validation = recurringTaskSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    // Verify user has access to this task
    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
        team: {
          members: {
            some: { userId: auth.context!.userId }
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check if recurring task already exists
    const existingRecurring = await prisma.recurringTaskSeries.findUnique({
      where: { taskId: params.id }
    })

    if (existingRecurring) {
      return NextResponse.json(
        { error: 'Task is already set up as recurring' },
        { status: 400 }
      )
    }

    const { frequency, interval, daysOfWeek, dayOfMonth, endDate } = validation.data

    await RecurringTaskService.createRecurringTask(params.id, {
      frequency,
      interval,
      daysOfWeek,
      dayOfMonth,
      endDate: endDate ? new Date(endDate) : undefined
    })

    return NextResponse.json({
      message: 'Recurring task created successfully'
    })
  } catch (error) {
    console.error('Error creating recurring task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/v1/tasks/[id]/recurring - Get recurring task info
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
    // Verify user has access to this task
    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
        team: {
          members: {
            some: { userId: auth.context!.userId }
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    const recurringInfo = await RecurringTaskService.getRecurringTaskInfo(params.id)

    if (!recurringInfo) {
      return NextResponse.json(
        { error: 'Task is not set up as recurring' },
        { status: 404 }
      )
    }

    return NextResponse.json(recurringInfo)
  } catch (error) {
    console.error('Error fetching recurring task info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/v1/tasks/[id]/recurring - Update recurring task
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return auth.response!
  }

  if (!requireScopes(auth.context!, ['write'])) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const validation = recurringTaskSchema.partial().safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    // Verify user has access to this task
    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
        team: {
          members: {
            some: { userId: auth.context!.userId }
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    const { frequency, interval, daysOfWeek, dayOfMonth, endDate } = validation.data

    await RecurringTaskService.updateRecurringTask(params.id, {
      frequency,
      interval,
      daysOfWeek,
      dayOfMonth,
      endDate: endDate ? new Date(endDate) : undefined
    })

    return NextResponse.json({
      message: 'Recurring task updated successfully'
    })
  } catch (error) {
    console.error('Error updating recurring task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/tasks/[id]/recurring - Stop recurring task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return auth.response!
  }

  if (!requireScopes(auth.context!, ['write'])) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  try {
    // Verify user has access to this task
    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
        team: {
          members: {
            some: { userId: auth.context!.userId }
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    await RecurringTaskService.stopRecurringTask(params.id)

    return NextResponse.json({
      message: 'Recurring task stopped successfully'
    })
  } catch (error) {
    console.error('Error stopping recurring task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}