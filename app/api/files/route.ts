import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { withAuth } from "@/lib/auth"
import { put } from "@vercel/blob"

/**
 * GET /api/files - List user's files
 */
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const folder = searchParams.get("folder") || "/"
    const search = searchParams.get("search")

    const whereClause: any = {
      userId: user.userId,
      folder,
    }

    if (search) {
      whereClause.originalName = {
        contains: search,
        mode: "insensitive",
      }
    }

    const files = await db.file.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        size: true,
        folder: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ files })
  } catch (error) {
    console.error("Error fetching files:", error)
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 })
  }
})

/**
 * POST /api/files - Upload new file
 */
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const folder = (formData.get("folder") as string) || "/"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Check file size (100MB limit)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size is 100MB" }, { status: 400 })
    }

    // Check user's storage quota
    const userFiles = await db.file.findMany({
      where: { userId: user.userId },
      select: { size: true },
    })

    const totalUsed = userFiles.reduce((sum, f) => sum + f.size, 0)
    const userSettings = await db.userSettings.findUnique({
      where: { userId: user.userId },
    })

    const storageLimit = userSettings?.storageLimit || 10737418240 // 10GB default

    if (totalUsed + file.size > storageLimit) {
      return NextResponse.json({ error: "Storage quota exceeded" }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2)
    const ext = file.name.split('.').pop() ? `.${file.name.split('.').pop()}` : ''
    const name = file.name.replace(ext, '')
    const filename = `${name}_${timestamp}_${random}${ext}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, { access: "public" })

    // Save file metadata to database
    const savedFile = await db.file.create({
      data: {
        userId: user.userId,
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: blob.url, // Store blob URL
        folder,
      },
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        size: true,
        folder: true,
        createdAt: true,
        path: true,
      },
    })

    return NextResponse.json({ file: savedFile })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
})
