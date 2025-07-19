import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { withAuth } from "@/lib/auth"
import { convertDocumentWithCloudConvert } from "@/lib/document-converter"
import path from "path"
import fs from "fs/promises"
import { put } from "@vercel/blob"
import fetch from "node-fetch"
import os from "os"

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

    // Download from Blob if needed
    const localSourcePath = await getLocalFilePath(sourceFile.path, sourceFile.originalName)
    try {
      await fs.access(localSourcePath)
      console.log("Source file exists locally:", localSourcePath)
    } catch {
      console.log("Source file not found locally:", localSourcePath)
      return NextResponse.json({ error: "Source file not found locally" }, { status: 404 })
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
    processConversionWithCloudConvert(conversionJob.id, localSourcePath, targetFormat, sourceFile.originalName).catch(
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
    const resultBlobUrl = await convertDocumentWithCloudConvert(sourcePath, targetFormat, originalFileName)

    console.log("CloudConvert conversion completed, result blob URL:", resultBlobUrl)

    // Update progress to 75%
    await db.conversionJob.update({
      where: { id: jobId },
      data: { progress: 75 },
    })

    // Generate result filename
    const fileExtension = targetFormat.toLowerCase()
    const baseName = path.basename(originalFileName, path.extname(originalFileName))
    const resultFileName = `${baseName}_converted.${fileExtension}`

    // Update job with result (store Blob URL)
    await db.conversionJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        progress: 100,
        resultFilePath: resultBlobUrl,
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

// Helper to get local file path from Blob URL or local path
async function getLocalFilePath(filePathOrUrl: string, originalName: string): Promise<string> {
  if (filePathOrUrl.startsWith("https://")) {
    const res = await fetch(filePathOrUrl)
    if (!res.ok) throw new Error("Failed to download file from Blob")
    const buffer = Buffer.from(await res.arrayBuffer())
    const tempPath = path.join(os.tmpdir(), originalName)
    await fs.writeFile(tempPath, buffer)
    return tempPath
  } else {
    return filePathOrUrl
  }
}
