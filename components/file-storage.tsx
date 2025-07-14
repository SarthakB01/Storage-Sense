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
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Calendar,
  HardDrive,
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
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const { apiCall } = useApi()
  const { toast } = useToast()

  useEffect(() => {
    loadFiles()
  }, [])

  useEffect(() => {
    // Filter files based on search query
    if (searchQuery.trim() === "") {
      setFilteredFiles(files)
    } else {
      const filtered = files.filter((file) => file.originalName.toLowerCase().includes(searchQuery.toLowerCase()))
      setFilteredFiles(filtered)
    }
  }, [files, searchQuery])

  useEffect(() => {
    // Cleanup preview URL when dialog closes
    if (!previewOpen && previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      setZoom(100)
      setRotation(0)
    }
  }, [previewOpen, previewUrl])

  const loadFiles = async () => {
    try {
      setLoading(true)
      const response = await apiCall("/api/files")
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

  const handlePreview = async (file: FileItem) => {
    setSelectedFile(file)
    setPreviewOpen(true)

    // Load file for preview
    try {
      const response = await fetch(`/api/files/${file.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
      }
    } catch (error) {
      console.error("Failed to load file for preview:", error)
    }
  }

  const handleDownload = async (file: FileItem) => {
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
    if (mimeType.startsWith("image/")) return { color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20" }
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

  const canPreview = (mimeType: string) => {
    return (
      mimeType.startsWith("image/") ||
      mimeType.startsWith("video/") ||
      mimeType.startsWith("audio/") ||
      mimeType.includes("pdf") ||
      mimeType.startsWith("text/")
    )
  }

  const renderPreview = () => {
    if (!selectedFile || !previewUrl) {
      return (
        <div className="flex items-center justify-center h-96 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="text-center">
            <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading preview...</p>
          </div>
        </div>
      )
    }

    const { mimeType } = selectedFile

    if (mimeType.startsWith("image/")) {
      return (
        <div className="relative bg-slate-50 dark:bg-slate-800 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.max(25, zoom - 25))}
                disabled={zoom <= 25}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium">{zoom}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.min(200, zoom + 25))}
                disabled={zoom >= 200}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setRotation((rotation + 90) % 360)}>
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center justify-center p-8 min-h-96">
            <img
              src={previewUrl || "/placeholder.svg"}
              alt={selectedFile.originalName}
              className="max-w-full max-h-96 object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              }}
            />
          </div>
        </div>
      )
    }

    if (mimeType.startsWith("video/")) {
      return (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
          <video src={previewUrl} controls className="w-full max-h-96 rounded" preload="metadata">
            Your browser does not support video playback.
          </video>
        </div>
      )
    }

    if (mimeType.startsWith("audio/")) {
      return (
        <div className="flex items-center justify-center h-96 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="text-center space-y-4">
            <Music className="w-16 h-16 text-slate-400 mx-auto" />
            <audio src={previewUrl} controls className="mx-auto">
              Your browser does not support audio playback.
            </audio>
            <p className="text-slate-600 dark:text-slate-400">{selectedFile.originalName}</p>
          </div>
        </div>
      )
    }

    if (mimeType.includes("pdf")) {
      return (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
          <iframe src={previewUrl} className="w-full h-96 rounded border" title={selectedFile.originalName} />
        </div>
      )
    }

    if (mimeType.startsWith("text/")) {
      return (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
          <iframe src={previewUrl} className="w-full h-96 rounded border bg-white" title={selectedFile.originalName} />
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center h-96 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <div className="text-center">
          <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Preview not available for this file type</p>
          <p className="text-sm text-muted-foreground mt-1">Click download to view the file</p>
        </div>
      </div>
    )
  }

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredFiles.map((file) => {
        const FileIcon = getFileIcon(file.mimeType)
        const { color, bg } = getFileColor(file.mimeType)
        const previewable = canPreview(file.mimeType)

        return (
          <Card
            key={file.id}
            className="group hover:shadow-lg transition-all duration-300 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm"
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
                    {previewable && (
                      <DropdownMenuItem onClick={() => handlePreview(file)} className="cursor-pointer">
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                    )}
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
                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
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
                {previewable && (
                  <Button size="sm" variant="outline" onClick={() => handlePreview(file)} className="flex-1">
                    <Eye className="w-3 h-3 mr-1" />
                    Preview
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => handleDownload(file)}
                  className={`${previewable ? "flex-1" : "w-full"} bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700`}
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
  )

  const renderListView = () => (
    <div className="space-y-2">
      {filteredFiles.map((file) => {
        const FileIcon = getFileIcon(file.mimeType)
        const { color } = getFileColor(file.mimeType)
        const previewable = canPreview(file.mimeType)

        return (
          <Card
            key={file.id}
            className="group hover:shadow-md transition-all duration-200 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <FileIcon className={`w-8 h-8 ${color} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {file.originalName}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        {formatFileSize(file.size)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(file.createdAt)}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {getFileType(file.mimeType)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {previewable && (
                    <Button size="sm" variant="outline" onClick={() => handlePreview(file)}>
                      <Eye className="w-3 h-3 mr-1" />
                      Preview
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => handleDownload(file)}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {previewable && (
                        <DropdownMenuItem onClick={() => handlePreview(file)} className="cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                      )}
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
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-500" />
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
            {filteredFiles.length === 0 && searchQuery
              ? `No files found for "${searchQuery}"`
              : filteredFiles.length === 0
                ? "No files uploaded yet"
                : `${filteredFiles.length} file${filteredFiles.length !== 1 ? "s" : ""} ${searchQuery ? `found for "${searchQuery}"` : "stored"}`}
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

      {filteredFiles.length === 0 && !searchQuery ? (
        <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-16 h-16 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No files yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Upload your first file to get started with Storage Sense
            </p>
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
              Upload Files
            </Button>
          </CardContent>
        </Card>
      ) : filteredFiles.length === 0 && searchQuery ? (
        <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-16 h-16 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No files found</h3>
            <p className="text-muted-foreground text-center mb-4">No files match your search for "{searchQuery}"</p>
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Clear Search
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        renderGridView()
      ) : (
        renderListView()
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {selectedFile && (
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getFileColor(selectedFile.mimeType).bg}`}>
                    {(() => {
                      const FileIcon = getFileIcon(selectedFile.mimeType)
                      return <FileIcon className={`w-5 h-5 ${getFileColor(selectedFile.mimeType).color}`} />
                    })()}
                  </div>
                  <div>
                    <span className="font-semibold">{selectedFile.originalName}</span>
                    <p className="text-sm text-muted-foreground font-normal">
                      {formatFileSize(selectedFile.size)} • {getFileType(selectedFile.mimeType)}
                    </p>
                  </div>
                </div>
              )}
              <Button variant="ghost" size="icon" onClick={() => setPreviewOpen(false)} className="h-6 w-6">
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[calc(90vh-8rem)]">{renderPreview()}</div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            {selectedFile && (
              <Button
                onClick={() => handleDownload(selectedFile)}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
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
