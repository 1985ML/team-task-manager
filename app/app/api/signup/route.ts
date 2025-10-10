import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

// Validate environment variables
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is missing')
  throw new Error('Database configuration error')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, role } = body

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists with this email' },
        { status: 400 }
      )
    }

    // Validate and set role
    const validRoles: UserRole[] = ['ADMIN', 'MANAGER', 'MEMBER']
    const userRole = role?.toUpperCase()
    const finalRole = validRoles.includes(userRole) ? userRole as UserRole : UserRole.MEMBER

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        name: firstName && lastName ? `${firstName} ${lastName}` : null,
        role: finalRole,
      }
    })

    return NextResponse.json(
      { message: 'User created successfully', userId: user.id },
      { status: 201 }
    )
  } catch (error: any) {
    // Log basic error info along with runtime hints (useful on Vercel)
    console.error('Signup error:', {
      message: error?.message,
      name: error?.name,
      // include stack only in non-production logs to avoid leaking internals in some setups
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      nodeEnv: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL,
    })

    // Log more detailed error information
    if (error.code) {
      console.error('Database error code:', error.code)
    }
    if (error.meta) {
      console.error('Database error meta:', error.meta)
    }

    return NextResponse.json(
      {
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
