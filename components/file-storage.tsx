"use client"

import { useState, useEffect } from "react"
import {
  FileText,
  ImageIcon,
  Video,
  Music,
  Archive,
  Download,
  Eye,
  Trash2,
  MoreHorizontal,
  Grid,
  List,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { useApi } from "@/hooks/use-api"
import { useToast } from "@/hooks/use-toast"

interface FileItem {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  folder: string
  createdAt: string
  updatedAt: string
}

export function FileStorage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { apiCall } = useApi()
  const { toast } = useToast()

  useEffect(() => {
    loadFiles()
  }, [searchQuery])

  const loadFiles = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append("search", searchQuery)

      const response = await apiCall(`/api/files?${params.toString()}`)
      setFiles(response.files || [])
    } catch (error) {
      console.error("Failed to load files:", error)
      toast({
        title: "Error",
        description: "Failed to load files. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = (file: FileItem) => {
    setSelectedFile(file)
    setPreviewOpen(true)
  }

  const handleDownload = async (file: FileItem) => {
    console.log("Attempting to download file:", file);
    if (!file.id) {
      toast({
        title: "Download failed",
        description: "Invalid file. Please try again.",
        variant: "destructive",
      })
      return
    }
    try {
      const response = await fetch(`/api/files/${file.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Download failed")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = file.originalName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Download started",
        description: `${file.originalName} is being downloaded.`,
      })
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download file. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (file: FileItem) => {
    if (!confirm(`Are you sure you want to delete "${file.originalName}"?`)) {
      return
    }

    try {
      await apiCall(`/api/files/${file.id}`, { method: "DELETE" })
      setFiles(files.filter((f) => f.id !== file.id))
      toast({
        title: "File deleted",
        description: `${file.originalName} has been deleted.`,
      })
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return ImageIcon
    if (mimeType.startsWith("video/")) return Video
    if (mimeType.startsWith("audio/")) return Music
    if (mimeType.includes("zip") || mimeType.includes("archive")) return Archive
    return FileText
  }

  const getFileColor = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return { color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/20" }
    if (mimeType.startsWith("video/")) return { color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/20" }
    if (mimeType.startsWith("audio/")) return { color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20" }
    if (mimeType.includes("pdf")) return { color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/20" }
    if (mimeType.includes("zip") || mimeType.includes("archive"))
      return { color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950/20" }
    return { color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-950/20" }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "Today"
    if (diffDays === 2) return "Yesterday"
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    return date.toLocaleDateString()
  }

  const getFileType = (mimeType: string) => {
    if (mimeType.includes("pdf")) return "PDF"
    if (mimeType.includes("word") || mimeType.includes("document")) return "DOC"
    if (mimeType.startsWith("image/")) return "IMG"
    if (mimeType.startsWith("video/")) return "VID"
    if (mimeType.startsWith("audio/")) return "AUD"
    if (mimeType.includes("zip")) return "ZIP"
    return "FILE"
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-muted-foreground">Loading your files...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
            My Files
          </h1>
          <p className="text-muted-foreground mt-1">
            {files.length === 0
              ? "No files uploaded yet"
              : `${files.length} file${files.length !== 1 ? "s" : ""} stored`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
          </div>
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "grid" | "list")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="grid" className="flex items-center gap-2">
                <Grid className="w-4 h-4" />
                Grid
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="w-4 h-4" />
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={loadFiles} variant="outline" size="icon">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {files.length === 0 ? (
        <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-16 h-16 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No files yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Upload your first file to get started with FileVault
            </p>
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
              Upload Files
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {files.map((file) => {
            const FileIcon = getFileIcon(file.mimeType)
            const { color, bg } = getFileColor(file.mimeType)

            return (
              <Card
                key={file.id}
                className="group hover:shadow-lg transition-all duration-300 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-3 rounded-xl ${bg} transition-transform group-hover:scale-110`}>
                      <FileIcon className={`w-6 h-6 ${color}`} />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handlePreview(file)} className="cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(file)} className="cursor-pointer">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(file)} className="cursor-pointer text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {file.originalName}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <Badge variant="secondary" className="text-xs">
                        {getFileType(file.mimeType)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(file.createdAt)}</p>
                  </div>

                  <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="outline" onClick={() => handlePreview(file)} className="flex-1">
                      <Eye className="w-3 h-3 mr-1" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDownload(file)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedFile && (
                <>
                  <div className={`p-2 rounded-lg ${getFileColor(selectedFile.mimeType).bg}`}>
                    {(() => {
                      const FileIcon = getFileIcon(selectedFile.mimeType)
                      return <FileIcon className={`w-5 h-5 ${getFileColor(selectedFile.mimeType).color}`} />
                    })()}
                  </div>
                  {selectedFile.originalName}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-96 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="text-center">
              <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">File preview not available</p>
              <p className="text-sm text-muted-foreground mt-1">Click download to view the file</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            {selectedFile && (
              <Button
                onClick={() => handleDownload(selectedFile)}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
