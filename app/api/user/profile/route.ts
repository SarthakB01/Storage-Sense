import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { withAuth } from "@/lib/auth"
import { hashPassword, comparePassword } from "@/lib/auth"
import { z } from "zod"

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  avatar: z.string().url("Invalid avatar URL").optional().or(z.literal("")),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
})

/**
 * GET /api/user/profile - Get user profile
 */
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const userProfile = await db.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
        settings: true,
      },
    })

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user: userProfile })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
  }
})

/**
 * PUT /api/user/profile - Update user profile
 */
export const PUT = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    console.log("Profile update request:", body)

    const { name, avatar } = updateProfileSchema.parse(body)

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (avatar !== undefined) updateData.avatar = avatar || null

    console.log("Updating user with data:", updateData)

    const updatedUser = await db.user.update({
      where: { id: user.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
      },
    })

    console.log("User updated successfully:", updatedUser)

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Error updating user profile:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 })
  }
})

/**
 * POST /api/user/profile/change-password - Change user password
 */
export async function POST(request: NextRequest) {
  try {
    // Extract user from request manually for this specific endpoint
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { verifyToken } = await import("@/lib/auth")
    const userPayload = verifyToken(token)

    if (!userPayload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Password change request for user:", userPayload.userId)

    const { currentPassword, newPassword } = changePasswordSchema.parse(body)

    // Get current user with password
    const currentUser = await db.user.findUnique({
      where: { id: userPayload.userId },
      select: { id: true, password: true },
    })

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, currentUser.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword)

    // Update password
    await db.user.update({
      where: { id: userPayload.userId },
      data: { password: hashedNewPassword },
    })

    console.log("Password updated successfully for user:", userPayload.userId)

    return NextResponse.json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Error changing password:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to change password" }, { status: 500 })
  }
}
