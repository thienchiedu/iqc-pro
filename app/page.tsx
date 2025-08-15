"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, BarChart3, Settings, AlertTriangle, Loader2 } from "lucide-react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Header } from "@/components/layout/header"
import { useDashboardStats } from "@/hooks/use-dashboard-stats"

export default function HomePage() {
  const { stats, isLoading, error } = useDashboardStats()
  
  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Connected':
      case 'Ready':
      case 'Active':
        return 'text-green-600'
      case 'Error':
        return 'text-red-600'
      case 'Loading...':
        return 'text-muted-foreground'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Quality Control Dashboard</h2>
            <p className="text-muted-foreground">Westgard Rules-based Statistical Quality Control System</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active QC Points</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.activeQCPoints}
                </div>
                <p className="text-xs text-muted-foreground">Today's measurements</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Violations</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.activeViolations}
                </div>
                <p className="text-xs text-muted-foreground">Requiring attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Locked Lots</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.lockedLots}
                </div>
                <p className="text-xs text-muted-foreground">With established limits</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Instruments</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.instruments}
                </div>
                <p className="text-xs text-muted-foreground">Configured devices</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" asChild>
                  <Link href="/qc-entry">Enter QC Data</Link>
                </Button>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/lot-setup">Setup New Lot</Link>
                </Button>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/reports">Generate Reports</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current system health and configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Google Sheets Connection</span>
                  <span className={`text-sm ${getStatusColor(stats.systemStatus.googleSheetsConnection)}`}>
                    {stats.systemStatus.googleSheetsConnection}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Westgard Rules Engine</span>
                  <span className={`text-sm ${getStatusColor(stats.systemStatus.westgardRulesEngine)}`}>
                    {stats.systemStatus.westgardRulesEngine}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database Schema</span>
                  <span className={`text-sm ${getStatusColor(stats.systemStatus.databaseSchema)}`}>
                    {stats.systemStatus.databaseSchema}
                  </span>
                </div>
                {error && (
                  <div className="text-xs text-red-600 mt-2">
                    Error: {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
