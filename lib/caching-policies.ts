import { keepPreviousData } from "@tanstack/react-query"

export const CACHE_TIMES = {
  RULE_SETTINGS: 12 * 60 * 60 * 1000, // 12 hours
  WESTGARD_CONFIG: 6 * 60 * 60 * 1000, // 6 hours
  QC_LIMITS: 24 * 60 * 60 * 1000, // 24 hours
  QC_POINTS_MONITOR: 30 * 1000, // 30 seconds for monitor
  QC_POINTS_HISTORY: 5 * 60 * 1000, // 5 minutes for history
  DASHBOARD_STATS: 2 * 60 * 1000, // 2 minutes
  VIOLATIONS: 60 * 1000, // 1 minute
  REPORTS: 5 * 60 * 1000, // 5 minutes
} as const

export const REFETCH_POLICIES = {
  // Turn off refetchOnWindowFocus for Monitor & History
  MONITOR: {
    refetchOnWindowFocus: false,
    refetchInterval: 60 * 1000, // 60s only when on Monitor
  },
  HISTORY: {
    refetchOnWindowFocus: false,
    refetchInterval: false, // No auto-refetch for history
  },
  CONFIG: {
    refetchOnWindowFocus: false,
    refetchInterval: false, // Static configuration data
  },
  DEFAULT: {
    refetchOnWindowFocus: false,
    refetchInterval: false,
  },
} as const

export const INFINITE_QUERY_CONFIG = {
  maxPages: 5, // Keep 3-5 pages in memory
  staleTime: CACHE_TIMES.QC_POINTS_HISTORY,
  placeholderData: keepPreviousData, // Use v5 helper to prevent flicker
} as const

export const createPageSpecificOptions = (pageType: keyof typeof REFETCH_POLICIES) => {
  const basePolicy = REFETCH_POLICIES[pageType]

  return {
    ...basePolicy,
    placeholderData: keepPreviousData, // Always use placeholder data to prevent flicker
    retry: (failureCount: number, error: any) => {
      // Don't retry on 4xx errors
      if (error?.status >= 400 && error?.status < 500) return false
      return failureCount < 3
    },
  }
}

export const getRefetchInterval = (pageType: string, isActive: boolean) => {
  if (pageType === "monitor" && isActive) {
    return REFETCH_POLICIES.MONITOR.refetchInterval
  }
  return false // No auto-refetch for other pages or inactive tabs
}
