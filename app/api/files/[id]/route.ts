import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { withAuth } from "@/lib/auth"
import { deleteFile } from "@/lib/file-storage"
import fs from "fs"

/**
 * GET /api/files/[id] - Download file
 */
export const GET = withAuth(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  try {
    const file = await db.file.findFirst({
      where: {
        id: params.id,
        userId: user.userId,
      },
    })

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.path)) {
      return NextResponse.json({ error: "File not found on disk" }, { status: 404 })
    }

    // Read file and return as response
    const fileBuffer = fs.readFileSync(file.path)

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `attachment; filename="${file.originalName}"`,
        "Content-Length": file.size.toString(),
      },
    })
  } catch (error) {
    console.error("Error downloading file:", error)
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 })
  }
})

/**
 * DELETE /api/files/[id] - Delete file
 */
export const DELETE = withAuth(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  try {
    const file = await db.file.findFirst({
      where: {
        id: params.id,
        userId: user.userId,
      },
    })

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Delete file from disk
    await deleteFile(file.path)

    // Delete file record from database
    await db.file.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
  }
})
