import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { withAuth } from "@/lib/auth"

/**
 * GET /api/user/storage - Get user storage information with detailed breakdown
 */
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    // Get user's files and calculate total size
    const files = await db.file.findMany({
      where: { userId: user.userId },
      select: { size: true, mimeType: true, createdAt: true },
    })

    const totalUsed = files.reduce((sum, file) => sum + file.size, 0)

    // Calculate usage by file type with more detailed categories
    const usageByType = files.reduce(
      (acc, file) => {
        const category = getFileCategory(file.mimeType)
        acc[category] = (acc[category] || 0) + file.size
        return acc
      },
      {} as Record<string, number>,
    )

    // Calculate usage trends (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentFiles = files.filter((file) => new Date(file.createdAt) >= thirtyDaysAgo)
    const recentUsage = recentFiles.reduce((sum, file) => sum + file.size, 0)

    // Get user's storage limit
    const settings = await db.userSettings.findUnique({
      where: { userId: user.userId },
    })

    const storageLimit = Number(settings?.storageLimit ?? 10737418240) // 10GB default
    const usagePercentage = totalUsed > 0 ? (totalUsed / storageLimit) * 100 : 0

    // Calculate file count by type
    const fileCountByType = files.reduce(
      (acc, file) => {
        const category = getFileCategory(file.mimeType)
        acc[category] = (acc[category] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Storage optimization suggestions
    const suggestions = generateStorageSuggestions(usageByType, totalUsed, storageLimit)

    return NextResponse.json({
      totalUsed,
      storageLimit,
      usageByType,
      usagePercentage: Math.round(usagePercentage * 10) / 10, // Round to 1 decimal
      fileCount: files.length,
      fileCountByType,
      recentUsage,
      suggestions,
      breakdown: {
        documents: {
          size: usageByType.documents || 0,
          count: fileCountByType.documents || 0,
          percentage: usageByType.documents ? Math.round((usageByType.documents / totalUsed) * 100) : 0,
        },
        images: {
          size: usageByType.images || 0,
          count: fileCountByType.images || 0,
          percentage: usageByType.images ? Math.round((usageByType.images / totalUsed) * 100) : 0,
        },
        videos: {
          size: usageByType.videos || 0,
          count: fileCountByType.videos || 0,
          percentage: usageByType.videos ? Math.round((usageByType.videos / totalUsed) * 100) : 0,
        },
        audio: {
          size: usageByType.audio || 0,
          count: fileCountByType.audio || 0,
          percentage: usageByType.audio ? Math.round((usageByType.audio / totalUsed) * 100) : 0,
        },
        archives: {
          size: usageByType.archives || 0,
          count: fileCountByType.archives || 0,
          percentage: usageByType.archives ? Math.round((usageByType.archives / totalUsed) * 100) : 0,
        },
        other: {
          size: usageByType.other || 0,
          count: fileCountByType.other || 0,
          percentage: usageByType.other ? Math.round((usageByType.other / totalUsed) * 100) : 0,
        },
      },
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
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("document") ||
    mimeType.includes("word") ||
    mimeType.includes("text") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("presentation")
  )
    return "documents"
  if (mimeType.includes("zip") || mimeType.includes("archive") || mimeType.includes("compressed")) return "archives"
  return "other"
}

function generateStorageSuggestions(
  usageByType: Record<string, number>,
  totalUsed: number,
  storageLimit: number,
): string[] {
  const suggestions: string[] = []
  const usagePercentage = (totalUsed / storageLimit) * 100

  // High usage warning
  if (usagePercentage > 80) {
    suggestions.push("Your storage is nearly full. Consider upgrading your plan or cleaning up old files.")
  } else if (usagePercentage > 60) {
    suggestions.push("You're using more than 60% of your storage. Consider reviewing your files.")
  }

  // Category-specific suggestions
  const largestCategory = Object.entries(usageByType).reduce((a, b) => (a[1] > b[1] ? a : b), ["", 0])

  if (largestCategory[1] > totalUsed * 0.5) {
    const categoryName = largestCategory[0]
    switch (categoryName) {
      case "videos":
        suggestions.push("Videos take up the most space. Consider compressing or removing old videos.")
        break
      case "images":
        suggestions.push("Images are using significant space. Consider optimizing image sizes or archiving old photos.")
        break
      case "documents":
        suggestions.push(
          "Documents are your largest category. Consider archiving old files or converting to more efficient formats.",
        )
        break
      case "archives":
        suggestions.push("Archive files are taking up space. Review if all compressed files are still needed.")
        break
    }
  }

  // Efficiency suggestions
  if (usageByType.images && usageByType.images > 1024 * 1024 * 100) {
    // > 100MB in images
    suggestions.push("Consider converting large images to more efficient formats like WebP.")
  }

  if (suggestions.length === 0) {
    suggestions.push("Your storage usage looks healthy! Keep organizing your files for optimal performance.")
  }

  return suggestions
}
