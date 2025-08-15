import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import { keepPreviousData } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import {
  CACHE_TIMES,
  INFINITE_QUERY_CONFIG,
  createPageSpecificOptions,
  getRefetchInterval,
} from "@/lib/caching-policies"
import {
  fetchRuleSettings,
  fetchWestgardConfig,
  fetchQCLimits,
  fetchQCPoints,
  fetchQCPointsInfinite,
  fetchReports,
  fetchDashboardStats,
  fetchViolations,
} from "@/lib/query-functions"

export const useRuleSettings = () => {
  return useQuery({
    queryKey: queryKeys.ruleSettings,
    queryFn: fetchRuleSettings,
    staleTime: CACHE_TIMES.RULE_SETTINGS,
    ...createPageSpecificOptions("CONFIG"),
  })
}

export const useWestgardConfig = () => {
  return useQuery({
    queryKey: queryKeys.westgardConfig,
    queryFn: fetchWestgardConfig,
    staleTime: CACHE_TIMES.WESTGARD_CONFIG,
    ...createPageSpecificOptions("CONFIG"),
  })
}

export const useQCLimits = (filters: Parameters<typeof queryKeys.qcLimits>[0]) => {
  return useQuery({
    queryKey: queryKeys.qcLimits(filters),
    queryFn: () => fetchQCLimits(filters),
    staleTime: CACHE_TIMES.QC_LIMITS,
    ...createPageSpecificOptions("CONFIG"),
    enabled: !!(filters.analyte && filters.level),
  })
}

export const useQCPoints = (
  filters: Parameters<typeof queryKeys.qcPoints>[0],
  options?: {
    pageType?: "monitor" | "history"
    isActive?: boolean
  },
) => {
  const pageType = options?.pageType || "history"
  const isActive = options?.isActive ?? true

  return useQuery({
    queryKey: queryKeys.qcPoints(filters),
    queryFn: () => fetchQCPoints(filters),
    staleTime: pageType === "monitor" ? CACHE_TIMES.QC_POINTS_MONITOR : CACHE_TIMES.QC_POINTS_HISTORY,
    refetchInterval: getRefetchInterval(pageType, isActive),
    refetchOnWindowFocus: false, // Always false per specification
    placeholderData: keepPreviousData, // Use v5 helper to prevent flicker
    enabled: !!(filters.analyte && filters.level),
  })
}

export const useQCPointsInfinite = (filters: Parameters<typeof queryKeys.qcPointsInfinite>[0]) => {
  return useInfiniteQuery({
    queryKey: queryKeys.qcPointsInfinite(filters),
    queryFn: ({ pageParam }) => fetchQCPointsInfinite({ ...filters, pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length : undefined
    },
    ...INFINITE_QUERY_CONFIG,
    ...createPageSpecificOptions("HISTORY"),
    enabled: !!(filters.analyte && filters.level),
  })
}

export const useReports = (scope: string) => {
  return useQuery({
    queryKey: queryKeys.reports(scope),
    queryFn: () => fetchReports(scope),
    staleTime: CACHE_TIMES.REPORTS,
    ...createPageSpecificOptions("DEFAULT"),
    enabled: !!scope,
  })
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: fetchDashboardStats,
    staleTime: CACHE_TIMES.DASHBOARD_STATS,
    ...createPageSpecificOptions("DEFAULT"),
  })
}

export const useViolations = (filters?: Record<string, any>) => {
  return useQuery({
    queryKey: queryKeys.violations(filters),
    queryFn: () => fetchViolations(filters),
    staleTime: CACHE_TIMES.VIOLATIONS,
    ...createPageSpecificOptions("DEFAULT"),
  })
}
