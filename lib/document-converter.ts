import axios from "axios"
import path from "path"
import fs from "fs/promises"

const CLOUDCONVERT_API_KEY = process.env.CLOUDCONVERT_API_KEY
const CLOUDCONVERT_API_URL = "https://api.cloudconvert.com/v2/jobs"

/**
 * Convert document between formats using CloudConvert
 */
export async function convertDocument(inputPath: string, outputFormat: string, outputDir: string): Promise<string> {
  if (!CLOUDCONVERT_API_KEY) {
    throw new Error("CloudConvert API key not set in environment variables.")
  }

  // Read file buffer
  const fileBuffer = await fs.readFile(inputPath)
  const fileName = path.basename(inputPath)

  // 1. Create a CloudConvert job
  const jobRes = await axios.post(
    CLOUDCONVERT_API_URL,
    {
      tasks: {
        import_my_file: {
          operation: "import/upload"
        },
        convert_my_file: {
          operation: "convert",
          input: "import_my_file",
          output_format: outputFormat
        },
        export_my_file: {
          operation: "export/url",
          input: "convert_my_file"
        }
      }
    },
    {
      headers: {
        Authorization: `Bearer ${CLOUDCONVERT_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  )

  const jobId = jobRes.data.data.id
  const importTask = jobRes.data.data.tasks.find((t: any) => t.name === "import_my_file")

  // 2. Upload the file to CloudConvert
  const uploadUrl = importTask.result.form.url
  const uploadParams = importTask.result.form.parameters
  const formData = new FormData()
  for (const key in uploadParams) {
    formData.append(key, uploadParams[key])
  }
  formData.append("file", new Blob([fileBuffer]), fileName)

  await axios.post(uploadUrl, formData)

  // 3. Poll for job completion
  let exportTask, fileUrl
  for (let i = 0; i < 30; i++) {
    await new Promise((res) => setTimeout(res, 2000))
    const pollRes = await axios.get(`${CLOUDCONVERT_API_URL}/${jobId}`, {
      headers: { Authorization: `Bearer ${CLOUDCONVERT_API_KEY}` }
    })
    exportTask = pollRes.data.data.tasks.find((t: any) => t.name === "export_my_file")
    if (exportTask.status === "finished" && exportTask.result && exportTask.result.files && exportTask.result.files.length > 0) {
      fileUrl = exportTask.result.files[0].url
      break
    }
    if (exportTask.status === "error") {
      throw new Error("CloudConvert export task failed.")
    }
  }
  if (!fileUrl) throw new Error("CloudConvert conversion did not finish in time.")

  // 4. Download the converted file
  const outputName = `${path.basename(inputPath, path.extname(inputPath))}.${outputFormat}`
  const outputPath = path.join(outputDir, outputName)
  const fileRes = await axios.get(fileUrl, { responseType: "arraybuffer" })
  await fs.mkdir(outputDir, { recursive: true })
  await fs.writeFile(outputPath, Buffer.from(fileRes.data))
  return outputPath
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
