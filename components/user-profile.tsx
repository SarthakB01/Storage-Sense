"use client"

import { useState, useEffect } from "react"
import { User, Shield, Bell, HardDrive, TrendingUp, FileText, ImageIcon, Video, Music, Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useApi } from "@/hooks/use-api"

interface UserProfileProps {
  user: {
    name: string
    email: string
    avatar: string
  }
}

interface StorageInfo {
  totalUsed: number
  storageLimit: number
  usagePercentage: number
  breakdown: {
    documents: { size: number; count: number; percentage: number }
    images: { size: number; count: number; percentage: number }
    videos: { size: number; count: number; percentage: number }
    audio: { size: number; count: number; percentage: number }
    archives: { size: number; count: number; percentage: number }
    other: { size: number; count: number; percentage: number }
  }
  suggestions: string[]
  recentUsage: number
}

export function UserProfile({ user }: UserProfileProps) {
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    uploads: true,
    conversions: true,
  })
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)
  const { apiCall } = useApi()

  useEffect(() => {
    loadStorageInfo()
  }, [])

  const loadStorageInfo = async () => {
    try {
      const response = await apiCall("/api/user/storage")
      setStorageInfo(response)
    } catch (error) {
      console.error("Failed to load storage info:", error)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "documents":
        return FileText
      case "images":
        return ImageIcon
      case "videos":
        return Video
      case "audio":
        return Music
      case "archives":
        return Archive
      default:
        return HardDrive
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "documents":
        return "text-blue-500"
      case "images":
        return "text-emerald-500"
      case "videos":
        return "text-purple-500"
      case "audio":
        return "text-orange-500"
      case "archives":
        return "text-yellow-500"
      default:
        return "text-slate-500"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
          Profile Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your Storage Sense account and preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xl">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">
                    Change Avatar
                  </Button>
                  <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max size 2MB.</p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue={user.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue={user.email} />
                </div>
              </div>

              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, email: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, push: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Upload Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get notified when uploads complete</p>
                </div>
                <Switch
                  checked={notifications.uploads}
                  onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, uploads: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Conversion Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get notified when conversions finish</p>
                </div>
                <Switch
                  checked={notifications.conversions}
                  onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, conversions: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="w-5 h-5" />
                Storage Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {storageInfo ? (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Used</span>
                      <span>
                        {formatBytes(storageInfo.totalUsed)} of {formatBytes(storageInfo.storageLimit)}
                      </span>
                    </div>
                    <Progress value={storageInfo.usagePercentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">{storageInfo.usagePercentage}% used</p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Storage Breakdown</h4>
                    {Object.entries(storageInfo.breakdown).map(([category, data]) => {
                      if (data.size === 0) return null
                      const Icon = getCategoryIcon(category)
                      const colorClass = getCategoryColor(category)

                      return (
                        <div key={category} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-3 h-3 ${colorClass}`} />
                            <span className="capitalize">{category}</span>
                            <Badge variant="secondary" className="text-xs">
                              {data.count}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div>{formatBytes(data.size)}</div>
                            <div className="text-muted-foreground">{data.percentage}%</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-medium">Recent Activity</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(storageInfo.recentUsage)} added in the last 30 days
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <HardDrive className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading storage info...</p>
                </div>
              )}

              <Button variant="outline" className="w-full bg-transparent">
                Upgrade Storage
              </Button>
            </CardContent>
          </Card>

          {storageInfo && storageInfo.suggestions.length > 0 && (
            <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Storage Optimization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {storageInfo.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800"
                  >
                    <p className="text-sm text-emerald-800 dark:text-emerald-200">{suggestion}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Account Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full bg-transparent">
                Change Password
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                Two-Factor Authentication
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                Download Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
