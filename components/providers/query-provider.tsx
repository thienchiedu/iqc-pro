"use client"

import type React from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState, useEffect } from "react"
import { queryClient, getCacheStats } from "@/lib/query-client"

interface QueryProviderProps {
  children: React.ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Use the singleton queryClient instance
  const [client] = useState(() => queryClient)

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const logCacheStats = () => {
        const stats = getCacheStats()
        console.log("[TanStack Query] Cache Stats:", stats)
      }

      // Log cache stats every 30 seconds in development
      const interval = setInterval(logCacheStats, 30000)

      // Log initial stats
      logCacheStats()

      return () => clearInterval(interval)
    }
  }, [])

  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
          toggleButtonProps={{
            style: {
              marginLeft: "5px",
              transform: "scale(0.8)",
              transformOrigin: "bottom right",
            },
          }}
          panelProps={{
            style: {
              fontSize: "12px",
            },
          }}
        />
      )}
    </QueryClientProvider>
  )
}
