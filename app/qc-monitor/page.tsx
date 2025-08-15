"use client"

import { useState, useEffect } from "react"
import { LeveyJenningsChart, type QCDataPoint, type ControlLimits } from "@/components/charts/levey-jennings-chart"
import { QCMonitorFilters, type QCFilters } from "@/components/qc/qc-monitor-filters"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, Download, RefreshCw, TrendingUp, AlertTriangle } from "lucide-react"
import { format } from "date-fns"

export default function QCMonitorPage() {
  const [filters, setFilters] = useState<QCFilters>({
    analyte: "",
    level: "",
    instrument_id: "",
    lot_id: "",
    dateRange: undefined,
    showViolationsOnly: false,
    showTrend: false,
    maxPoints: 100,
  })

  const [qcData, setQcData] = useState<QCDataPoint[]>([])
  const [controlLimits, setControlLimits] = useState<ControlLimits | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchQCData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Build query parameters
      const params = new URLSearchParams()
      if (filters.analyte) params.append("analyte", filters.analyte)
      if (filters.level) params.append("level", filters.level)
      if (filters.instrument_id) params.append("instrument_id", filters.instrument_id)
      if (filters.lot_id) params.append("lot_id", filters.lot_id)
      if (filters.dateRange?.from) params.append("startDate", filters.dateRange.from.toISOString())
      if (filters.dateRange?.to) params.append("endDate", filters.dateRange.to.toISOString())

      // Fetch QC points
      const pointsResponse = await fetch(`/api/qc/points?${params.toString()}`)
      if (!pointsResponse.ok) {
        throw new Error("Failed to fetch QC data")
      }

      const pointsData = await pointsResponse.json()
      let points = pointsData.points || []

      // Parse violations JSON and filter if needed
      points = points.map((point: any) => ({
        ...point,
        violations: point.violations_json ? JSON.parse(point.violations_json).map((v: any) => v.rule) : [],
      }))

      // Apply violations filter
      if (filters.showViolationsOnly) {
        points = points.filter((point: any) => point.status === "reject" || point.status === "warning")
      }

      // Limit number of points
      if (points.length > filters.maxPoints) {
        points = points.slice(-filters.maxPoints)
      }

      setQcData(points)

      // Fetch control limits if we have specific criteria
      if (filters.analyte && filters.level && filters.instrument_id && filters.lot_id) {
        const limitsResponse = await fetch(
          `/api/qc/limits?analyte=${filters.analyte}&level=${filters.level}&instrument_id=${filters.instrument_id}&lot_id=${filters.lot_id}`,
        )

        if (limitsResponse.ok) {
          const limitsData = await limitsResponse.json()
          if (limitsData.limits && limitsData.limits.length > 0) {
            setControlLimits(limitsData.limits[0])
          } else {
            setControlLimits(null)
          }
        }
      } else {
        setControlLimits(null)
      }
    } catch (error) {
      console.error("Error fetching QC data:", error)
      setError("Failed to load QC data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQCData()
  }, [])

  const handleApplyFilters = () => {
    fetchQCData()
  }

  const exportData = () => {
    if (qcData.length === 0) return

    const csvContent = [
      ["Point", "Date", "Value", "Z-Score", "Status", "Violations", "Run ID", "Operator", "Comment"].join(","),
      ...qcData.map((point, index) =>
        [
          index + 1,
          format(new Date(point.timestamp), "yyyy-MM-dd HH:mm:ss"),
          point.value.toFixed(3),
          point.z.toFixed(3),
          point.status,
          point.violations.join(";"),
          point.run_id,
          point.operator || "",
          point.comment || "",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `qc-data-${format(new Date(), "yyyy-MM-dd")}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getFilterSummary = () => {
    const parts = []
    if (filters.analyte) parts.push(filters.analyte)
    if (filters.level) parts.push(filters.level)
    if (filters.instrument_id) parts.push(filters.instrument_id)
    if (filters.lot_id) parts.push(`Lot: ${filters.lot_id}`)
    return parts.length > 0 ? parts.join(" • ") : "All QC Data"
  }

  const violationCount = qcData.filter((d) => d.status === "reject").length
  const warningCount = qcData.filter((d) => d.status === "warning").length
  const inControlCount = qcData.filter((d) => d.status === "in-control").length

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">QC Monitor</h1>
                <p className="text-muted-foreground">Levey-Jennings charts and quality control data visualization</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={fetchQCData} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button variant="outline" onClick={exportData} disabled={qcData.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="chart" className="space-y-6">
            <TabsList>
              <TabsTrigger value="chart">Chart View</TabsTrigger>
              <TabsTrigger value="data">Data Table</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="chart" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Filters */}
                <div className="lg:col-span-1">
                  <QCMonitorFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    onApplyFilters={handleApplyFilters}
                    loading={loading}
                  />
                </div>

                {/* Chart */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Points</p>
                            <p className="text-2xl font-bold">{qcData.length}</p>
                          </div>
                          <BarChart3 className="h-8 w-8 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">In-Control</p>
                            <p className="text-2xl font-bold text-green-600">{inControlCount}</p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Warnings</p>
                            <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
                          </div>
                          <AlertTriangle className="h-8 w-8 text-yellow-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Violations</p>
                            <p className="text-2xl font-bold text-red-600">{violationCount}</p>
                          </div>
                          <AlertTriangle className="h-8 w-8 text-red-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Chart */}
                  {controlLimits ? (
                    <LeveyJenningsChart
                      data={qcData}
                      limits={controlLimits}
                      title={getFilterSummary()}
                      analyte={filters.analyte}
                      level={filters.level}
                      instrument={filters.instrument_id}
                      lot={filters.lot_id}
                      showViolations={true}
                      showTrend={filters.showTrend}
                      height={500}
                    />
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>Levey-Jennings Chart</CardTitle>
                        <CardDescription>{getFilterSummary()}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            {qcData.length === 0
                              ? "No data available for the selected criteria."
                              : "Please select specific analyte, level, instrument, and lot to display control limits."}
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>QC Data Table</CardTitle>
                  <CardDescription>Detailed view of quality control measurements</CardDescription>
                </CardHeader>
                <CardContent>
                  {qcData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Point</th>
                            <th className="text-left p-2">Date/Time</th>
                            <th className="text-left p-2">Value</th>
                            <th className="text-left p-2">Z-Score</th>
                            <th className="text-left p-2">Status</th>
                            <th className="text-left p-2">Run ID</th>
                            <th className="text-left p-2">Violations</th>
                          </tr>
                        </thead>
                        <tbody>
                          {qcData.map((point, index) => (
                            <tr key={point.id} className="border-b hover:bg-gray-50">
                              <td className="p-2">{index + 1}</td>
                              <td className="p-2">{format(new Date(point.timestamp), "MM/dd/yyyy HH:mm")}</td>
                              <td className="p-2 font-mono">{point.value.toFixed(3)}</td>
                              <td className="p-2 font-mono">
                                <span className={Math.abs(point.z) >= 2 ? "text-red-600" : "text-green-600"}>
                                  {point.z.toFixed(3)}
                                </span>
                              </td>
                              <td className="p-2">
                                <Badge
                                  variant={
                                    point.status === "reject"
                                      ? "destructive"
                                      : point.status === "warning"
                                        ? "secondary"
                                        : "default"
                                  }
                                >
                                  {point.status}
                                </Badge>
                              </td>
                              <td className="p-2">{point.run_id}</td>
                              <td className="p-2">
                                {point.violations.map((violation, vIndex) => (
                                  <Badge key={vIndex} variant="outline" className="mr-1 text-xs">
                                    {violation}
                                  </Badge>
                                ))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>No data available for the selected criteria.</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="statistics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Data Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {qcData.length > 0 ? (
                      <>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Total Points:</span>
                            <span className="ml-2 font-medium">{qcData.length}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Date Range:</span>
                            <span className="ml-2 font-medium">
                              {qcData.length > 0 &&
                                `${format(new Date(qcData[0].timestamp), "MM/dd")} - ${format(
                                  new Date(qcData[qcData.length - 1].timestamp),
                                  "MM/dd",
                                )}`}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">In-Control:</span>
                            <span className="ml-2 font-medium text-green-600">
                              {inControlCount} ({((inControlCount / qcData.length) * 100).toFixed(1)}%)
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Violations:</span>
                            <span className="ml-2 font-medium text-red-600">
                              {violationCount} ({((violationCount / qcData.length) * 100).toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">No data available</p>
                    )}
                  </CardContent>
                </Card>

                {controlLimits && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Control Limits</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-muted-foreground">Mean:</span>
                          <span className="ml-2 font-mono">{controlLimits.mean.toFixed(3)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">SD:</span>
                          <span className="ml-2 font-mono">{controlLimits.sd.toFixed(3)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">+1SD:</span>
                          <span className="ml-2 font-mono">{controlLimits.limit_1s_upper.toFixed(3)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">-1SD:</span>
                          <span className="ml-2 font-mono">{controlLimits.limit_1s_lower.toFixed(3)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">+2SD:</span>
                          <span className="ml-2 font-mono">{controlLimits.limit_2s_upper.toFixed(3)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">-2SD:</span>
                          <span className="ml-2 font-mono">{controlLimits.limit_2s_lower.toFixed(3)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">+3SD:</span>
                          <span className="ml-2 font-mono">{controlLimits.limit_3s_upper.toFixed(3)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">-3SD:</span>
                          <span className="ml-2 font-mono">{controlLimits.limit_3s_lower.toFixed(3)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  )
}
