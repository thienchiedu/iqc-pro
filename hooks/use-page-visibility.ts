"use client"

import { useEffect, useState } from "react"

export const usePageVisibility = () => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden)
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  return isVisible
}

export const usePageContext = () => {
  const [pageType, setPageType] = useState<"monitor" | "history" | "config" | "default">("default")

  useEffect(() => {
    const path = window.location.pathname
    if (path.includes("/qc-monitor")) {
      setPageType("monitor")
    } else if (path.includes("/violations") || path.includes("/history")) {
      setPageType("history")
    } else if (path.includes("/configuration") || path.includes("/westgard-rules")) {
      setPageType("config")
    } else {
      setPageType("default")
    }
  }, [])

  return pageType
}
