import { createHash, randomBytes } from 'crypto'
import { prisma } from './db'

export interface ApiKeyData {
  id: string
  name: string
  scopes: string[]
  active: boolean
  lastUsed: Date | null
  createdAt: Date
  expiresAt: Date | null
}

export class ApiKeyManager {
  private static readonly KEY_PREFIX = 'ttm_'
  private static readonly KEY_LENGTH = 32

  static generateApiKey(): string {
    const bytes = randomBytes(this.KEY_LENGTH)
    return this.KEY_PREFIX + bytes.toString('hex')
  }

  static hashApiKey(apiKey: string): string {
    return createHash('sha256').update(apiKey).digest('hex')
  }

  static async createApiKey(
    userId: string,
    name: string,
    scopes: string[] = ['read', 'write'],
    expiresAt?: Date
  ): Promise<{ apiKey: string; keyData: ApiKeyData }> {
    const apiKey = this.generateApiKey()
    const keyHash = this.hashApiKey(apiKey)

    const keyData = await prisma.apiKey.create({
      data: {
        userId,
        name,
        keyHash,
        scopes,
        expiresAt
      }
    })

    return {
      apiKey,
      keyData: {
        id: keyData.id,
        name: keyData.name,
        scopes: keyData.scopes,
        active: keyData.active,
        lastUsed: keyData.lastUsed,
        createdAt: keyData.createdAt,
        expiresAt: keyData.expiresAt
      }
    }
  }

  static async validateApiKey(apiKey: string): Promise<{ valid: boolean; userId?: string; scopes?: string[] }> {
    if (!apiKey.startsWith(this.KEY_PREFIX)) {
      return { valid: false }
    }

    const keyHash = this.hashApiKey(apiKey)
    
    const keyRecord = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { user: true }
    })

    if (!keyRecord || !keyRecord.active || !keyRecord.user.isActive) {
      return { valid: false }
    }

    // Check expiration
    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      return { valid: false }
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsed: new Date() }
    })

    return {
      valid: true,
      userId: keyRecord.userId,
      scopes: keyRecord.scopes
    }
  }

  static async revokeApiKey(keyId: string, userId: string): Promise<boolean> {
    try {
      await prisma.apiKey.update({
        where: {
          id: keyId,
          userId // Ensure user can only revoke their own keys
        },
        data: { active: false }
      })
      return true
    } catch {
      return false
    }
  }

  static async getUserApiKeys(userId: string): Promise<ApiKeyData[]> {
    const keys = await prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    return keys.map(key => ({
      id: key.id,
      name: key.name,
      scopes: key.scopes,
      active: key.active,
      lastUsed: key.lastUsed,
      createdAt: key.createdAt,
      expiresAt: key.expiresAt
    }))
  }

  static async getApiKeyById(keyId: string, userId: string): Promise<ApiKeyData | null> {
    try {
      const key = await prisma.apiKey.findUnique({
        where: {
          id: keyId,
          userId // Ensure user can only access their own keys
        }
      })

      if (!key) {
        return null
      }

      return {
        id: key.id,
        name: key.name,
        scopes: key.scopes,
        active: key.active,
        lastUsed: key.lastUsed,
        createdAt: key.createdAt,
        expiresAt: key.expiresAt
      }
    } catch {
      return null
    }
  }

  static async updateApiKey(
    keyId: string,
    userId: string,
    updateData: {
      name?: string;
      scopes?: string[];
      expiresAt?: string;
    }
  ): Promise<ApiKeyData | null> {
    try {
      const dataToUpdate: any = {}

      if (updateData.name !== undefined) {
        dataToUpdate.name = updateData.name
      }

      if (updateData.scopes !== undefined) {
        dataToUpdate.scopes = updateData.scopes
      }

      if (updateData.expiresAt !== undefined) {
        dataToUpdate.expiresAt = updateData.expiresAt ? new Date(updateData.expiresAt) : null
      }

      const updatedKey = await prisma.apiKey.update({
        where: {
          id: keyId,
          userId // Ensure user can only update their own keys
        },
        data: dataToUpdate
      })

      return {
        id: updatedKey.id,
        name: updatedKey.name,
        scopes: updatedKey.scopes,
        active: updatedKey.active,
        lastUsed: updatedKey.lastUsed,
        createdAt: updatedKey.createdAt,
        expiresAt: updatedKey.expiresAt
      }
    } catch {
      return null
    }
  }
}