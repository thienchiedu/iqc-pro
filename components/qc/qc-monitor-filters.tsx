"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { QCLotSelect } from "@/components/ui/qc-lot-select"
import { Filter, RotateCcw, Search } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { useActiveTests, useActiveDevices } from "@/hooks/use-master-data"

export interface QCFilters {
  analyte: string
  level: string
  instrument_id: string
  lot_id: string
  dateRange: DateRange | undefined
  showViolationsOnly: boolean
  showTrend: boolean
  maxPoints: number
}

interface QCMonitorFiltersProps {
  filters: QCFilters
  onFiltersChange: (filters: QCFilters) => void
  onApplyFilters: () => void
  loading?: boolean
}

export function QCMonitorFilters({ filters, onFiltersChange, onApplyFilters, loading = false }: QCMonitorFiltersProps) {
  // Fetch master data
  const { data: tests, isLoading: testsLoading } = useActiveTests()
  const { data: devices, isLoading: devicesLoading } = useActiveDevices()

  const handleFilterChange = (key: keyof QCFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  const resetFilters = () => {
    onFiltersChange({
      analyte: "",
      level: "",
      instrument_id: "",
      lot_id: "",
      dateRange: undefined,
      showViolationsOnly: false,
      showTrend: false,
      maxPoints: 100,
    })
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5 text-blue-600" />
          Bộ Lọc Dữ Liệu QC
        </CardTitle>
        <CardDescription>Lọc và tùy chỉnh hiển thị dữ liệu kiểm soát chất lượng</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="analyte" className="text-sm font-medium">Chất phân tích</Label>
            <Select value={filters.analyte} onValueChange={(value) => handleFilterChange("analyte", value === "all" ? "" : value)}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Tất cả chất phân tích" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả chất phân tích</SelectItem>
                {testsLoading ? (
                  <SelectItem value="loading" disabled>Đang tải...</SelectItem>
                ) : (
                  tests.map((test) => (
                    <SelectItem key={test.test_id} value={test.test_id}>
                      {test.test_name} ({test.unit})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="level" className="text-sm font-medium">Mức QC</Label>
            <Select value={filters.level} onValueChange={(value) => handleFilterChange("level", value === "all" ? "" : value)}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Tất cả mức độ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả mức độ</SelectItem>
                <SelectItem value="L1">L1 (Thấp)</SelectItem>
                <SelectItem value="L2">L2 (Bình thường)</SelectItem>
                <SelectItem value="L3">L3 (Cao)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instrument_id" className="text-sm font-medium">Thiết bị</Label>
            <Select value={filters.instrument_id} onValueChange={(value) => handleFilterChange("instrument_id", value === "all" ? "" : value)}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Tất cả thiết bị" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả thiết bị</SelectItem>
                {devicesLoading ? (
                  <SelectItem value="loading" disabled>Đang tải...</SelectItem>
                ) : (
                  devices.map((device) => (
                    <SelectItem key={device.device_id} value={device.device_id}>
                      {device.device_name}
                      {device.model && ` (${device.model})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lot_id" className="text-sm font-medium">Mã Lô QC</Label>
            <QCLotSelect
              value={filters.lot_id}
              onValueChange={(value) => handleFilterChange("lot_id", value)}
              testId={filters.analyte}
              placeholder="Chọn mã lô QC..."
            />
          </div>
        </div>

        <Separator />

        {/* Date Range and Options */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Khoảng Thời Gian</Label>
            <DatePickerWithRange
              date={filters.dateRange}
              onDateChange={(dateRange) => handleFilterChange("dateRange", dateRange)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxPoints" className="text-sm font-medium">Số Điểm Dữ Liệu Tối Đa</Label>
            <Select
              value={filters.maxPoints.toString()}
              onValueChange={(value) => handleFilterChange("maxPoints", Number.parseInt(value))}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50 điểm</SelectItem>
                <SelectItem value="100">100 điểm</SelectItem>
                <SelectItem value="200">200 điểm</SelectItem>
                <SelectItem value="500">500 điểm</SelectItem>
                <SelectItem value="1000">1000 điểm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium">Tùy Chọn Hiển Thị</Label>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50/50">
                <div className="space-y-1">
                  <Label htmlFor="showViolationsOnly" className="text-sm font-medium cursor-pointer">
                    Chỉ hiển thị vi phạm
                  </Label>
                  <p className="text-xs text-muted-foreground">Lọc chỉ các điểm có cảnh báo hoặc vi phạm</p>
                </div>
                <Switch
                  id="showViolationsOnly"
                  checked={filters.showViolationsOnly}
                  onCheckedChange={(checked) => handleFilterChange("showViolationsOnly", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50/50">
                <div className="space-y-1">
                  <Label htmlFor="showTrend" className="text-sm font-medium cursor-pointer">
                    Hiển thị đường xu hướng
                  </Label>
                  <p className="text-xs text-muted-foreground">Thêm đường xu hướng vào biểu đồ</p>
                </div>
                <Switch
                  id="showTrend"
                  checked={filters.showTrend}
                  onCheckedChange={(checked) => handleFilterChange("showTrend", checked)}
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={onApplyFilters}
            disabled={loading}
            className="flex-1 h-11 bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <Search className="h-4 w-4 mr-2" />
            {loading ? "Đang tải..." : "Áp Dụng Bộ Lọc"}
          </Button>
          <Button
            variant="outline"
            onClick={resetFilters}
            disabled={loading}
            className="sm:w-auto h-11 border-gray-300"
            size="lg"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Đặt Lại
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
