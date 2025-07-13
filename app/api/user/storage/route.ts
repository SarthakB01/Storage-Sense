import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { withAuth } from "@/lib/auth"

/**
 * GET /api/user/storage - Get user storage information
 */
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    // Get user's files and calculate total size
    const files = await db.file.findMany({
      where: { userId: user.userId },
      select: { size: true, mimeType: true },
    })

    const totalUsed = files.reduce((sum, file) => sum + file.size, 0)

    // Calculate usage by file type
    const usageByType = files.reduce(
      (acc, file) => {
        const category = getFileCategory(file.mimeType)
        acc[category] = (acc[category] || 0) + file.size
        return acc
      },
      {} as Record<string, number>,
    )

    // Get user's storage limit
    const settings = await db.userSettings.findUnique({
      where: { userId: user.userId },
    })

    const storageLimit = settings?.storageLimit || 10737418240 // 10GB default

    return NextResponse.json({
      totalUsed,
      storageLimit,
      usageByType,
      usagePercentage: Math.round((totalUsed / storageLimit) * 100),
    })
  } catch (error) {
    console.error("Error fetching storage info:", error)
    return NextResponse.json({ error: "Failed to fetch storage information" }, { status: 500 })
  }
})

function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "images"
  if (mimeType.startsWith("video/")) return "videos"
  if (mimeType.startsWith("audio/")) return "audio"
  if (mimeType.includes("pdf") || mimeType.includes("document") || mimeType.includes("text")) return "documents"
  return "other"
}
