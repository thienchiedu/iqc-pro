import { useState, useEffect } from 'react'

interface DashboardStats {
  activeQCPoints: number
  activeViolations: number
  lockedLots: number
  instruments: number
  systemStatus: {
    googleSheetsConnection: string
    westgardRulesEngine: string
    databaseSchema: string
  }
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    activeQCPoints: 0,
    activeViolations: 0,
    lockedLots: 0,
    instruments: 0,
    systemStatus: {
      googleSheetsConnection: 'Loading...',
      westgardRulesEngine: 'Loading...',
      databaseSchema: 'Loading...'
    }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch('/api/dashboard/stats')
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard statistics')
        }
        
        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        // Set fallback data in case of error
        setStats({
          activeQCPoints: 0,
          activeViolations: 0,
          lockedLots: 0,
          instruments: 0,
          systemStatus: {
            googleSheetsConnection: 'Error',
            westgardRulesEngine: 'Active',
            databaseSchema: 'Error'
          }
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return { stats, isLoading, error, refetch: () => window.location.reload() }
}
