"use client"
import { useState, useEffect } from "react"
import { Download, RefreshCw, CheckCircle, AlertCircle, Upload, Cloud, HardDrive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useApi } from "@/hooks/use-api"
import { useAuth } from "@/contexts/auth-context"

interface ConversionJob {
  id: string
  sourceFileName: string
  sourceFormat: string
  targetFormat: string
  progress: number
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
  error?: string
  createdAt: string
  resultFileName?: string
  resultFilePath?: string
}

interface FileItem {
  id: string
  originalName: string
  mimeType: string
  size: number
}

export function DocumentConverter() {
  const [jobs, setJobs] = useState<ConversionJob[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [selectedFile, setSelectedFile] = useState<string>("")
  const [targetFormat, setTargetFormat] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("convert")
  const [pollingJobs, setPollingJobs] = useState<Set<string>>(new Set())
  const { toast } = useToast()
  const { apiCall } = useApi()
  const { token } = useAuth()

  useEffect(() => {
    loadFiles()
    loadJobs()
  }, [])

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      pollingJobs.forEach((jobId) => {
        // Clear any existing intervals
        const intervals = (window as any).conversionIntervals || {}
        if (intervals[jobId]) {
          clearInterval(intervals[jobId])
          delete intervals[jobId]
        }
      })
    }
  }, [pollingJobs])

  const loadFiles = async () => {
    try {
      const response = await apiCall("/api/files")
      // Filter files that can be converted
      const convertibleFiles = response.files.filter(
        (file: FileItem) =>
          file.mimeType.includes("pdf") ||
          file.mimeType.includes("document") ||
          file.mimeType.includes("word") ||
          file.mimeType.includes("text") ||
          file.mimeType.includes("image") ||
          file.mimeType.includes("spreadsheet") ||
          file.mimeType.includes("presentation") ||
          file.mimeType.includes("oasis"),
      )
      setFiles(convertibleFiles)
    } catch (error) {
      console.error("Failed to load files:", error)
      toast({
        title: "Error",
        description: "Failed to load files. Please refresh the page.",
        variant: "destructive",
      })
    }
  }

  const loadJobs = async () => {
    // For now, we'll manage jobs in local state
    // In a real app, you'd have an endpoint to get user's conversion jobs
  }

  const startConversion = async () => {
    if (!selectedFile || !targetFormat) {
      toast({
        title: "Missing information",
        description: "Please select a file and target format",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      console.log("Starting conversion:", { fileId: selectedFile, targetFormat })

      const response = await apiCall("/api/convert", {
        method: "POST",
        body: JSON.stringify({
          fileId: selectedFile,
          targetFormat,
        }),
      })

      console.log("Conversion API response:", response)

      if (!response.jobId) {
        throw new Error("Job ID missing from response")
      }

      const selectedFileObj = files.find((f) => f.id === selectedFile)
      const newJob: ConversionJob = {
        id: response.jobId,
        sourceFileName: selectedFileObj?.originalName || "Unknown",
        sourceFormat: getFileExtension(selectedFileObj?.originalName || "").toUpperCase(),
        targetFormat: targetFormat.toUpperCase(),
        progress: response.progress || 0,
        status: "PROCESSING",
        createdAt: new Date().toISOString(),
      }

      setJobs((prev) => [newJob, ...prev])
      setActiveTab("history")

      // Start polling for job status
      startPollingJobStatus(response.jobId)

      toast({
        title: "Conversion started",
        description: "Your document is being converted with CloudConvert. You'll be notified when it's ready.",
      })

      // Reset form
      setSelectedFile("")
      setTargetFormat("")
    } catch (error) {
      console.error("Conversion start error:", error)
      toast({
        title: "Conversion failed",
        description: error instanceof Error ? error.message : "Failed to start conversion",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const startPollingJobStatus = (jobId: string) => {
    // Prevent multiple polling for the same job
    if (pollingJobs.has(jobId)) {
      return
    }

    setPollingJobs((prev) => new Set([...prev, jobId]))

    // Store interval reference globally to ensure cleanup
    if (!(window as any).conversionIntervals) {
      ;(window as any).conversionIntervals = {}
    }

    const pollInterval = setInterval(async () => {
      try {
        console.log("Polling job status for:", jobId)
        const response = await fetch(`/api/convert/${jobId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        console.log("Job status response:", data)

        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId
              ? {
                  ...job,
                  status: data.status,
                  progress: data.progress || 0,
                  error: data.error,
                  resultFileName: data.resultFileName,
                  resultFilePath: data.resultFilePath,
                }
              : job,
          ),
        )

        if (data.status === "COMPLETED" || data.status === "FAILED") {
          clearInterval((window as any).conversionIntervals[jobId])
          delete (window as any).conversionIntervals[jobId]
          setPollingJobs((prev) => {
            const newSet = new Set(prev)
            newSet.delete(jobId)
            return newSet
          })

          if (data.status === "COMPLETED") {
            toast({
              title: "Conversion completed",
              description: "Your document has been converted successfully!",
            })
          } else {
            toast({
              title: "Conversion failed",
              description: data.error || "The conversion process failed",
              variant: "destructive",
            })
          }
        }
      } catch (error) {
        console.error("Failed to poll job status:", error)
        clearInterval((window as any).conversionIntervals[jobId])
        delete (window as any).conversionIntervals[jobId]
        setPollingJobs((prev) => {
          const newSet = new Set(prev)
          newSet.delete(jobId)
          return newSet
        })
      }
    }, 3000)

    // Poll every 3 seconds
    ;(window as any).conversionIntervals[jobId] = pollInterval
  }

  const downloadConvertedFile = async (jobId: string) => {
    try {
      const response = await fetch(`/api/convert/${jobId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Download failed")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url

      const job = jobs.find((j) => j.id === jobId)
      a.download = job?.resultFileName || `converted-file.${job?.targetFormat.toLowerCase()}`

      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Download started",
        description: "Your converted file is being downloaded.",
      })
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download failed",
        description: "Failed to download converted file",
        variant: "destructive",
      })
    }
  }

  const saveToCloud = async (jobId: string) => {
    try {
      const response = await apiCall(`/api/convert/${jobId}/save-to-cloud`, {
        method: "POST",
      })

      if (response.success) {
        toast({
          title: "File saved to cloud",
          description: `${response.fileName} has been saved to your cloud storage.`,
        })
      } else {
        throw new Error(response.error || "Failed to save to cloud")
      }
    } catch (error) {
      console.error("Save to cloud error:", error)
      toast({
        title: "Save to cloud failed",
        description: error instanceof Error ? error.message : "Failed to save file to cloud",
        variant: "destructive",
      })
    }
  }

  const getFileExtension = (filename: string) => {
    return filename.split(".").pop() || ""
  }

  const getAvailableFormats = (mimeType: string) => {
    if (mimeType.includes("pdf")) {
      return [
        { value: "docx", label: "Word Document (DOCX)" },
        { value: "doc", label: "Word Document (DOC)" },
        { value: "xlsx", label: "Excel Spreadsheet (XLSX)" },
        { value: "pptx", label: "PowerPoint (PPTX)" },
        { value: "txt", label: "Text File (TXT)" },
        { value: "odt", label: "OpenDocument Text (ODT)" },
        { value: "rtf", label: "Rich Text Format (RTF)" },
        { value: "jpg", label: "JPEG Image" },
        { value: "png", label: "PNG Image" },
      ]
    }
    if (mimeType.includes("word") || mimeType.includes("document")) {
      return [
        { value: "pdf", label: "PDF Document" },
        { value: "doc", label: "Word Document (DOC)" },
        { value: "odt", label: "OpenDocument Text (ODT)" },
        { value: "txt", label: "Text File (TXT)" },
        { value: "rtf", label: "Rich Text Format (RTF)" },
      ]
    }
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
      return [
        { value: "pdf", label: "PDF Document" },
        { value: "ods", label: "OpenDocument Spreadsheet (ODS)" },
        { value: "csv", label: "CSV File" },
      ]
    }
    if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) {
      return [
        { value: "pdf", label: "PDF Document" },
        { value: "odp", label: "OpenDocument Presentation (ODP)" },
      ]
    }
    if (mimeType.includes("text")) {
      return [
        { value: "pdf", label: "PDF Document" },
        { value: "docx", label: "Word Document (DOCX)" },
        { value: "doc", label: "Word Document (DOC)" },
        { value: "odt", label: "OpenDocument Text (ODT)" },
        { value: "rtf", label: "Rich Text Format (RTF)" },
      ]
    }
    if (mimeType.includes("image")) {
      return [
        { value: "pdf", label: "PDF Document" },
        { value: "jpg", label: "JPEG Image" },
        { value: "png", label: "PNG Image" },
        { value: "webp", label: "WebP Image" },
      ]
    }
    if (mimeType.includes("oasis")) {
      return [
        { value: "pdf", label: "PDF Document" },
        { value: "docx", label: "Word Document (DOCX)" },
        { value: "doc", label: "Word Document (DOC)" },
        { value: "txt", label: "Text File (TXT)" },
        { value: "rtf", label: "Rich Text Format (RTF)" },
      ]
    }
    return []
  }

  const selectedFileObj = files.find((f) => f.id === selectedFile)
  const availableFormats = selectedFileObj ? getAvailableFormats(selectedFileObj.mimeType) : []

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
          Document Converter
        </h1>
        <p className="text-muted-foreground mt-1">
          Convert your documents between different formats using CloudConvert
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="convert">Convert Document</TabsTrigger>
          <TabsTrigger value="history">
            Conversion History
            {jobs.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {jobs.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="convert">
          <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600">
                  <RefreshCw className="w-5 h-5 text-white" />
                </div>
                Convert Document
              </CardTitle>
              <p className="text-muted-foreground">Select a file and choose the target format for conversion</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select File to Convert</label>
                  <Select value={selectedFile} onValueChange={setSelectedFile}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a file from your storage" />
                    </SelectTrigger>
                    <SelectContent>
                      {files.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No convertible files found
                        </SelectItem>
                      ) : (
                        files.map((file) => (
                          <SelectItem key={file.id} value={file.id}>
                            <div className="flex items-center justify-between w-full">
                              <span className="truncate max-w-xs">{file.originalName}</span>
                              <span className="text-xs text-muted-foreground ml-2">{formatFileSize(file.size)}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Convert To</label>
                  <Select value={targetFormat} onValueChange={setTargetFormat} disabled={!selectedFile}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target format" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFormats.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={startConversion}
                disabled={!selectedFile || !targetFormat || loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Starting Conversion...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Start Conversion
                  </>
                )}
              </Button>

              {files.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No convertible files found.</p>
                  <p className="text-sm">Upload some documents first to start converting.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Conversion History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No conversion jobs yet.</p>
                  <p className="text-sm">Start converting documents to see them here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm truncate max-w-xs">{job.sourceFileName}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {job.sourceFormat} → {job.targetFormat}
                            </Badge>
                            <Badge
                              variant={
                                job.status === "COMPLETED"
                                  ? "default"
                                  : job.status === "FAILED"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {job.status === "COMPLETED" && <CheckCircle className="w-3 h-3 mr-1" />}
                              {job.status === "FAILED" && <AlertCircle className="w-3 h-3 mr-1" />}
                              {job.status === "PROCESSING" && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                              {job.status}
                            </Badge>
                          </div>
                        </div>

                        {job.status === "PROCESSING" && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Converting with CloudConvert...</span>
                              <span>{job.progress}%</span>
                            </div>
                            <Progress value={job.progress} className="h-2" />
                          </div>
                        )}

                        {job.status === "COMPLETED" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => downloadConvertedFile(job.id)}
                              variant="outline"
                              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/20"
                            >
                              <HardDrive className="w-3 h-3 mr-1" />
                              Save to Device
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => saveToCloud(job.id)}
                              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                            >
                              <Cloud className="w-3 h-3 mr-1" />
                              Save to Cloud
                            </Button>
                          </div>
                        )}

                        {job.error && <p className="text-xs text-red-500">{job.error}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
