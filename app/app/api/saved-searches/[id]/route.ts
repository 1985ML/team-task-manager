import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateSavedSearchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
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
  }).optional(),
  isDefault: z.boolean().optional()
})

// GET /api/saved-searches/[id] - Get saved search
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const savedSearch = await prisma.savedSearch.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!savedSearch) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(savedSearch)
  } catch (error) {
    console.error('Error fetching saved search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/saved-searches/[id] - Update saved search
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = updateSavedSearchSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    // Verify ownership
    const existingSearch = await prisma.savedSearch.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingSearch) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      )
    }

    const { name, description, filters, isDefault } = validation.data

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.savedSearch.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true,
          id: { not: params.id }
        },
        data: { isDefault: false }
      })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (filters !== undefined) updateData.filters = filters
    if (isDefault !== undefined) updateData.isDefault = isDefault

    const savedSearch = await prisma.savedSearch.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json(savedSearch)
  } catch (error) {
    console.error('Error updating saved search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/saved-searches/[id] - Delete saved search
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify ownership
    const existingSearch = await prisma.savedSearch.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingSearch) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      )
    }

    await prisma.savedSearch.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Saved search deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting saved search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}