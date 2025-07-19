import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { withAuth } from "@/lib/auth"
import { put } from "@vercel/blob"
import fetch from "node-fetch"

/**
 * POST /api/convert/[id]/save-to-cloud - Save converted file to user's cloud storage
 */
export const POST = withAuth(async (request: NextRequest, user) => {
  // Extract the job ID from the URL path
  const pathSegments = request.nextUrl.pathname.split('/')
  const jobId = pathSegments[pathSegments.length - 2] // The ID is the second-to-last segment
  try {
    console.log("Saving converted file to cloud for job:", jobId)

    // Get the conversion job
    const job = await db.conversionJob.findFirst({
      where: {
        id: jobId,
        userId: user.userId,
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Conversion job not found" }, { status: 404 })
    }

    if (job.status !== "COMPLETED") {
      return NextResponse.json({ error: "Conversion job is not completed" }, { status: 400 })
    }

    if (!job.resultFilePath) {
      return NextResponse.json({ error: "No result file found" }, { status: 404 })
    }

    // Download the converted file from the Blob URL
    const response = await fetch(job.resultFilePath)
    if (!response.ok) {
      throw new Error("Failed to download converted file")
    }

    const fileBuffer = Buffer.from(await response.arrayBuffer())
    const fileName = job.resultFileName || `converted_${job.sourceFileName}.${job.targetFormat.toLowerCase()}`

    // Upload to user's cloud storage with unique filename
    const blob = await put(fileName, new Blob([fileBuffer]), {
      access: "public",
      addRandomSuffix: true,
    })

    // Create a new file record in the database
    const newFile = await db.file.create({
      data: {
        userId: user.userId,
        filename: fileName,
        originalName: fileName,
        mimeType: getMimeType(job.targetFormat),
        size: fileBuffer.length,
        path: blob.url,
        folder: "/",
      },
    })

    console.log("Converted file saved to cloud:", newFile.id)

    return NextResponse.json({
      success: true,
      fileId: newFile.id,
      fileName: newFile.originalName,
      fileUrl: blob.url,
      message: "Converted file saved to your cloud storage",
    })
  } catch (error) {
    console.error("Error saving converted file to cloud:", error)
    return NextResponse.json(
      {
        error: "Failed to save converted file to cloud",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
})

/**
 * Get MIME type for file format
 */
function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    odt: "application/vnd.oasis.opendocument.text",
    ods: "application/vnd.oasis.opendocument.spreadsheet",
    odp: "application/vnd.oasis.opendocument.presentation",
    rtf: "application/rtf",
    csv: "text/csv",
    webp: "image/webp",
  }

  return mimeTypes[format.toLowerCase()] || "application/octet-stream"
} 