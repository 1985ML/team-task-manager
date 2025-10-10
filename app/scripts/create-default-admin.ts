import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

async function createDefaultAdmin() {
  try {
    // Check if default admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@test.com' }
    })

    if (existingAdmin) {
      console.log('Default admin user already exists')
      return
    }

    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        name: 'Admin User',
        role: UserRole.ADMIN,
      }
    })

    console.log('Default admin user created successfully')
    console.log('Email: admin@test.com')
    console.log('Password: admin123')
    console.log('User ID:', adminUser.id)
  } catch (error) {
    console.error('Error creating default admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createDefaultAdmin()