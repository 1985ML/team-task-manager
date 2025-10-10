import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, requireScopes } from '@/lib/api-auth'
import { prisma } from '@/lib/db'
import { StorageService } from '@/lib/file-storage'

// POST /api/v1/attachments - Upload file
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return auth.response!
  }

  if (!requireScopes(auth.context!, ['write'])) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const entityType = formData.get('entityType') as string
    const entityId = formData.get('entityId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'Entity type and ID are required' },
        { status: 400 }
      )
    }

    if (!['TASK', 'PROJECT', 'COMMENT'].includes(entityType)) {
      return NextResponse.json(
        { error: 'Invalid entity type' },
        { status: 400 }
      )
    }

    // Validate file
    const validation = StorageService.validateFile(file)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Verify user has access to the entity
    let hasAccess = false
    
    if (entityType === 'TASK') {
      const task = await prisma.task.findFirst({
        where: {
          id: entityId,
          team: {
            members: {
              some: { userId: auth.context!.userId }
            }
          }
        }
      })
      hasAccess = !!task
    } else if (entityType === 'PROJECT') {
      const project = await prisma.project.findFirst({
        where: {
          id: entityId,
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
        { error: 'Entity not found or access denied' },
        { status: 404 }
      )
    }

    // Upload file
    const uploadResult = await StorageService.uploadFile(
      file,
      file.name,
      file.type,
      entityType as 'TASK' | 'PROJECT' | 'COMMENT',
      entityId
    )

    // Save attachment record
    const attachment = await prisma.attachment.create({
      data: {
        entityType: entityType as 'TASK' | 'PROJECT' | 'COMMENT',
        entityId,
        filename: uploadResult.filename,
        originalName: uploadResult.originalName,
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.mimeType,
        cloudStoragePath: uploadResult.cloudStoragePath,
        uploadedById: auth.context!.userId
      },
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

    return NextResponse.json({
      ...attachment,
      downloadUrl: uploadResult.url
    }, { status: 201 })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/v1/attachments - List attachments for entity
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
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'Entity type and ID are required' },
        { status: 400 }
      )
    }

    // Verify user has access to the entity
    let hasAccess = false
    
    if (entityType === 'TASK') {
      const task = await prisma.task.findFirst({
        where: {
          id: entityId,
          team: {
            members: {
              some: { userId: auth.context!.userId }
            }
          }
        }
      })
      hasAccess = !!task
    } else if (entityType === 'PROJECT') {
      const project = await prisma.project.findFirst({
        where: {
          id: entityId,
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
        { error: 'Entity not found or access denied' },
        { status: 404 }
      )
    }

    const attachments = await prisma.attachment.findMany({
      where: {
        entityType: entityType as 'TASK' | 'PROJECT' | 'COMMENT',
        entityId
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { uploadedAt: 'desc' }
    })

    // Generate download URLs
    const attachmentsWithUrls = await Promise.all(
      attachments.map(async (attachment) => {
        const downloadUrl = await StorageService.getSignedUrl(attachment.cloudStoragePath)
        return {
          ...attachment,
          downloadUrl
        }
      })
    )

    return NextResponse.json({ attachments: attachmentsWithUrls })
  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}