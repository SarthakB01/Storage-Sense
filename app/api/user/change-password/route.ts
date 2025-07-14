import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { withAuth } from "@/lib/auth"
import { hashPassword, comparePassword } from "@/lib/auth"
import { z } from "zod"

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
})

/**
 * POST /api/user/change-password - Change user password
 */
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    console.log("Password change request for user:", user.userId)

    const { currentPassword, newPassword } = changePasswordSchema.parse(body)

    // Get current user with password
    const currentUser = await db.user.findUnique({
      where: { id: user.userId },
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
      where: { id: user.userId },
      data: { password: hashedNewPassword },
    })

    console.log("Password updated successfully for user:", user.userId)

    return NextResponse.json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Error changing password:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to change password" }, { status: 500 })
  }
})
