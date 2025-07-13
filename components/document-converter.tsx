"use client"
import { useState, useEffect } from "react"
import { FileText, Download, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
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
}

interface FileItem {
  id: string
  originalName: string
  mimeType: string
}

export function DocumentConverter() {
  const [jobs, setJobs] = useState<ConversionJob[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [selectedFile, setSelectedFile] = useState<string>("")
  const [targetFormat, setTargetFormat] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("convert")
  const { toast } = useToast()
  const { apiCall } = useApi()
  const { token } = useAuth()

  useEffect(() => {
    loadFiles()
    loadJobs()
  }, [])

  const loadFiles = async () => {
    try {
      const response = await apiCall("/api/files")
      // Filter files that can be converted
      const convertibleFiles = response.files.filter(
        (file: FileItem) =>
          file.mimeType.includes("pdf") ||
          file.mimeType.includes("document") ||
          file.mimeType.includes("word") ||
          file.mimeType.includes("text"),
      )
      setFiles(convertibleFiles)
    } catch (error) {
      console.error("Failed to load files:", error)
    }
  }

  const loadJobs = async () => {
    // In a real app, you'd have an endpoint to get user's conversion jobs
    // For now, we'll just show jobs from the current session
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
      const response = await apiCall("/api/convert", {
        method: "POST",
        body: JSON.stringify({
          fileId: selectedFile,
          targetFormat,
        }),
      })

      if (!response.jobId) {
        toast({
          title: "Conversion failed",
          description: "Failed to start conversion (missing job id)",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const newJob: ConversionJob = {
        id: response.jobId,
        sourceFileName: files.find((f) => f.id === selectedFile)?.originalName || "Unknown",
        sourceFormat: "PDF", // You'd determine this from the file
        targetFormat: targetFormat.toUpperCase(),
        progress: 0,
        status: "PROCESSING",
        createdAt: new Date().toISOString(),
      }

      setJobs((prev) => [newJob, ...prev])
      setActiveTab("history")

      // Poll for job status only if jobId is valid
      pollJobStatus(response.jobId)

      toast({
        title: "Conversion started",
        description: "Your document is being converted. You'll be notified when it's ready.",
      })

      // Reset form
      setSelectedFile("")
      setTargetFormat("")
    } catch (error) {
      toast({
        title: "Conversion failed",
        description: error instanceof Error ? error.message : "Failed to start conversion",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const pollJobStatus = async (jobId: string) => {
    if (!jobId) {
      toast({
        title: "Polling error",
        description: "Missing job id for polling.",
        variant: "destructive",
      })
      return
    }
    const pollInterval = setInterval(async () => {
      try {
        const response = await apiCall(`/api/convert/${jobId}`)

        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId
              ? {
                  ...job,
                  status: response.status,
                  progress: response.progress,
                  error: response.error,
                }
              : job,
          ),
        )

        if (response.status === "COMPLETED" || response.status === "FAILED") {
          clearInterval(pollInterval)

          if (response.status === "COMPLETED") {
            toast({
              title: "Conversion completed",
              description: "Your document has been converted successfully!",
            })
          } else {
            toast({
              title: "Conversion failed",
              description: response.error || "The conversion process failed",
              variant: "destructive",
            })
          }
        }
      } catch (error: any) {
        // If error is 400 or 404, stop polling and show error
        if (error?.status === 400 || error?.status === 404) {
          clearInterval(pollInterval)
          toast({
            title: "Polling error",
            description: "Conversion job not found or invalid job id.",
            variant: "destructive",
          })
        } else {
          console.error("Failed to poll job status:", error)
          clearInterval(pollInterval)
        }
      }
    }, 2000) // Poll every 2 seconds
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
      a.download = job?.sourceFileName.replace(/\.[^/.]+$/, `.${job.targetFormat.toLowerCase()}`) || "converted-file"

      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Download started",
        description: "Your converted file is being downloaded.",
      })
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download converted file",
        variant: "destructive",
      })
    }
  }

  const getAvailableFormats = (mimeType: string) => {
    if (mimeType.includes("pdf")) {
      return [
        { value: "docx", label: "Word Document (DOCX)" },
        { value: "odt", label: "OpenDocument Text (ODT)" },
      ]
    }
    if (mimeType.includes("word") || mimeType.includes("document")) {
      return [{ value: "pdf", label: "PDF Document" }]
    }
    if (mimeType.includes("text")) {
      return [
        { value: "pdf", label: "PDF Document" },
        { value: "docx", label: "Word Document (DOCX)" },
      ]
    }
    return []
  }

  const selectedFileObj = files.find((f) => f.id === selectedFile)
  const availableFormats = selectedFileObj ? getAvailableFormats(selectedFileObj.mimeType) : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
          Document Converter
        </h1>
        <p className="text-muted-foreground mt-1">Convert your documents between different formats</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="convert">Convert Document</TabsTrigger>
          <TabsTrigger value="history">Conversion History</TabsTrigger>
        </TabsList>

        <TabsContent value="convert">
          <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600">
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
                            {file.originalName}
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
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
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
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No convertible files found.</p>
                  <p className="text-sm">Upload some PDF or Word documents first.</p>
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
                      className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50"
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
                              <span>Converting...</span>
                              <span>{job.progress}%</span>
                            </div>
                            <Progress value={job.progress} className="h-2" />
                          </div>
                        )}

                        {job.status === "COMPLETED" && (
                          <Button
                            size="sm"
                            onClick={() => downloadConvertedFile(job.id)}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
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
