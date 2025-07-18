import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import fs from "fs"

/**
 * GET /api/convert/[id]/download - Download converted file
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Extract user from request manually
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Downloading converted file for job ID:", params.id)

    const job = await db.conversionJob.findFirst({
      where: {
        id: params.id,
        status: "COMPLETED",
      },
    })

    if (!job || !job.resultFilePath) {
      console.log("Converted file not found for job:", params.id)
      return NextResponse.json({ error: "Converted file not found" }, { status: 404 })
    }

    // If resultFilePath is a Blob URL, redirect to it
    if (job.resultFilePath && job.resultFilePath.startsWith("https://")) {
      return NextResponse.redirect(job.resultFilePath, 302);
    }

    // Legacy: If you still have local files, handle them here (optional)
    return NextResponse.json({ error: "Converted file not found on disk" }, { status: 404 })
  } catch (error) {
    console.error("Error downloading converted file:", error)
    return NextResponse.json({ error: "Failed to download converted file" }, { status: 500 })
  }
}

function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
    odt: "application/vnd.oasis.opendocument.text",
    txt: "text/plain",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  }
  return mimeTypes[format.toLowerCase()] || "application/octet-stream"
}
