import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, requireScopes } from '@/lib/api-auth'
import { prisma } from '@/lib/db'
import { StorageService } from '@/lib/file-storage'

// GET /api/v1/attachments/[id] - Get attachment details and download URL
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
    const attachment = await prisma.attachment.findUnique({
      where: { id: params.id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      )
    }

    // Verify user has access to the entity
    let hasAccess = false
    
    if (attachment.entityType === 'TASK') {
      const task = await prisma.task.findFirst({
        where: {
          id: attachment.entityId,
          team: {
            members: {
              some: { userId: auth.context!.userId }
            }
          }
        }
      })
      hasAccess = !!task
    } else if (attachment.entityType === 'PROJECT') {
      const project = await prisma.project.findFirst({
        where: {
          id: attachment.entityId,
          team: {
            members: {
              some: { userId: auth.context!.userId }
            }
          }
        }
      })
      hasAccess = !!project
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const downloadUrl = await StorageService.getSignedUrl(attachment.cloudStoragePath)

    return NextResponse.json({
      ...attachment,
      downloadUrl
    })
  } catch (error) {
    console.error('Error fetching attachment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/attachments/[id] - Delete attachment
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
    const attachment = await prisma.attachment.findUnique({
      where: { id: params.id }
    })

    if (!attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      )
    }

    // Verify user has access to the entity
    let hasAccess = false
    
    if (attachment.entityType === 'TASK') {
      const task = await prisma.task.findFirst({
        where: {
          id: attachment.entityId,
          team: {
            members: {
              some: { userId: auth.context!.userId }
            }
          }
        }
      })
      hasAccess = !!task
    } else if (attachment.entityType === 'PROJECT') {
      const project = await prisma.project.findFirst({
        where: {
          id: attachment.entityId,
          team: {
            members: {
              some: { userId: auth.context!.userId }
            }
          }
        }
      })
      hasAccess = !!project
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Delete from storage
    await StorageService.deleteFile(attachment.cloudStoragePath)

    // Delete from database
    await prisma.attachment.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Attachment deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting attachment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}