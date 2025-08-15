"use client"

import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "./query-keys"
import { fetchQCLimits, fetchQCPoints } from "./query-functions"
import { CACHE_TIMES } from "./caching-policies"

export const usePrefetchQCData = () => {
  const queryClient = useQueryClient()

  const prefetchQCLimits = (filters: Parameters<typeof queryKeys.qcLimits>[0]) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.qcLimits(filters),
      queryFn: () => fetchQCLimits(filters),
      staleTime: CACHE_TIMES.QC_LIMITS,
    })
  }

  const prefetchQCPoints = (filters: Parameters<typeof queryKeys.qcPoints>[0]) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.qcPoints(filters),
      queryFn: () => fetchQCPoints(filters),
      staleTime: CACHE_TIMES.QC_POINTS_HISTORY,
    })
  }

  return {
    prefetchQCLimits,
    prefetchQCPoints,
  }
}
