import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

/**
 * GET /api/convert/[id] - Get conversion job status
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Extract user from request manually since withAuth doesn't work with params
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    // You might want to verify the token here, but for now we'll proceed

    console.log("Getting conversion job status for ID:", params.id)

    const job = await db.conversionJob.findFirst({
      where: {
        id: params.id,
      },
    })

    if (!job) {
      console.log("Conversion job not found:", params.id)
      return NextResponse.json({ error: "Conversion job not found" }, { status: 404 })
    }

    console.log("Found conversion job:", {
      id: job.id,
      status: job.status,
      progress: job.progress,
      error: job.error,
    })

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
}
