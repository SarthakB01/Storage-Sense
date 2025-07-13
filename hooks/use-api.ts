"use client"

import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export function useApi() {
  const { token } = useAuth()
  const { toast } = useToast()

  const apiCall = async (url: string, options: RequestInit = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "API call failed")
      }

      return await response.json()
    } catch (error) {
      console.error("API call error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
      throw error
    }
  }

  return { apiCall }
}
