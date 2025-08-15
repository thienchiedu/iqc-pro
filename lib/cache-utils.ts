import { queryClient } from "./query-client"

export const cacheUtils = {
  // Get all cached queries
  getAllQueries: () => {
    return queryClient.getQueryCache().getAll()
  },

  // Get queries by key pattern
  getQueriesByPattern: (pattern: string) => {
    return queryClient
      .getQueryCache()
      .getAll()
      .filter((query) => JSON.stringify(query.queryKey).includes(pattern))
  },

  // Clear specific query pattern
  clearQueriesByPattern: (pattern: string) => {
    queryClient.invalidateQueries({
      predicate: (query) => JSON.stringify(query.queryKey).includes(pattern),
    })
  },

  // Get cache size information
  getCacheInfo: () => {
    const queries = queryClient.getQueryCache().getAll()
    const mutations = queryClient.getMutationCache().getAll()

    return {
      totalQueries: queries.length,
      successfulQueries: queries.filter((q) => q.state.status === "success").length,
      errorQueries: queries.filter((q) => q.state.status === "error").length,
      loadingQueries: queries.filter((q) => q.state.status === "pending").length,
      totalMutations: mutations.length,
      timestamp: new Date().toISOString(),
    }
  },

  // Export cache for debugging
  exportCache: () => {
    if (typeof window === "undefined") return null

    try {
      const cache = localStorage.getItem("IQC_QUERY_CACHE")
      return cache ? JSON.parse(cache) : null
    } catch (error) {
      console.error("Failed to export cache:", error)
      return null
    }
  },
}

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  ;(window as any).iqcCacheUtils = cacheUtils
}
