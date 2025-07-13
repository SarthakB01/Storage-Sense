"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Upload, X, CheckCircle, AlertCircle, File } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface UploadFile {
  id: string
  file: File
  progress: number
  status: "uploading" | "completed" | "error"
  error?: string
}

export function FileUpload() {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const { toast } = useToast()
  const { token } = useAuth()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      handleFiles(selectedFiles)
    }
  }, [])

  const handleFiles = (fileList: File[]) => {
    const newFiles: UploadFile[] = fileList.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: "uploading",
    }))

    setFiles((prev) => [...prev, ...newFiles])

    // Upload each file
    newFiles.forEach((uploadFile) => {
      uploadFileToServer(uploadFile)
    })
  }

  const uploadFileToServer = async (uploadFile: UploadFile) => {
    try {
      const formData = new FormData()
      formData.append("file", uploadFile.file)
      formData.append("folder", "/") // Default folder

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest()

      // Track upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          setFiles((prev) => prev.map((file) => (file.id === uploadFile.id ? { ...file, progress } : file)))
        }
      })

      // Handle completion
      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          setFiles((prev) =>
            prev.map((file) => (file.id === uploadFile.id ? { ...file, progress: 100, status: "completed" } : file)),
          )
          toast({
            title: "Upload completed",
            description: `${uploadFile.file.name} has been uploaded successfully.`,
          })
        } else {
          const errorResponse = JSON.parse(xhr.responseText)
          setFiles((prev) =>
            prev.map((file) =>
              file.id === uploadFile.id
                ? {
                    ...file,
                    status: "error",
                    error: errorResponse.error || "Upload failed",
                  }
                : file,
            ),
          )
          toast({
            title: "Upload failed",
            description: errorResponse.error || "Failed to upload file",
            variant: "destructive",
          })
        }
      })

      // Handle errors
      xhr.addEventListener("error", () => {
        setFiles((prev) =>
          prev.map((file) => (file.id === uploadFile.id ? { ...file, status: "error", error: "Network error" } : file)),
        )
        toast({
          title: "Upload failed",
          description: "Network error occurred during upload",
          variant: "destructive",
        })
      })

      // Start upload
      xhr.open("POST", "/api/files")
      xhr.setRequestHeader("Authorization", `Bearer ${token}`)
      xhr.send(formData)
    } catch (error) {
      setFiles((prev) =>
        prev.map((file) =>
          file.id === uploadFile.id
            ? {
                ...file,
                status: "error",
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : file,
        ),
      )
    }
  }

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const clearCompleted = () => {
    setFiles((prev) => prev.filter((file) => file.status === "uploading"))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
            Upload Files
          </h1>
          <p className="text-muted-foreground mt-1">Drag and drop files or click to browse</p>
        </div>
        {files.some((f) => f.status === "completed") && (
          <Button onClick={clearCompleted} variant="outline">
            Clear Completed
          </Button>
        )}
      </div>

      <Card className="border-2 border-dashed transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <CardContent className="p-8">
          <div
            className={`relative rounded-xl border-2 border-dashed transition-all duration-300 p-12 text-center ${
              isDragOver
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                : "border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            <div className="space-y-4">
              <div
                className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isDragOver ? "bg-blue-100 dark:bg-blue-900/30" : "bg-slate-100 dark:bg-slate-800"
                }`}
              >
                <Upload
                  className={`w-8 h-8 transition-colors duration-300 ${
                    isDragOver ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
                  }`}
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  {isDragOver ? "Drop files here" : "Upload your files"}
                </h3>
                <p className="text-muted-foreground mb-4">Drag and drop files here, or click to browse</p>
                <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                  Choose Files
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                Supported formats: PDF, DOC, DOCX, JPG, PNG, MP4, ZIP and more (Max 100MB per file)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File className="w-5 h-5" />
              Upload Progress ({files.length} file{files.length !== 1 ? "s" : ""})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {files.map((uploadFile) => (
              <div
                key={uploadFile.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate max-w-xs">{uploadFile.file.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          uploadFile.status === "completed"
                            ? "default"
                            : uploadFile.status === "error"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {uploadFile.status === "completed" && <CheckCircle className="w-3 h-3 mr-1" />}
                        {uploadFile.status === "error" && <AlertCircle className="w-3 h-3 mr-1" />}
                        {uploadFile.status === "uploading" && <Upload className="w-3 h-3 mr-1" />}
                        {uploadFile.status.charAt(0).toUpperCase() + uploadFile.status.slice(1)}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => removeFile(uploadFile.id)} className="h-6 w-6">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(uploadFile.file.size)}</span>
                    {uploadFile.status === "uploading" && <span>• {uploadFile.progress}%</span>}
                    {uploadFile.error && <span className="text-red-500">• {uploadFile.error}</span>}
                  </div>

                  {uploadFile.status === "uploading" && <Progress value={uploadFile.progress} className="h-2" />}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
