'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { X, Upload, File, Image, FileText } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface FileUploadProps {
  entityType: 'TASK' | 'PROJECT' | 'COMMENT'
  entityId: string
  onUploadComplete?: (attachment: any) => void
  maxFiles?: number
  disabled?: boolean
}

interface UploadingFile {
  file: File
  progress: number
  error?: string
}

export function FileUpload({ 
  entityType, 
  entityId, 
  onUploadComplete, 
  maxFiles = 10,
  disabled = false 
}: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled || isUploading) return

    setIsUploading(true)
    const newUploadingFiles = acceptedFiles.map(file => ({
      file,
      progress: 0
    }))
    
    setUploadingFiles(prev => [...prev, ...newUploadingFiles])

    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i]
      
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('entityType', entityType)
        formData.append('entityId', entityId)

        const response = await fetch('/api/v1/attachments', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Upload failed')
        }

        const attachment = await response.json()
        
        // Update progress to 100%
        setUploadingFiles(prev => 
          prev.map(uf => 
            uf.file === file 
              ? { ...uf, progress: 100 }
              : uf
          )
        )

        // Call success callback
        if (onUploadComplete) {
          onUploadComplete(attachment)
        }

        toast.success(`${file.name} uploaded successfully`)
      } catch (error) {
        console.error('Upload error:', error)
        
        setUploadingFiles(prev => 
          prev.map(uf => 
            uf.file === file 
              ? { ...uf, error: error instanceof Error ? error.message : 'Upload failed' }
              : uf
          )
        )

        toast.error(`Failed to upload ${file.name}`)
      }
    }

    // Clear completed uploads after a delay
    setTimeout(() => {
      setUploadingFiles(prev => prev.filter(uf => uf.progress < 100 && !uf.error))
      setIsUploading(false)
    }, 2000)
  }, [entityType, entityId, onUploadComplete, disabled, isUploading])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: disabled || isUploading,
    maxFiles,
    maxSize: 25 * 1024 * 1024, // 25MB
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'application/zip': ['.zip'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv']
    }
  })

  const removeUploadingFile = (file: File) => {
    setUploadingFiles(prev => prev.filter(uf => uf.file !== file))
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-4 w-4" />
    } else if (mimeType === 'application/pdf' || mimeType.includes('document')) {
      return <FileText className="h-4 w-4" />
    }
    return <File className="h-4 w-4" />
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
              ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            {isDragActive ? (
              <p className="text-blue-600">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Drag & drop files here, or click to select files
                </p>
                <p className="text-sm text-gray-500">
                  Supports PDF, DOCX, XLSX, images, ZIP files (max 25MB each)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((uploadingFile, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {getFileIcon(uploadingFile.file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {uploadingFile.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(uploadingFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUploadingFile(uploadingFile.file)}
                    className="ml-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {uploadingFile.error ? (
                  <p className="text-sm text-red-600 mt-2">{uploadingFile.error}</p>
                ) : (
                  <div className="mt-2">
                    <Progress value={uploadingFile.progress} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}