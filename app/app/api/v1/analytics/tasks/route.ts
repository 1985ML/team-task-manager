import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, requireScopes } from '@/lib/api-auth'
import { AnalyticsService } from '@/lib/analytics'
import { z } from 'zod'

const analyticsQuerySchema = z.object({
  teamId: z.string().optional(),
  projectId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

// GET /api/v1/analytics/tasks - Task completion analytics
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
    const query = {
      teamId: searchParams.get('teamId') || undefined,
      projectId: searchParams.get('projectId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined
    }

    const validation = analyticsQuerySchema.safeParse(query)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { teamId, projectId, startDate, endDate } = validation.data

    const dateRange = startDate && endDate 
      ? { start: new Date(startDate), end: new Date(endDate) }
      : undefined

    const [
      taskAnalytics,
      tasksByStatus,
      tasksByPriority,
      weeklyProgress
    ] = await Promise.all([
      AnalyticsService.getTaskAnalytics(auth.context!.userId, teamId, projectId, dateRange),
      AnalyticsService.getTasksByStatus(auth.context!.userId, teamId, projectId, dateRange),
      AnalyticsService.getTasksByPriority(auth.context!.userId, teamId, projectId, dateRange),
      AnalyticsService.getWeeklyProgress(auth.context!.userId, teamId, projectId)
    ])

    return NextResponse.json({
      overview: taskAnalytics,
      tasksByStatus,
      tasksByPriority,
      weeklyProgress
    })
  } catch (error) {
    console.error('Error fetching task analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}