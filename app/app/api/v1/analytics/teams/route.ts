import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, requireScopes } from '@/lib/api-auth'
import { AnalyticsService } from '@/lib/analytics'
import { z } from 'zod'

const teamAnalyticsQuerySchema = z.object({
  teamId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

// GET /api/v1/analytics/teams - Team performance metrics
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
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined
    }

    const validation = teamAnalyticsQuerySchema.safeParse(query)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { teamId, startDate, endDate } = validation.data

    const dateRange = startDate && endDate 
      ? { start: new Date(startDate), end: new Date(endDate) }
      : undefined

    const [teamPerformance, projectAnalytics] = await Promise.all([
      AnalyticsService.getTeamPerformance(auth.context!.userId, teamId, dateRange),
      AnalyticsService.getProjectAnalytics(auth.context!.userId, teamId, dateRange)
    ])

    return NextResponse.json({
      teamPerformance,
      projectAnalytics
    })
  } catch (error) {
    console.error('Error fetching team analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}