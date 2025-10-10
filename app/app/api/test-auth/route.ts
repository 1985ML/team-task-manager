import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

// Ensure this runs on the server side
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      )
    }

    return NextResponse.json({
      message: "Authentication successful",
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
      }
    })
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}