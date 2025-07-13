import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import fs from "fs/promises"

const execAsync = promisify(exec)

/**
 * Convert document between formats using LibreOffice
 */
export async function convertDocument(inputPath: string, outputFormat: string, outputDir: string): Promise<string> {
  try {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true })

    // LibreOffice command for conversion
    const command = `libreoffice --headless --convert-to ${outputFormat} --outdir "${outputDir}" "${inputPath}"`

    await execAsync(command)

    // Generate expected output filename
    const inputName = path.basename(inputPath, path.extname(inputPath))
    const outputPath = path.join(outputDir, `${inputName}.${outputFormat}`)

    // Verify the file was created
    try {
      await fs.access(outputPath)
      return outputPath
    } catch {
      throw new Error("Conversion failed - output file not created")
    }
  } catch (error) {
    console.error("Document conversion error:", error)
    throw new Error(`Conversion failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Get supported conversion formats
 */
export const SUPPORTED_CONVERSIONS = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["pdf"],
  "application/msword": ["pdf"],
  "application/pdf": ["docx", "odt"],
  "text/plain": ["pdf", "docx"],
  "application/vnd.oasis.opendocument.text": ["pdf", "docx"],
}

/**
 * Check if conversion is supported
 */
export function isConversionSupported(fromMimeType: string, toFormat: string): boolean {
  const supportedFormats = SUPPORTED_CONVERSIONS[fromMimeType as keyof typeof SUPPORTED_CONVERSIONS]
  return supportedFormats?.includes(toFormat) || false
}
