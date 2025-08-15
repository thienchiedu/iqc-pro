import { QueryClient } from "@tanstack/react-query"
import { persistQueryClient } from "@tanstack/react-query-persist-client"

// Custom localStorage persister implementation
const createSyncStoragePersister = ({ storage, key, serialize, deserialize }: {
  storage: Storage | undefined;
  key: string;
  serialize: (data: any) => string;
  deserialize: (data: string) => any;
}) => {
  if (!storage) {
    return {
      persistClient: async () => {},
      restoreClient: async () => null,
      removeClient: async () => {},
    }
  }

  return {
    persistClient: async (client: any) => {
      try {
        const serializedData = serialize(client)
        storage.setItem(key, serializedData)
      } catch (error) {
        console.warn(`Failed to persist client to ${key}:`, error)
      }
    },
    restoreClient: async () => {
      try {
        const data = storage.getItem(key)
        return data ? deserialize(data) : null
      } catch (error) {
        console.warn(`Failed to restore client from ${key}:`, error)
        return null
      }
    },
    removeClient: async () => {
      try {
        storage.removeItem(key)
      } catch (error) {
        console.warn(`Failed to remove client from ${key}:`, error)
      }
    },
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default stale time - will be overridden per query type
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Garbage collection time - must be >= maxAge for persistence (24h)
      gcTime: 24 * 60 * 60 * 1000, // 24 hours
      // Disable refetch on window focus by default (will enable selectively)
      refetchOnWindowFocus: false,
      // Retry configuration with exponential backoff
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) return false
        // Don't retry more than 3 times
        return failureCount < 3
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Use placeholder data to prevent UI flicker
      placeholderData: (previousData) => previousData,
    },
    mutations: {
      // Retry mutations once on network errors
      retry: (failureCount, error: any) => {
        if (error?.status >= 400 && error?.status < 500) return false
        return failureCount < 1
      },
    },
  },
  queryCache: undefined, // Will be set by default
  mutationCache: undefined, // Will be set by default
})

const localStoragePersister = createSyncStoragePersister({
  storage: typeof window !== "undefined" ? window.localStorage : undefined,
  key: "IQC_QUERY_CACHE", // Custom key for IQC app
  serialize: JSON.stringify,
  deserialize: JSON.parse,
})

if (typeof window !== "undefined") {
  try {
    persistQueryClient({
      queryClient,
      persister: localStoragePersister,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours (must be <= gcTime)
      dehydrateOptions: {
        shouldDehydrateQuery: (query) => {
          // Only persist successful queries that are not too old
          const isSuccess = query.state.status === "success"
          const isNotStale = query.state.dataUpdatedAt > Date.now() - 24 * 60 * 60 * 1000
          return isSuccess && isNotStale
        },
        shouldDehydrateMutation: () => false, // Don't persist mutations
      },
      hydrateOptions: {
        defaultOptions: {
          queries: {
            // Shorter stale time after hydration to ensure fresh data
            staleTime: 30 * 1000, // 30 seconds
          },
        },
      },
    })

    if (process.env.NODE_ENV === "development") {
      console.log("[TanStack Query] Persistence configured with localStorage")
    }
  } catch (error) {
    console.warn("[TanStack Query] Failed to setup persistence:", error)
  }
}

export const clearQueryCache = () => {
  queryClient.clear()
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("IQC_QUERY_CACHE")
    } catch (error) {
      console.warn("Failed to clear localStorage cache:", error)
    }
  }
}

export const getCacheStats = () => {
  const queryCache = queryClient.getQueryCache()
  const mutationCache = queryClient.getMutationCache()

  return {
    queries: queryCache.getAll().length,
    mutations: mutationCache.getAll().length,
    cacheSize: typeof window !== "undefined" ? localStorage.getItem("IQC_QUERY_CACHE")?.length || 0 : 0,
  }
}
