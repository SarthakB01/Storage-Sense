import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { withAuth } from "@/lib/auth"
import { convertDocument, isConversionSupported } from "@/lib/document-converter"
import path from "path"

/**
 * POST /api/convert - Convert document
 */
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const { fileId, targetFormat } = await request.json()

    if (!fileId || !targetFormat) {
      return NextResponse.json({ error: "File ID and target format are required" }, { status: 400 })
    }

    // Find the source file
    const sourceFile = await db.file.findFirst({
      where: {
        id: fileId,
        userId: user.userId,
      },
    })

    if (!sourceFile) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Check if conversion is supported
    if (!isConversionSupported(sourceFile.mimeType, targetFormat)) {
      return NextResponse.json({ error: "Conversion not supported" }, { status: 400 })
    }

    // Create conversion job
    const conversionJob = await db.conversionJob.create({
      data: {
        userId: user.userId,
        sourceFileId: sourceFile.id,
        sourceFileName: sourceFile.originalName,
        sourceFormat: path.extname(sourceFile.originalName).substring(1),
        targetFormat,
        status: "PROCESSING",
      },
    })

    // Start conversion process (in background)
    processConversion(conversionJob.id, sourceFile.path, targetFormat).catch((error) => {
      console.error("Conversion process error:", error)
      // Update job status to failed
      db.conversionJob
        .update({
          where: { id: conversionJob.id },
          data: {
            status: "FAILED",
            error: error.message,
            progress: 0,
          },
        })
        .catch(console.error)
    })

    return NextResponse.json({
      jobId: conversionJob.id,
      status: "PROCESSING",
    })
  } catch (error) {
    console.error("Error starting conversion:", error)
    return NextResponse.json({ error: "Failed to start conversion" }, { status: 500 })
  }
})

/**
 * Background conversion process
 */
async function processConversion(jobId: string, sourcePath: string, targetFormat: string) {
  try {
    // Update progress
    await db.conversionJob.update({
      where: { id: jobId },
      data: { progress: 25 },
    })

    // Perform conversion
    const outputDir = path.join(process.env.UPLOAD_DIR || "./uploads", "conversions")
    const resultPath = await convertDocument(sourcePath, targetFormat, outputDir)

    // Update progress
    await db.conversionJob.update({
      where: { id: jobId },
      data: { progress: 75 },
    })

    // Generate result filename
    const resultFileName = `converted_${Date.now()}.${targetFormat}`

    // Update job with result
    await db.conversionJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        progress: 100,
        resultFilePath: resultPath,
        resultFileName,
      },
    })
  } catch (error) {
    console.error("Conversion error:", error)
    await db.conversionJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
        progress: 0,
      },
    })
  }
}
