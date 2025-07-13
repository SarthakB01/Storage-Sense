import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { withAuth } from "@/lib/auth"

/**
 * GET /api/convert/[id] - Get conversion job status
 */
export const GET = withAuth(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  try {
    const job = await db.conversionJob.findFirst({
      where: {
        id: params.id,
        userId: user.userId,
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Conversion job not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: job.id,
      status: job.status,
      progress: job.progress,
      error: job.error,
      sourceFileName: job.sourceFileName,
      targetFormat: job.targetFormat,
      resultFileName: job.resultFileName,
      createdAt: job.createdAt,
    })
  } catch (error) {
    console.error("Error fetching conversion job:", error)
    return NextResponse.json({ error: "Failed to fetch conversion job" }, { status: 500 })
  }
})
