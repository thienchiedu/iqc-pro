export {
  useIngestQCPoint,
  useUpdateWestgardConfig,
  useUpdateQCLimits,
  useUpdateRCA,
  useUpdateRuleSettings,
} from "@/lib/mutations"

// Re-export for convenience
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"

export const useInvalidateQueries = () => {
  const queryClient = useQueryClient()

  const invalidateQCData = (context: {
    analyte?: string
    level?: string
    instrument?: string
    lot?: string
  }) => {
    // Invalidate QC points
    queryClient.invalidateQueries({
      queryKey: queryKeys.qcPoints(context),
    })

    // Invalidate infinite queries
    queryClient.invalidateQueries({
      queryKey: queryKeys.qcPointsInfinite(context),
    })

    // Invalidate QC limits
    queryClient.invalidateQueries({
      queryKey: queryKeys.qcLimits(context),
    })
  }

  const invalidateConfig = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.westgardConfig,
    })

    queryClient.invalidateQueries({
      queryKey: queryKeys.ruleSettings,
    })
  }

  const invalidateAll = () => {
    queryClient.invalidateQueries()
  }

  return {
    invalidateQCData,
    invalidateConfig,
    invalidateAll,
  }
}
