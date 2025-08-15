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
      case "Connected":
      case "Ready":
      case "Active":
        return "text-green-600"
      case "Error":
        return "text-red-600"
      case "Loading...":
        return "text-muted-foreground"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Bảng Điều Khiển Kiểm Soát Chất Lượng</h2>
            <p className="text-muted-foreground">Hệ Thống Kiểm Soát Chất Lượng Thống Kê Dựa Trên Quy Tắc Westgard</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Điểm QC Hoạt Động</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.activeQCPoints}
                </div>
                <p className="text-xs text-muted-foreground">Số đo hôm nay</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vi Phạm Đang Hoạt Động</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.activeViolations}
                </div>
                <p className="text-xs text-muted-foreground">Cần xử lý</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lô Đã Khóa</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.lockedLots}
                </div>
                <p className="text-xs text-muted-foreground">Đã thiết lập giới hạn</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Thiết Bị</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.instruments}
                </div>
                <p className="text-xs text-muted-foreground">Thiết bị đã cấu hình</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Thao Tác Nhanh</CardTitle>
                <CardDescription>Các tác vụ và thao tác thường dùng</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" asChild>
                  <Link href="/qc-entry">Nhập Dữ Liệu QC</Link>
                </Button>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/lot-setup">Thiết Lập Lô Mới</Link>
                </Button>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/reports">Tạo Báo Cáo</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trạng Thái Hệ Thống</CardTitle>
                <CardDescription>Tình trạng và cấu hình hệ thống hiện tại</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Kết Nối Google Sheets</span>
                  <span className={`text-sm ${getStatusColor(stats.systemStatus.googleSheetsConnection)}`}>
                    {stats.systemStatus.googleSheetsConnection}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Engine Quy Tắc Westgard</span>
                  <span className={`text-sm ${getStatusColor(stats.systemStatus.westgardRulesEngine)}`}>
                    {stats.systemStatus.westgardRulesEngine}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Schema Cơ Sở Dữ Liệu</span>
                  <span className={`text-sm ${getStatusColor(stats.systemStatus.databaseSchema)}`}>
                    {stats.systemStatus.databaseSchema}
                  </span>
                </div>
                {error && <div className="text-xs text-red-600 mt-2">Lỗi: {error}</div>}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
