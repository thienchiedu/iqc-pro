"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { LeveyJenningsChart, type QCDataPoint, type ControlLimits } from "@/components/charts/levey-jennings-chart"
import { QCMonitorFilters, type QCFilters } from "@/components/qc/qc-monitor-filters"
import { QCDataTable } from "@/components/qc/qc-data-table"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, Download, RefreshCw, TrendingUp, AlertTriangle, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { BackButton } from "@/components/ui/back-button"

async function fetchQCDataAPI(filters: QCFilters, page: number, limit: number) {
  const params = new URLSearchParams()
  if (filters.analyte) params.append("analyte", filters.analyte)
  if (filters.level) params.append("level", filters.level)
  if (filters.instrument_id) params.append("instrument_id", filters.instrument_id)
  if (filters.lot_id) params.append("lot_id", filters.lot_id)
  if (filters.dateRange?.from) params.append("startDate", filters.dateRange.from.toISOString())
  if (filters.dateRange?.to) params.append("endDate", filters.dateRange.to.toISOString())
  params.append("page", page.toString())
  params.append("limit", limit.toString())

  const response = await fetch(`/api/qc/points?${params.toString()}`)
  if (!response.ok) {
    throw new Error("Failed to fetch QC data")
  }
  return response.json()
}

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
  const [pagination, setPagination] = useState({ page: 1, limit: 20 })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["qcData", filters],
    queryFn: () => fetchQCDataAPI(filters, 1, filters.maxPoints),
    staleTime: 0, // Always fetch fresh data
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })

  const allQcData = data?.points || []
  const totalPoints = data?.total || 0

  // Apply frontend pagination to the fetched data
  const startIndex = (pagination.page - 1) * pagination.limit
  const endIndex = pagination.page * pagination.limit
  const qcData = allQcData.slice(startIndex, endIndex)

  // This part is tricky, as control limits are separate. We'll fetch them independently for now.
  // A more advanced implementation might combine this into a single query.
  const [controlLimits, setControlLimits] = useState<ControlLimits | null>(null)
  const fetchControlLimits = async () => {
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
    }
  }

  const handleApplyFilters = () => {
    fetchControlLimits()
    refetch()
  }

  const handleRefreshData = () => {
    // Force refresh by invalidating cache
    refetch()
  }

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }))
  }



  const exportData = () => {
    // Export all fetched data (not just current page)
    if (allQcData.length === 0) return
    const csvContent = [
      ["Point", "Date", "Value", "Z-Score", "Status", "Violations", "Run ID", "Operator", "Comment"].join(","),
      ...allQcData.map((point, index) => {
        let formattedTimestamp = "Invalid Date"
        try {
          if (point.timestamp) {
            const date = new Date(point.timestamp)
            if (!isNaN(date.getTime())) {
              formattedTimestamp = format(date, "yyyy-MM-dd HH:mm:ss")
            }
          }
        } catch (error) {
          console.warn("Invalid timestamp format in CSV export:", point.timestamp, error)
        }
        const safeValue = typeof point.value === 'number' ? point.value : parseFloat(point.value) || 0
        const safeZ = typeof point.z === 'number' ? point.z : parseFloat(point.z) || 0
        return [
          (pagination.page - 1) * pagination.limit + index + 1,
          formattedTimestamp,
          safeValue.toFixed(3),
          safeZ.toFixed(3),
          point.status,
          Array.isArray(point.violations) ? point.violations.join(";") : "",
          point.run_id,
          point.operator || "",
          point.comment || "",
        ].join(",")
      }),
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

  const violationCount = allQcData.filter((d) => d.status === "reject").length
  const warningCount = allQcData.filter((d) => d.status === "warning").length
  const inControlCount = allQcData.filter((d) => d.status === "in-control").length

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-4">
          <BackButton />
        </div>
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Giám sát QC</h1>
                <p className="text-muted-foreground">
                  Biểu đồ Levey-Jennings và trực quan hóa dữ liệu kiểm soát chất lượng
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                  Làm mới
                </Button>
                <Button variant="outline" onClick={exportData} disabled={allQcData.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Xuất CSV
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="chart" className="space-y-6">
            <TabsList>
              <TabsTrigger value="chart">Xem biểu đồ</TabsTrigger>
              <TabsTrigger value="data">Bảng dữ liệu</TabsTrigger>
              <TabsTrigger value="statistics">Thống kê</TabsTrigger>
            </TabsList>

            <TabsContent value="chart" className="space-y-6">
              <div className="w-full">
                <QCMonitorFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  onApplyFilters={handleApplyFilters}
                  loading={isLoading}
                />
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Tổng điểm</p>
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
                          <p className="text-sm text-muted-foreground">Trong kiểm soát</p>
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
                          <p className="text-sm text-muted-foreground">Cảnh báo</p>
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
                          <p className="text-sm text-muted-foreground">Vi phạm</p>
                          <p className="text-2xl font-bold text-red-600">{violationCount}</p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error.message}</AlertDescription>
                  </Alert>
                )}
                {allQcData.length > 0 ? (
                  <LeveyJenningsChart
                    data={allQcData}
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
                      <CardTitle>Biểu đồ Levey-Jennings</CardTitle>
                      <CardDescription>{getFilterSummary()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {isLoading
                            ? "Đang tải dữ liệu..."
                            : "Không có dữ liệu cho tiêu chí đã chọn. Vui lòng điều chỉnh bộ lọc và nhấn 'Áp Dụng Bộ Lọc'."}
                        </AlertDescription>
                      </Alert>
                      {!controlLimits && qcData.length > 0 && (
                        <Alert className="mt-4">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Chưa có giới hạn kiểm soát cho tổ hợp này. Biểu đồ sẽ hiển thị dữ liệu mà không có đường giới hạn.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bảng dữ liệu QC</CardTitle>
                  <CardDescription>Xem chi tiết các phép đo kiểm soát chất lượng</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : error ? (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error.message}</AlertDescription>
                    </Alert>
                  ) : (
                    <QCDataTable
                      data={qcData}
                      page={pagination.page}
                      limit={pagination.limit}
                      total={allQcData.length}
                      onPageChange={handlePageChange}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="statistics" className="space-y-6">
              {/* Statistics Content */}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  )
}
