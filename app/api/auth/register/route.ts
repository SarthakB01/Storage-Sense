import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/database"
import { hashPassword, generateToken } from "@/lib/auth"

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password)

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        settings: {
          create: {}, // Create default settings
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
    })

    // Generate JWT token
    const token = generateToken({ userId: user.id, email: user.email })

    return NextResponse.json({
      user,
      token,
    })
  } catch (error) {
    console.error("Registration error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
