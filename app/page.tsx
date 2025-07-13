"use client"

import { useState } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/header"
import { FileStorage } from "@/components/file-storage"
import { FileUpload } from "@/components/file-upload"
import { DocumentConverter } from "@/components/document-converter"
import { UserProfile } from "@/components/user-profile"
import { SettingsPage } from "@/components/settings-page"
import { HelpSupportPage } from "@/components/help-support-page"
import { AuthPage } from "@/components/auth/auth-page"
import { AuthProvider, useAuth } from "@/contexts/auth-context"

function AppContent() {
  const [activeSection, setActiveSection] = useState("files")
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  const renderContent = () => {
    switch (activeSection) {
      case "files":
        return <FileStorage />
      case "upload":
        return <FileUpload />
      case "convert":
        return <DocumentConverter />
      case "profile":
        return <UserProfile user={user} />
      case "settings":
        return <SettingsPage />
      case "help":
        return <HelpSupportPage />
      default:
        return <FileStorage />
    }
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <div className="flex-1 flex flex-col">
          <Header user={user} />
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">{renderContent()}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

export default function HomePage() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
