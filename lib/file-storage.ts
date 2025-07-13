import fs from "fs/promises"
import path from "path"

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads"

/**
 * Ensure upload directory exists
 */
export async function ensureUploadDir(): Promise<void> {
  try {
    await fs.access(UPLOAD_DIR)
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
  }
}

/**
 * Generate unique filename to prevent conflicts
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2)
  const ext = path.extname(originalName)
  const name = path.basename(originalName, ext)
  return `${name}_${timestamp}_${random}${ext}`
}

/**
 * Save uploaded file to disk
 */
export async function saveFile(file: File, filename: string): Promise<string> {
  await ensureUploadDir()
  const filePath = path.join(UPLOAD_DIR, filename)

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  await fs.writeFile(filePath, buffer)
  return filePath
}

/**
 * Delete file from disk
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath)
  } catch (error) {
    console.error("Error deleting file:", error)
  }
}

/**
 * Get file stats
 */
export async function getFileStats(filePath: string) {
  try {
    return await fs.stat(filePath)
  } catch {
    return null
  }
}

/**
 * Calculate directory size for storage quota
 */
export async function calculateDirectorySize(dirPath: string): Promise<number> {
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true })
    let totalSize = 0

    for (const file of files) {
      const filePath = path.join(dirPath, file.name)
      if (file.isDirectory()) {
        totalSize += await calculateDirectorySize(filePath)
      } else {
        const stats = await fs.stat(filePath)
        totalSize += stats.size
      }
    }

    return totalSize
  } catch {
    return 0
  }
}
