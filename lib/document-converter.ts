import fs from "fs/promises"
import path from "path"
import FormData from "form-data"
import fetch from "node-fetch"
import { put } from "@vercel/blob"

/**
 * Convert document using CloudConvert API
 */
export async function convertDocumentWithCloudConvert(
  inputPath: string,
  outputFormat: string,
  originalFileName: string,
): Promise<string> {
  try {
    console.log("Starting CloudConvert conversion:", { inputPath, outputFormat, originalFileName })

    const apiKey = process.env.CLOUDCONVERT_API_KEY
    if (!apiKey) {
      throw new Error("CloudConvert API key not configured")
    }

    // Step 1: Create a job
    const jobResponse = await fetch("https://api.cloudconvert.com/v2/jobs", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tasks: {
          "import-file": {
            operation: "import/upload",
          },
          "convert-file": {
            operation: "convert",
            input: "import-file",
            output_format: outputFormat.toLowerCase(),
            some_other_task: "import-file",
          },
          "export-file": {
            operation: "export/url",
            input: "convert-file",
          },
        },
      }),
    })

    if (!jobResponse.ok) {
      const errorText = await jobResponse.text()
      throw new Error(`Failed to create CloudConvert job: ${errorText}`)
    }

    const jobData = await jobResponse.json() as Record<string, any>
    console.log("Created CloudConvert job:", jobData.data.id)

    // Step 2: Upload the file
    const uploadTask = jobData.data.tasks.find((task: any) => task.name === "import-file")
    const uploadUrl = uploadTask.result.form.url
    const uploadFormData = uploadTask.result.form.parameters

    // Read the input file
    const fileBuffer = await fs.readFile(inputPath)

    // Create form data for upload
    const formData = new FormData()

    // Add CloudConvert form parameters first
    Object.keys(uploadFormData).forEach((key) => {
      formData.append(key, uploadFormData[key])
    })

    // Add the file last
    formData.append("file", fileBuffer, {
      filename: originalFileName,
      contentType: getContentType(path.extname(originalFileName)),
    })

    console.log("Uploading file to CloudConvert...")
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      throw new Error(`Failed to upload file to CloudConvert: ${errorText}`)
    }

    console.log("File uploaded successfully")

    // Step 3: Wait for conversion to complete
    let jobCompleted = false
    let attempts = 0
    const maxAttempts = 60 // 5 minutes max (5 second intervals)
    let downloadUrl = ""
    let outputFileName = ""

    while (!jobCompleted && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000)) // Wait 5 seconds
      attempts++

      const statusResponse = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobData.data.id}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (!statusResponse.ok) {
        throw new Error("Failed to check job status")
      }

      const statusData = await statusResponse.json() as Record<string, any>
      console.log(`Job status check ${attempts}:`, statusData.data.status)

      if (statusData.data.status === "finished") {
        jobCompleted = true

        // Step 4: Download the converted file
        const exportTask = statusData.data.tasks.find((task: any) => task.name === "export-file")

        if (!exportTask || !exportTask.result || !exportTask.result.files || exportTask.result.files.length === 0) {
          throw new Error("No output file found in conversion result")
        }

        downloadUrl = exportTask.result.files[0].url
        outputFileName = exportTask.result.files[0].filename || `${path.basename(originalFileName, path.extname(originalFileName))}_converted_${Date.now()}.${outputFormat.toLowerCase()}`
        console.log("Downloading converted file from:", downloadUrl)
      } else if (statusData.data.status === "error") {
        const errorTask = statusData.data.tasks.find((task: any) => task.status === "error")
        const errorMessage = errorTask ? errorTask.message : "Unknown conversion error"
        throw new Error(`CloudConvert conversion failed: ${errorMessage}`)
      }
    }

    if (!jobCompleted) {
      throw new Error("CloudConvert conversion timed out")
    }

    // Download the converted file to buffer
    const downloadResponse = await fetch(downloadUrl)
    if (!downloadResponse.ok) {
      throw new Error("Failed to download converted file")
    }
    const convertedBuffer = Buffer.from(await downloadResponse.arrayBuffer())

    // Upload to Vercel Blob
    const blob = await put(outputFileName, new Blob([convertedBuffer]), { access: "public" })
    console.log("CloudConvert conversion completed successfully, Blob URL:", blob.url)
    return blob.url
  } catch (error) {
    console.error("CloudConvert conversion error:", error)
    throw new Error(`CloudConvert conversion failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Get correct PDFRest API endpoint based on actual API documentation
 */
function getPDFRestEndpoint(inputExtension: string, outputFormat: string): string | null {
  const input = inputExtension.toLowerCase().replace(".", "")
  const output = outputFormat.toLowerCase()

  // Based on PDFRest API documentation
  if (input === "pdf") {
    switch (output) {
      case "docx":
        return "pdf-to-word" // or "pdf-to-docx"
      case "xlsx":
        return "pdf-to-excel" // or "pdf-to-xlsx"
      case "pptx":
        return "pdf-to-powerpoint" // or "pdf-to-pptx"
      case "txt":
        return "pdf-to-text"
      case "jpg":
      case "png":
        return "pdf-to-image"
      default:
        return null
    }
  }

  if (output === "pdf") {
    switch (input) {
      case "docx":
        return "word-to-pdf" // or "docx-to-pdf"
      case "xlsx":
        return "excel-to-pdf" // or "xlsx-to-pdf"
      case "pptx":
        return "powerpoint-to-pdf" // or "pptx-to-pdf"
      case "txt":
        return "text-to-pdf"
      case "jpg":
      case "jpeg":
      case "png":
        return "image-to-pdf"
      default:
        return null
    }
  }

  return null
}

/**
 * Get content type for file extension
 */
function getContentType(extension: string): string {
  const contentTypes: Record<string, string> = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".doc": "application/msword",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".txt": "text/plain",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".odt": "application/vnd.oasis.opendocument.text",
    ".ods": "application/vnd.oasis.opendocument.spreadsheet",
    ".odp": "application/vnd.oasis.opendocument.presentation",
  }

  return contentTypes[extension.toLowerCase()] || "application/octet-stream"
}

/**
 * Get supported conversion formats for CloudConvert
 */
export const SUPPORTED_CONVERSIONS = {
  "application/pdf": ["docx", "doc", "xlsx", "pptx", "txt", "jpg", "png", "odt", "rtf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["pdf", "doc", "odt", "txt", "rtf"],
  "application/msword": ["pdf", "docx", "odt", "txt", "rtf"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["pdf", "ods", "csv"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ["pdf", "odp"],
  "text/plain": ["pdf", "docx", "doc", "odt", "rtf"],
  "image/jpeg": ["pdf", "png", "webp"],
  "image/png": ["pdf", "jpg", "webp"],
  "application/vnd.oasis.opendocument.text": ["pdf", "docx", "doc", "txt", "rtf"],
  "application/vnd.oasis.opendocument.spreadsheet": ["pdf", "xlsx", "csv"],
  "application/vnd.oasis.opendocument.presentation": ["pdf", "pptx"],
}

/**
 * Check if conversion is supported
 */
export function isConversionSupported(fromMimeType: string, toFormat: string): boolean {
  const supportedFormats = SUPPORTED_CONVERSIONS[fromMimeType as keyof typeof SUPPORTED_CONVERSIONS]
  return supportedFormats?.includes(toFormat) || false
}

// Main export function (updated to use CloudConvert)
export async function convertDocument(
  inputPath: string,
  outputFormat: string,
  originalFileName: string,
): Promise<string> {
  return convertDocumentWithCloudConvert(inputPath, outputFormat, originalFileName)
}

// Legacy function for backward compatibility
export const convertDocumentWithPDFRestLegacy = convertDocumentWithCloudConvert
