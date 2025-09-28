import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const savedSearchSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  filters: z.object({
    query: z.string().optional(),
    entityTypes: z.array(z.string()).optional(),
    teamId: z.string().optional(),
    projectId: z.string().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    assignedToId: z.string().optional(),
    dueDate: z.object({
      from: z.string().optional(),
      to: z.string().optional()
    }).optional()
  }),
  isDefault: z.boolean().default(false)
})

// GET /api/v1/saved-searches - List user's saved searches
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const savedSearches = await prisma.savedSearch.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({ savedSearches })
  } catch (error) {
    console.error('Error fetching saved searches:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/v1/saved-searches - Create saved search
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = savedSearchSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { name, description, filters, isDefault } = validation.data

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.savedSearch.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true
        },
        data: { isDefault: false }
      })
    }

    const savedSearch = await prisma.savedSearch.create({
      data: {
        userId: session.user.id,
        name,
        description: description || null,
        filters,
        isDefault
      }
    })

    return NextResponse.json(savedSearch, { status: 201 })
  } catch (error) {
    console.error('Error creating saved search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}