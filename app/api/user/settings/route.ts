import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { withAuth } from "@/lib/auth"
import { z } from "zod"

const updateSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  uploadNotifications: z.boolean().optional(),
  conversionNotifications: z.boolean().optional(),
})

/**
 * GET /api/user/settings - Get user settings
 */
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const settings = await db.userSettings.findUnique({
      where: { userId: user.userId },
    })

    if (!settings) {
      // Create default settings if they don't exist
      const defaultSettings = await db.userSettings.create({
        data: { userId: user.userId },
      })
      return NextResponse.json({ settings: defaultSettings })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Error fetching user settings:", error)
    return NextResponse.json({ error: "Failed to fetch user settings" }, { status: 500 })
  }
})

/**
 * PUT /api/user/settings - Update user settings
 */
export const PUT = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const validatedData = updateSettingsSchema.parse(body)

    const updatedSettings = await db.userSettings.upsert({
      where: { userId: user.userId },
      update: validatedData,
      create: {
        userId: user.userId,
        ...validatedData,
      },
    })

    return NextResponse.json({ settings: updatedSettings })
  } catch (error) {
    console.error("Error updating user settings:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to update user settings" }, { status: 500 })
  }
})
