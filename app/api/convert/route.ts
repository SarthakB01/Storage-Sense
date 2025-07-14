import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { withAuth } from "@/lib/auth"
import { convertDocumentWithCloudConvert } from "@/lib/document-converter"
import path from "path"
import fs from "fs/promises"
import { put } from "@vercel/blob"

/**
 * POST /api/convert - Convert document using CloudConvert
 */
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    console.log("Convert API received body:", body)

    const { fileId, targetFormat } = body

    if (!fileId || !targetFormat) {
      console.log("Missing required fields:", { fileId, targetFormat })
      return NextResponse.json({ error: "File ID and target format are required" }, { status: 400 })
    }

    // Check if CloudConvert API key is configured
    if (!process.env.CLOUDCONVERT_API_KEY) {
      console.log("CloudConvert API key not configured")
      return NextResponse.json(
        {
          error: "CloudConvert API key not configured. Please add CLOUDCONVERT_API_KEY to your environment variables.",
        },
        { status: 500 },
      )
    }

    // Find the source file
    const sourceFile = await db.file.findFirst({
      where: {
        id: fileId,
        userId: user.userId,
      },
    })

    if (!sourceFile) {
      console.log("Source file not found:", fileId)
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    console.log("Found source file:", sourceFile.originalName)

    // Check if source file exists on disk
    try {
      await fs.access(sourceFile.path)
      console.log("Source file exists on disk:", sourceFile.path)
    } catch {
      console.log("Source file not found on disk:", sourceFile.path)
      return NextResponse.json({ error: "Source file not found on disk" }, { status: 404 })
    }

    // Create conversion job in database
    const conversionJob = await db.conversionJob.create({
      data: {
        userId: user.userId,
        sourceFileId: sourceFile.id,
        sourceFileName: sourceFile.originalName,
        sourceFormat: path.extname(sourceFile.originalName).substring(1).toUpperCase(),
        targetFormat: targetFormat.toUpperCase(),
        status: "PROCESSING",
        progress: 10,
      },
    })

    console.log("Created conversion job:", conversionJob.id)

    // Start conversion process (in background)
    processConversionWithCloudConvert(conversionJob.id, sourceFile.path, targetFormat, sourceFile.originalName).catch(
      (error) => {
        console.error("Background conversion process error:", error)
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
      },
    )

    // Return the job ID immediately
    const response = {
      jobId: conversionJob.id,
      status: "PROCESSING",
      message: "Conversion started successfully with CloudConvert",
      progress: 10,
    }

    console.log("Returning response:", response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error starting conversion:", error)
    return NextResponse.json(
      {
        error: "Failed to start conversion",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
})

/**
 * Background conversion process using CloudConvert
 */
async function processConversionWithCloudConvert(
  jobId: string,
  sourcePath: string,
  targetFormat: string,
  originalFileName: string,
) {
  try {
    console.log("Starting CloudConvert background conversion for job:", jobId)

    // Update progress to 25%
    await db.conversionJob.update({
      where: { id: jobId },
      data: { progress: 25 },
    })

    // Perform conversion using CloudConvert
    const resultPath = await convertDocumentWithCloudConvert(sourcePath, targetFormat, originalFileName)

    console.log("CloudConvert conversion completed, result path:", resultPath)

    // Update progress to 75%
    await db.conversionJob.update({
      where: { id: jobId },
      data: { progress: 75 },
    })

    // Generate result filename
    const fileExtension = targetFormat.toLowerCase()
    const baseName = path.basename(originalFileName, path.extname(originalFileName))
    const resultFileName = `${baseName}_converted.${fileExtension}`

    // Read the converted file from disk
    const fs = await import("fs/promises")
    const fileBuffer = await fs.readFile(resultPath)

    // Upload to Vercel Blob
    const blob = await put(resultFileName, new Blob([fileBuffer]), { access: "public" })

    // Update job with result (store Blob URL)
    await db.conversionJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        progress: 100,
        resultFilePath: blob.url,
        resultFileName,
      },
    })

    console.log("CloudConvert conversion job completed successfully:", jobId)
  } catch (error) {
    console.error("CloudConvert conversion process error:", error)
    await db.conversionJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown conversion error",
        progress: 0,
      },
    })
  }
}
