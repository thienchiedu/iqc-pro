export const queryKeys = {
  // Rule settings - static configuration
  ruleSettings: ["rule_settings"] as const,

  // Westgard configuration - system-wide QC rules
  westgardConfig: ["westgard_config"] as const,

  // QC limits - specific to analyte/level/instrument/lot combination
  qcLimits: (filters: {
    analyte?: string
    level?: string
    instrument?: string
    lot?: string
  }) => ["qc_limits", filters] as const,

  // QC points - time-series data with date range
  qcPoints: (filters: {
    analyte?: string
    level?: string
    instrument?: string
    lot?: string
    from?: string
    to?: string
  }) => ["qc_points", filters] as const,

  // QC points infinite - for pagination
  qcPointsInfinite: (filters: {
    analyte?: string
    level?: string
    instrument?: string
    lot?: string
    pageSize?: number
  }) => ["qc_points.infinite", filters] as const,

  // Reports - various report types
  reports: (scope: string) => ["reports", { scope }] as const,

  // Dashboard stats
  dashboardStats: ["dashboard_stats"] as const,

  // Violations
  violations: (filters?: Record<string, any>) => (filters ? ["violations", filters] : (["violations"] as const)),
}
