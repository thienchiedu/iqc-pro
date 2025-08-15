import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "./query-keys"

// QC Point ingestion mutation
export const useIngestQCPoint = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      analyte: string
      level: string
      instrument: string
      lot: string
      value: number
      timestamp: string
    }) => {
      const response = await fetch("/api/qc/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error("Failed to ingest QC point")
      return response.json()
    },
    onSuccess: (_, variables) => {
      const context = {
        analyte: variables.analyte,
        level: variables.level,
        instrument: variables.instrument,
        lot: variables.lot,
      }

      // Invalidate regular QC points queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.qcPoints(context),
      })

      // Invalidate infinite queries (first page)
      queryClient.invalidateQueries({
        queryKey: queryKeys.qcPointsInfinite(context),
      })

      // Also invalidate dashboard stats as they might be affected
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboardStats,
      })
    },
  })
}

// Westgard configuration update mutation
export const useUpdateWestgardConfig = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (config: Record<string, any>) => {
      const response = await fetch("/api/qc/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      if (!response.ok) throw new Error("Failed to update Westgard config")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.westgardConfig,
      })

      queryClient.invalidateQueries({
        queryKey: queryKeys.ruleSettings,
      })

      // Consider invalidating currently displayed QC points as rules may affect analysis
      queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey[0] === "qc_points"
        },
      })
    },
  })
}

// QC Limits update mutation
export const useUpdateQCLimits = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      analyte: string
      level: string
      instrument: string
      lot: string
      limits: Record<string, number>
    }) => {
      const response = await fetch("/api/qc/limits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error("Failed to update QC limits")
      return response.json()
    },
    onSuccess: (_, variables) => {
      const context = {
        analyte: variables.analyte,
        level: variables.level,
        instrument: variables.instrument,
        lot: variables.lot,
      }

      queryClient.invalidateQueries({
        queryKey: queryKeys.qcLimits(context),
      })

      // Invalidate related QC points as limits affect analysis
      queryClient.invalidateQueries({
        queryKey: queryKeys.qcPoints(context),
      })

      queryClient.invalidateQueries({
        queryKey: queryKeys.qcPointsInfinite(context),
      })
    },
  })
}

// Root Cause Analysis update mutation with optimistic updates
export const useUpdateRCA = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      pointId: string
      rootCause: string
      correctiveAction: string
      conclusion: string
    }) => {
      const response = await fetch(`/api/qc/points/${data.pointId}/rca`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          root_cause: data.rootCause,
          corrective_action: data.correctiveAction,
          conclusion: data.conclusion,
        }),
      })
      if (!response.ok) throw new Error("Failed to update RCA")
      return response.json()
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        predicate: (query) => query.queryKey[0] === "qc_points",
      })

      // Snapshot previous values
      const previousData = queryClient.getQueriesData({
        predicate: (query) => query.queryKey[0] === "qc_points",
      })

      // Optimistically update cache
      queryClient.setQueriesData(
        {
          predicate: (query) => query.queryKey[0] === "qc_points",
        },
        (oldData: any) => {
          if (!oldData?.data) return oldData

          return {
            ...oldData,
            data: oldData.data.map((point: any) =>
              point.id === variables.pointId
                ? {
                    ...point,
                    root_cause: variables.rootCause,
                    corrective_action: variables.correctiveAction,
                    conclusion: variables.conclusion,
                  }
                : point,
            ),
          }
        },
      )

      return { previousData }
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "qc_points",
      })
    },
  })
}

// Rule settings update mutation
export const useUpdateRuleSettings = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (settings: Record<string, any>) => {
      const response = await fetch("/api/config/system", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (!response.ok) throw new Error("Failed to update rule settings")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.ruleSettings,
      })

      queryClient.invalidateQueries({
        queryKey: queryKeys.westgardConfig,
      })

      // Invalidate QC points as rule changes affect analysis
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "qc_points",
      })
    },
  })
}
