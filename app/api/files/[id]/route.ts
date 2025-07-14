import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { withAuth } from "@/lib/auth"
import { deleteFile } from "@/lib/file-storage"
import fs from "fs"

/**
 * GET /api/files/[id] - Download file
 */
export const GET = withAuth(async (request: NextRequest, user) => {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();
  if (!id) {
    console.log("[API] Download: Missing file id");
    return NextResponse.json({ error: "Missing file id" }, { status: 400 });
  }
  try {
    const file = await db.file.findFirst({
      where: {
        id,
        userId: user.userId,
      },
    })

    console.log("[API] Download: DB file lookup result:", file);

    if (!file) {
      console.log("[API] Download: File not found in DB for id", id, "and user", user.userId);
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // If file.path is a Blob URL, redirect to it
    if (file.path && file.path.startsWith("https://")) {
      return NextResponse.redirect(file.path, 302);
    }

    // Legacy: If you still have local files, handle them here (optional)
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 })
  } catch (error) {
    console.error("Error downloading file:", error)
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 })
  }
})

/**
 * DELETE /api/files/[id] - Delete file
 */
export const DELETE = withAuth(async (request: NextRequest, user) => {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();
  if (!id) {
    return NextResponse.json({ error: "Missing file id" }, { status: 400 });
  }
  try {
    const file = await db.file.findFirst({
      where: {
        id,
        userId: user.userId,
      },
    })

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // TODO: Optionally delete from Vercel Blob if needed
    // Remove local file delete logic
    // await deleteFile(file.path)

    // Delete file record from database
    await db.file.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
  }
})
