interface QCPointsFilters {
  analyte?: string
  level?: string
  instrument?: string
  lot?: string
  from?: string
  to?: string
}

interface QCLimitsFilters {
  analyte?: string
  level?: string
  instrument?: string
  lot?: string
}

// Rule settings query function
export const fetchRuleSettings = async () => {
  const response = await fetch("/api/config/system")
  if (!response.ok) {
    throw new Error("Failed to fetch rule settings")
  }
  return response.json()
}

// Westgard configuration query function
export const fetchWestgardConfig = async () => {
  const response = await fetch("/api/qc/config")
  if (!response.ok) {
    throw new Error("Failed to fetch Westgard configuration")
  }
  return response.json()
}

// QC limits query function
export const fetchQCLimits = async (filters: QCLimitsFilters) => {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value)
  })

  const response = await fetch(`/api/qc/limits?${params}`)
  if (!response.ok) {
    throw new Error("Failed to fetch QC limits")
  }
  return response.json()
}

// QC points query function
export const fetchQCPoints = async (filters: QCPointsFilters) => {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value)
  })

  const response = await fetch(`/api/qc/points?${params}`)
  if (!response.ok) {
    throw new Error("Failed to fetch QC points")
  }
  return response.json()
}

// QC points infinite query function for pagination
export const fetchQCPointsInfinite = async ({
  pageParam = 0,
  ...filters
}: QCPointsFilters & { pageParam?: number }) => {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value.toString())
  })
  params.append("page", pageParam.toString())

  const response = await fetch(`/api/qc/points?${params}`)
  if (!response.ok) {
    throw new Error("Failed to fetch QC points")
  }
  return response.json()
}

// Reports query function
export const fetchReports = async (scope: string) => {
  const response = await fetch(`/api/reports/export?scope=${scope}`)
  if (!response.ok) {
    throw new Error("Failed to fetch reports")
  }
  return response.json()
}

// Dashboard stats query function
export const fetchDashboardStats = async () => {
  const response = await fetch("/api/dashboard/stats")
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard stats")
  }
  return response.json()
}

// Violations query function
export const fetchViolations = async (filters?: Record<string, any>) => {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value)
    })
  }

  const response = await fetch(`/api/violations?${params}`)
  if (!response.ok) {
    throw new Error("Failed to fetch violations")
  }
  return response.json()
}
