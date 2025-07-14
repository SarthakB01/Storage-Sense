"use client"

import { useState, useEffect } from "react"
import {
  User,
  Shield,
  Bell,
  HardDrive,
  TrendingUp,
  FileText,
  ImageIcon,
  Video,
  Music,
  Archive,
  Camera,
  Eye,
  EyeOff,
} from "lucide-react"
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
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface UserProfileProps {
  user: {
    name: string
    email: string
    avatar: string
  }
}

interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt: string
}

interface UserSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  uploadNotifications: boolean
  conversionNotifications: boolean
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

export function UserProfile({ user: initialUser }: UserProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [settings, setSettings] = useState<UserSettings>({
    emailNotifications: true,
    pushNotifications: false,
    uploadNotifications: true,
    conversionNotifications: true,
  })
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [avatarUploading, setAvatarUploading] = useState(false)

  // Form states
  const [name, setName] = useState("")
  const [avatar, setAvatar] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)

  const { apiCall } = useApi()
  const { toast } = useToast()
  const { user: authUser, setUser } = useAuth()

  useEffect(() => {
    loadProfile()
    loadSettings()
    loadStorageInfo()
  }, [])

  const loadProfile = async () => {
    try {
      setProfileLoading(true)
      console.log("Loading user profile...")
      const response = await apiCall("/api/user/profile")
      console.log("Profile loaded:", response)

      setProfile(response.user)
      setName(response.user.name)
      setAvatar(response.user.avatar || "")
    } catch (error) {
      console.error("Failed to load profile:", error)
      toast({
        title: "Error",
        description: "Failed to load user profile. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setProfileLoading(false)
    }
  }

  const loadSettings = async () => {
    try {
      console.log("Loading user settings...")
      const response = await apiCall("/api/user/settings")
      console.log("Settings loaded:", response)
      setSettings(response.settings)
    } catch (error) {
      console.error("Failed to load settings:", error)
      toast({
        title: "Error",
        description: "Failed to load settings. Using defaults.",
        variant: "destructive",
      })
    }
  }

  const loadStorageInfo = async () => {
    try {
      const response = await apiCall("/api/user/storage")
      setStorageInfo(response)
    } catch (error) {
      console.error("Failed to load storage info:", error)
    }
  }

  const saveProfile = async () => {
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      console.log("Saving profile:", { name, avatar })
      const response = await apiCall("/api/user/profile", {
        method: "PUT",
        body: JSON.stringify({ name: name.trim(), avatar: avatar.trim() || null }),
      })

      console.log("Profile saved:", response)
      setProfile(response.user)

      // Update auth context with new user data
      if (setUser) {
        setUser({
          ...authUser!,
          name: response.user.name,
          avatar: response.user.avatar || "",
        })
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      console.error("Failed to save profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Validation Error",
        description: "All password fields are required",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Validation Error",
        description: "New passwords don't match",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        title: "Validation Error",
        description: "New password must be at least 8 characters",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      console.log("Changing password...")
      await apiCall("/api/user/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      })

      // Clear password fields
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      console.error("Failed to change password:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change password",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setLoading(true)
    try {
      console.log("Saving settings:", settings)
      const response = await apiCall("/api/user/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      })

      console.log("Settings saved:", response)
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      })
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (key: keyof UserSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
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

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "/avatars")
      const res = await fetch("/api/files", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${authUser?.token || ""}`,
        },
      })
      const data = await res.json()
      if (data.file?.path) {
        setAvatar(data.file.path)
        // Update user profile with new avatar URL
        await apiCall("/api/user/profile", {
          method: "PUT",
          body: JSON.stringify({ avatar: data.file.path }),
        })
        toast({
          title: "Profile picture updated",
          description: "Your profile picture has been updated.",
        })
      } else {
        toast({
          title: "Upload failed",
          description: data.error || "Failed to upload avatar.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload avatar.",
        variant: "destructive",
      })
    } finally {
      setAvatarUploading(false)
    }
  }

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    )
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
                <div className="relative flex flex-col items-center">
                  <Avatar className="w-32 h-32">
                    <AvatarImage src={avatar || profile?.avatar || "/placeholder.svg"} alt={name || profile?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-3xl">
                      {(name || profile?.name || "U")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    id="avatar-upload-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                    disabled={avatarUploading}
                  />
                  {avatarUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-black/40 rounded-full">
                      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <button
                    type="button"
                    className="mt-2 px-2 py-1 text-xs bg-emerald-500 hover:bg-emerald-600 text-white rounded font-normal"
                    onClick={() => document.getElementById('avatar-upload-input')?.click()}
                    disabled={avatarUploading}
                  >
                    Change Photo
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="space-y-2">
                    <Label htmlFor="avatar">Profile Picture URL</Label>
                    <Input
                      id="avatar"
                      placeholder="https://example.com/avatar.jpg"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Enter a URL for your profile picture</p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={profile?.email || ""} disabled />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
              </div>

              <Button
                onClick={saveProfile}
                disabled={loading}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                {loading ? "Saving..." : "Save Changes"}
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
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => updateSetting("pushNotifications", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Upload Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get notified when uploads complete</p>
                </div>
                <Switch
                  checked={settings.uploadNotifications}
                  onCheckedChange={(checked) => updateSetting("uploadNotifications", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Conversion Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get notified when conversions finish</p>
                </div>
                <Switch
                  checked={settings.conversionNotifications}
                  onCheckedChange={(checked) => updateSetting("conversionNotifications", checked)}
                />
              </div>

              <Button
                onClick={saveSettings}
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                {loading ? "Saving..." : "Save Settings"}
              </Button>
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
        </div>
      </div>
    </div>
  )
}
