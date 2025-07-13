"use client"

import { useState, useEffect } from "react"
import { Files, Upload, RefreshCw, User, Settings, HelpCircle, HardDrive } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { useApi } from "@/hooks/use-api"

const mainItems = [
  {
    title: "My Files",
    icon: Files,
    id: "files",
  },
  {
    title: "Upload Files",
    icon: Upload,
    id: "upload",
  },
  {
    title: "Convert Documents",
    icon: RefreshCw,
    id: "convert",
  },
]

const accountItems = [
  {
    title: "Profile",
    icon: User,
    id: "profile",
  },
  {
    title: "Settings",
    icon: Settings,
    id: "settings",
  },
  {
    title: "Help & Support",
    icon: HelpCircle,
    id: "help",
  },
]

interface AppSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

interface StorageInfo {
  totalUsed: number
  storageLimit: number
  usagePercentage: number
  usageByType: {
    documents?: number
    images?: number
    videos?: number
    audio?: number
    other?: number
  }
}

export function AppSidebar({ activeSection, onSectionChange }: AppSidebarProps) {
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    totalUsed: 0,
    storageLimit: 10737418240, // 10GB default
    usagePercentage: 0,
    usageByType: {},
  })
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

  return (
    <Sidebar className="border-r border-slate-200/60 dark:border-slate-800/60">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
            <HardDrive className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Storage Sense
            </h1>
            <p className="text-xs text-muted-foreground">Smart Storage & Conversion</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            MAIN FEATURES
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.id)}
                    isActive={activeSection === item.id}
                    className="w-full justify-start gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 data-[active=true]:bg-gradient-to-r data-[active=true]:from-emerald-500 data-[active=true]:to-teal-600 data-[active=true]:text-white data-[active=true]:shadow-lg"
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="font-medium">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-4" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            ACCOUNT
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.id)}
                    isActive={activeSection === item.id}
                    className="w-full justify-start gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="font-medium">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-700 rounded-lg p-4 border border-emerald-100 dark:border-slate-600">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Storage Used</div>
            <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">
            {formatBytes(storageInfo.totalUsed)} of {formatBytes(storageInfo.storageLimit)}
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 mb-2">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(storageInfo.usagePercentage, 100)}%` }}
            ></div>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {storageInfo.usagePercentage.toFixed(1)}% used
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
