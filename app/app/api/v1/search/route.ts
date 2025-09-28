import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, requireScopes } from '@/lib/api-auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  entityTypes: z.array(z.enum(['TASK', 'PROJECT', 'COMMENT'])).default(['TASK', 'PROJECT']),
  teamId: z.string().optional(),
  projectId: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0)
})

// GET /api/v1/search - Full-text search across entities
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
    const queryParams = {
      query: searchParams.get('query') || '',
      entityTypes: searchParams.get('entityTypes')?.split(',') || ['TASK', 'PROJECT'],
      teamId: searchParams.get('teamId') || undefined,
      projectId: searchParams.get('projectId') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0')
    }

    const validation = searchSchema.safeParse(queryParams)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { query, entityTypes, teamId, projectId, limit, offset } = validation.data
    const results: any[] = []

    // Search tasks
    if (entityTypes.includes('TASK')) {
      const taskWhere: any = {
        team: {
          members: {
            some: { userId: auth.context!.userId }
          }
        },
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      }

      if (teamId) {
        taskWhere.teamId = teamId
      }

      if (projectId) {
        if (projectId === 'no-project') {
          taskWhere.projectId = null
        } else {
          taskWhere.projectId = projectId
        }
      }

      const tasks = await prisma.task.findMany({
        where: taskWhere,
        include: {
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
              name: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        take: Math.floor(limit / entityTypes.length),
        skip: offset,
        orderBy: { updatedAt: 'desc' }
      })

      results.push(...tasks.map(task => ({
        ...task,
        entityType: 'TASK',
        relevanceScore: calculateRelevanceScore(query, task.title, task.description)
      })))
    }

    // Search projects
    if (entityTypes.includes('PROJECT')) {
      const projectWhere: any = {
        team: {
          members: {
            some: { userId: auth.context!.userId }
          }
        },
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      }

      if (teamId) {
        projectWhere.teamId = teamId
      }

      const projects = await prisma.project.findMany({
        where: projectWhere,
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
        take: Math.floor(limit / entityTypes.length),
        skip: offset,
        orderBy: { updatedAt: 'desc' }
      })

      results.push(...projects.map(project => ({
        ...project,
        entityType: 'PROJECT',
        relevanceScore: calculateRelevanceScore(query, project.name, project.description)
      })))
    }

    // Search comments
    if (entityTypes.includes('COMMENT')) {
      const comments = await prisma.comment.findMany({
        where: {
          task: {
            team: {
              members: {
                some: { userId: auth.context!.userId }
              }
            }
          },
          content: { contains: query, mode: 'insensitive' }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          task: {
            select: {
              id: true,
              title: true,
              team: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        take: Math.floor(limit / entityTypes.length),
        skip: offset,
        orderBy: { createdAt: 'desc' }
      })

      results.push(...comments.map(comment => ({
        ...comment,
        entityType: 'COMMENT',
        relevanceScore: calculateRelevanceScore(query, comment.content)
      })))
    }

    // Sort by relevance score
    results.sort((a, b) => b.relevanceScore - a.relevanceScore)

    return NextResponse.json({
      results: results.slice(0, limit),
      pagination: {
        total: results.length,
        limit,
        offset,
        hasMore: results.length > limit
      },
      query,
      entityTypes
    })
  } catch (error) {
    console.error('Error performing search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateRelevanceScore(query: string, ...texts: (string | null | undefined)[]): number {
  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0)
  let score = 0

  for (const text of texts) {
    if (!text) continue
    
    const lowerText = text.toLowerCase()
    
    for (const term of searchTerms) {
      // Exact match gets highest score
      if (lowerText.includes(term)) {
        score += 10
        
        // Bonus for word boundary matches
        const wordBoundaryRegex = new RegExp(`\\b${term}\\b`, 'i')
        if (wordBoundaryRegex.test(text)) {
          score += 5
        }
        
        // Bonus for matches at the beginning
        if (lowerText.startsWith(term)) {
          score += 3
        }
      }
    }
  }

  return score
}