import AWS from 'aws-sdk'
import { v4 as uuidv4 } from 'uuid'

// Configure AWS S3 (you can also use other storage providers)
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'team-task-manager-attachments'

export interface UploadResult {
  filename: string
  originalName: string
  fileSize: number
  mimeType: string
  cloudStoragePath: string
  url: string
}

export class FileStorageService {
  static async uploadFile(
    file: File | Buffer,
    originalName: string,
    mimeType: string,
    entityType: 'TASK' | 'PROJECT' | 'COMMENT',
    entityId: string
  ): Promise<UploadResult> {
    const fileExtension = originalName.split('.').pop() || ''
    const filename = `${uuidv4()}.${fileExtension}`
    const key = `${entityType.toLowerCase()}/${entityId}/${filename}`

    let fileBuffer: Buffer
    let fileSize: number

    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer()
      fileBuffer = Buffer.from(arrayBuffer)
      fileSize = file.size
    } else {
      fileBuffer = file
      fileSize = file.length
    }

    // Upload to S3
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      ServerSideEncryption: 'AES256'
    }

    try {
      const result = await s3.upload(uploadParams).promise()
      
      return {
        filename,
        originalName,
        fileSize,
        mimeType,
        cloudStoragePath: key,
        url: result.Location
      }
    } catch (error) {
      console.error('Error uploading file to S3:', error)
      throw new Error('Failed to upload file')
    }
  }

  static async deleteFile(cloudStoragePath: string): Promise<boolean> {
    try {
      await s3.deleteObject({
        Bucket: BUCKET_NAME,
        Key: cloudStoragePath
      }).promise()
      
      return true
    } catch (error) {
      console.error('Error deleting file from S3:', error)
      return false
    }
  }

  static async getSignedUrl(cloudStoragePath: string, expiresIn: number = 3600): Promise<string> {
    try {
      const url = await s3.getSignedUrlPromise('getObject', {
        Bucket: BUCKET_NAME,
        Key: cloudStoragePath,
        Expires: expiresIn
      })
      
      return url
    } catch (error) {
      console.error('Error generating signed URL:', error)
      throw new Error('Failed to generate download URL')
    }
  }

  static validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 25 * 1024 * 1024 // 25MB
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/zip',
      'text/plain',
      'text/csv'
    ]

    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 25MB limit' }
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not allowed' }
    }

    return { valid: true }
  }
}

// Alternative: Local file storage for development
export class LocalFileStorageService {
  private static readonly UPLOAD_DIR = './uploads'

  static async uploadFile(
    file: File | Buffer,
    originalName: string,
    mimeType: string,
    entityType: 'TASK' | 'PROJECT' | 'COMMENT',
    entityId: string
  ): Promise<UploadResult> {
    const fs = require('fs').promises
    const path = require('path')

    const fileExtension = originalName.split('.').pop() || ''
    const filename = `${uuidv4()}.${fileExtension}`
    const relativePath = `${entityType.toLowerCase()}/${entityId}/${filename}`
    const fullPath = path.join(this.UPLOAD_DIR, relativePath)

    let fileBuffer: Buffer
    let fileSize: number

    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer()
      fileBuffer = Buffer.from(arrayBuffer)
      fileSize = file.size
    } else {
      fileBuffer = file
      fileSize = file.length
    }

    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true })

    // Write file
    await fs.writeFile(fullPath, fileBuffer)

    return {
      filename,
      originalName,
      fileSize,
      mimeType,
      cloudStoragePath: relativePath,
      url: `/api/attachments/${relativePath}`
    }
  }

  static async deleteFile(cloudStoragePath: string): Promise<boolean> {
    try {
      const fs = require('fs').promises
      const path = require('path')
      const fullPath = path.join(this.UPLOAD_DIR, cloudStoragePath)
      await fs.unlink(fullPath)
      return true
    } catch (error) {
      console.error('Error deleting local file:', error)
      return false
    }
  }

  static async getSignedUrl(cloudStoragePath: string): Promise<string> {
    return `/api/attachments/${cloudStoragePath}`
  }

  static validateFile = FileStorageService.validateFile
}

// Use local storage in development, S3 in production
export const StorageService = process.env.NODE_ENV === 'production' 
  ? FileStorageService 
  : LocalFileStorageService