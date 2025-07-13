"use client"

import { Files, Upload, RefreshCw, User, Settings, HelpCircle } from "lucide-react"
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

export function AppSidebar({ activeSection, onSectionChange }: AppSidebarProps) {
  return (
    <Sidebar className="border-r border-slate-200/60 dark:border-slate-800/60">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Files className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              FileVault
            </h1>
            <p className="text-xs text-muted-foreground">Storage & Conversion</p>
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
                    className="w-full justify-start gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 data-[active=true]:bg-gradient-to-r data-[active=true]:from-blue-500 data-[active=true]:to-indigo-600 data-[active=true]:text-white data-[active=true]:shadow-lg"
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
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-lg p-4 border border-blue-100 dark:border-slate-600">
          <div className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">Storage Used</div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">2.4 GB of 10 GB</div>
          <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full w-1/4"></div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
