import { QueryClient, dehydrate } from "@tanstack/react-query"
import { queryKeys } from "./query-keys"
import {
  fetchWestgardConfig,
  fetchQCLimits,
  fetchQCPoints,
  fetchRuleSettings,
  fetchDashboardStats,
} from "./query-functions"
import { CACHE_TIMES } from "./caching-policies"

export const createServerQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute default for server
        gcTime: 24 * 60 * 60 * 1000, // 24 hours
      },
    },
  })
}

export const prefetchCriticalData = async (queryClient: QueryClient) => {
  // Always prefetch rule settings and westgard config
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: queryKeys.ruleSettings,
      queryFn: fetchRuleSettings,
      staleTime: CACHE_TIMES.RULE_SETTINGS,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.westgardConfig,
      queryFn: fetchWestgardConfig,
      staleTime: CACHE_TIMES.WESTGARD_CONFIG,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.dashboardStats,
      queryFn: fetchDashboardStats,
      staleTime: CACHE_TIMES.DASHBOARD_STATS,
    }),
  ])
}

export const prefetchQCData = async (
  queryClient: QueryClient,
  context: {
    analyte?: string
    level?: string
    instrument?: string
    lot?: string
  },
) => {
  if (!context.analyte || !context.level) return

  // Prefetch QC limits for current context
  await queryClient.prefetchQuery({
    queryKey: queryKeys.qcLimits(context),
    queryFn: () => fetchQCLimits(context),
    staleTime: CACHE_TIMES.QC_LIMITS,
  })

  // Prefetch first page of QC points for current context
  const qcPointsContext = {
    ...context,
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
    to: new Date().toISOString(),
  }

  await queryClient.prefetchQuery({
    queryKey: queryKeys.qcPoints(qcPointsContext),
    queryFn: () => fetchQCPoints(qcPointsContext),
    staleTime: CACHE_TIMES.QC_POINTS_HISTORY,
  })
}

export const getDehydratedState = async (context?: {
  analyte?: string
  level?: string
  instrument?: string
  lot?: string
}) => {
  const queryClient = createServerQueryClient()

  // Always prefetch critical data
  await prefetchCriticalData(queryClient)

  // Prefetch QC data if context is provided
  if (context) {
    await prefetchQCData(queryClient, context)
  }

  return dehydrate(queryClient)
}
