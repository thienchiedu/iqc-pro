"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Activity,
  BarChart3,
  Settings,
  AlertTriangle,
  Loader2,
  PlusCircle,
  FileText,
  FlaskConical,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Header } from "@/components/layout/header"
import { useDashboardStats } from "@/hooks/use-dashboard-stats"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, description, isLoading, colorClass = "" }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={cn("h-4 w-4 text-muted-foreground", colorClass)} />
    </CardHeader>
    <CardContent>
      <div className={cn("text-2xl font-bold", colorClass)}>
        {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : value}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
)

// System Status Indicator Component
const StatusIndicator = ({ status, label }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case "Connected":
      case "Ready":
      case "Active":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "Error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {getStatusIcon(status)}
        <span className="text-sm font-medium">{status}</span>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { stats, isLoading, error } = useDashboardStats()
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
          <div className="mx-auto grid w-full max-w-6xl gap-2">
            <h1 className="text-3xl font-semibold">Chào mừng trở lại, {user?.fullName || "User"}!</h1>
            <p className="text-muted-foreground">Đây là tổng quan hệ thống kiểm soát chất lượng của bạn.</p>
          </div>

          <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
            {/* Right Sidebar */}
            <nav className="grid gap-4 text-sm text-muted-foreground">
              <Card>
                <CardHeader>
                  <CardTitle>Thao Tác Nhanh</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <Button asChild>
                    <Link href="/qc-entry" className="flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Nhập Dữ Liệu QC
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/lot-setup" className="flex items-center gap-2">
                      <FlaskConical className="h-4 w-4" />
                      Thiết Lập Lô
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/reports" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Tạo Báo Cáo
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Trạng Thái Hệ Thống</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <StatusIndicator status={stats.systemStatus.googleSheetsConnection} label="Google Sheets" />
                  <StatusIndicator status={stats.systemStatus.westgardRulesEngine} label="Westgard Engine" />
                  <StatusIndicator status={stats.systemStatus.databaseSchema} label="Database Schema" />
                </CardContent>
              </Card>
            </nav>

            {/* Main Content */}
            <div className="grid gap-6">
              <div className="grid gap-4 md:grid-cols-2">
                <StatCard
                  title="Điểm QC Hoạt Động"
                  value={stats.activeQCPoints}
                  icon={Activity}
                  description="Số đo trong 24 giờ qua"
                  isLoading={isLoading}
                />
                <Card className="bg-destructive/10 border-destructive/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-destructive">Vi Phạm Đang Hoạt Động</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">
                      {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.activeViolations}
                    </div>
                    <p className="text-xs text-destructive/80">Cần được xem xét ngay</p>
                  </CardContent>
                </Card>
                <StatCard
                  title="Lô Đã Khóa"
                  value={stats.lockedLots}
                  icon={Settings}
                  description="Đã thiết lập giới hạn"
                  isLoading={isLoading}
                />
                <StatCard
                  title="Thiết Bị"
                  value={stats.instruments}
                  icon={BarChart3}
                  description="Thiết bị đã cấu hình"
                  isLoading={isLoading}
                />
              </div>
              {error && (
                <Card className="bg-red-50 border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-800">System Alert</CardTitle>
                  </CardHeader>
                  <CardContent className="text-red-700">
                    <p>Đã xảy ra lỗi khi tải dữ liệu dashboard: {error}</p>
                  </CardContent>
                </Card>
              )}
              {/* Placeholder for future charts or activity feeds */}
              <Card>
                <CardHeader>
                  <CardTitle>Hoạt Động Gần Đây</CardTitle>
                  <CardDescription>
                    Biểu đồ hiển thị các điểm QC và vi phạm theo thời gian sẽ được thêm vào đây.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] w-full flex items-center justify-center bg-secondary/50 rounded-md">
                    <p className="text-muted-foreground">Biểu đồ sắp ra mắt</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
