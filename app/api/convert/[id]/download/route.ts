import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { withAuth } from "@/lib/auth"
import fs from "fs"

/**
 * GET /api/convert/[id]/download - Download converted file
 */
export const GET = withAuth(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  try {
    const job = await db.conversionJob.findFirst({
      where: {
        id: params.id,
        userId: user.userId,
        status: "COMPLETED",
      },
    })

    if (!job || !job.resultFilePath) {
      return NextResponse.json({ error: "Converted file not found" }, { status: 404 })
    }

    // Check if file exists on disk
    if (!fs.existsSync(job.resultFilePath)) {
      return NextResponse.json({ error: "Converted file not found on disk" }, { status: 404 })
    }

    // Read file and return as response
    const fileBuffer = fs.readFileSync(job.resultFilePath)
    const mimeType = getMimeType(job.targetFormat)

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${job.resultFileName}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("Error downloading converted file:", error)
    return NextResponse.json({ error: "Failed to download converted file" }, { status: 500 })
  }
})

function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    odt: "application/vnd.oasis.opendocument.text",
  }
  return mimeTypes[format] || "application/octet-stream"
}
