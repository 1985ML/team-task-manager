'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, Trash2, File, Image, FileText, Eye } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

interface Attachment {
  id: string
  filename: string
  originalName: string
  fileSize: number
  mimeType: string
  uploadedAt: string
  downloadUrl: string
  uploadedBy: {
    id: string
    name: string
    email: string
  }
}

interface FileListProps {
  entityType: 'TASK' | 'PROJECT' | 'COMMENT'
  entityId: string
  onAttachmentDeleted?: (attachmentId: string) => void
}

export function FileList({ entityType, entityId, onAttachmentDeleted }: FileListProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchAttachments()
  }, [entityType, entityId])

  const fetchAttachments = async () => {
    try {
      const response = await fetch(
        `/api/v1/attachments?entityType=${entityType}&entityId=${entityId}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setAttachments(data.attachments)
      } else {
        console.error('Failed to fetch attachments')
      }
    } catch (error) {
      console.error('Error fetching attachments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) {
      return
    }

    setDeleting(attachmentId)
    
    try {
      const response = await fetch(`/api/v1/attachments/${attachmentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setAttachments(prev => prev.filter(a => a.id !== attachmentId))
        toast.success('Attachment deleted successfully')
        
        if (onAttachmentDeleted) {
          onAttachmentDeleted(attachmentId)
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete attachment')
      }
    } catch (error) {
      console.error('Error deleting attachment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete attachment')
    } finally {
      setDeleting(null)
    }
  }

  const handleDownload = async (attachment: Attachment) => {
    try {
      const response = await fetch(`/api/v1/attachments/${attachment.id}`)
      
      if (response.ok) {
        const data = await response.json()
        window.open(data.downloadUrl, '_blank')
      } else {
        throw new Error('Failed to get download URL')
      }
    } catch (error) {
      console.error('Error downloading attachment:', error)
      toast.error('Failed to download attachment')
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />
    } else if (mimeType === 'application/pdf' || mimeType.includes('document')) {
      return <FileText className="h-5 w-5 text-red-500" />
    }
    return <File className="h-5 w-5 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const canPreview = (mimeType: string) => {
    return mimeType.startsWith('image/') || mimeType === 'application/pdf'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading attachments...</div>
        </CardContent>
      </Card>
    )
  }

  if (attachments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">No attachments yet</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Attachments ({attachments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(attachment.mimeType)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {attachment.originalName}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {formatFileSize(attachment.fileSize)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        by {attachment.uploadedBy.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(attachment.uploadedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {canPreview(attachment.mimeType) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(attachment)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(attachment)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(attachment.id)}
                    disabled={deleting === attachment.id}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}