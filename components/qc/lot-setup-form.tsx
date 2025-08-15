"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Settings, Lock, Unlock, TrendingUp } from "lucide-react"

interface LotSetupData {
  analyte: string
  level: string
  instrument_id: string
  lot_id: string
  mean_mfg?: number
  sd_mfg?: number
}

interface LotStatus {
  hasLimits: boolean
  isLocked: boolean
  pointsCount: number
  requiredPoints: number
  canEstablish: boolean
  canLock: boolean
  mean_lab?: number
  sd_lab?: number
  limits?: any
}

export function LotSetupForm() {
  const [formData, setFormData] = useState<LotSetupData>({
    analyte: "",
    level: "",
    instrument_id: "",
    lot_id: "",
    mean_mfg: undefined,
    sd_mfg: undefined,
  })

  const [lotStatus, setLotStatus] = useState<LotStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const checkLotStatus = async () => {
    if (!formData.analyte || !formData.level || !formData.instrument_id || !formData.lot_id) {
      setLotStatus(null)
      return
    }

    try {
      // Check if limits exist
      const limitsResponse = await fetch(
        `/api/qc/limits?analyte=${formData.analyte}&level=${formData.level}&instrument_id=${formData.instrument_id}&lot_id=${formData.lot_id}`,
      )

      // Get QC points count
      const pointsResponse = await fetch(
        `/api/qc/points?analyte=${formData.analyte}&level=${formData.level}&instrument_id=${formData.instrument_id}&lot_id=${formData.lot_id}`,
      )

      const limitsData = limitsResponse.ok ? await limitsResponse.json() : { limits: [] }
      const pointsData = pointsResponse.ok ? await pointsResponse.json() : { points: [] }

      const hasLimits = limitsData.limits && limitsData.limits.length > 0
      const isLocked = hasLimits && limitsData.limits[0]?.is_locked
      const pointsCount = pointsData.points ? pointsData.points.length : 0
      const requiredPoints = 20

      setLotStatus({
        hasLimits,
        isLocked,
        pointsCount,
        requiredPoints,
        canEstablish: pointsCount >= requiredPoints && !isLocked,
        canLock: hasLimits && !isLocked,
        mean_lab: hasLimits ? limitsData.limits[0]?.mean_lab : undefined,
        sd_lab: hasLimits ? limitsData.limits[0]?.sd_lab : undefined,
        limits: hasLimits ? limitsData.limits[0] : undefined,
      })
    } catch (error) {
      console.error("Lỗi kiểm tra trạng thái lô:", error)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      checkLotStatus()
    }, 500)

    return () => clearTimeout(timer)
  }, [formData.analyte, formData.level, formData.instrument_id, formData.lot_id])

  const handleEstablishLimits = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/qc/limits/establish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analyte: formData.analyte,
          level: formData.level,
          instrument_id: formData.instrument_id,
          lot_id: formData.lot_id,
          minPoints: 20,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setSuccess(`Giới hạn đã được thiết lập thành công sử dụng ${result.pointsUsed} điểm dữ liệu`)
        checkLotStatus()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Không thể thiết lập giới hạn")
      }
    } catch (error) {
      console.error("Lỗi thiết lập giới hạn:", error)
      setError("Lỗi mạng. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  const handleLockLot = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/qc/limits/lock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lot_id: formData.lot_id,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setSuccess(`Lô ${formData.lot_id} đã được khóa thành công`)
        checkLotStatus()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Không thể khóa lô")
      }
    } catch (error) {
      console.error("Lỗi khóa lô:", error)
      setError("Lỗi mạng. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  const progressPercentage = lotStatus ? Math.min((lotStatus.pointsCount / lotStatus.requiredPoints) * 100, 100) : 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Thiết Lập Lô QC
          </CardTitle>
          <CardDescription>Cấu hình và thiết lập giới hạn kiểm soát cho lô QC</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Lot Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="analyte">Chất Phân Tích</Label>
              <Select
                value={formData.analyte}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, analyte: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn chất phân tích" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Glucose">Glucose</SelectItem>
                  <SelectItem value="Cholesterol">Cholesterol</SelectItem>
                  <SelectItem value="Triglycerides">Triglycerides</SelectItem>
                  <SelectItem value="ALT">ALT (SGPT)</SelectItem>
                  <SelectItem value="AST">AST (SGOT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Mức QC</Label>
              <Select
                value={formData.level}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, level: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn mức" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L1">L1 (Thấp)</SelectItem>
                  <SelectItem value="L2">L2 (Bình thường)</SelectItem>
                  <SelectItem value="L3">L3 (Cao)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instrument_id">Thiết Bị</Label>
              <Select
                value={formData.instrument_id}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, instrument_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn thiết bị" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COBAS_C311">Cobas C311</SelectItem>
                  <SelectItem value="COBAS_C501">Cobas C501</SelectItem>
                  <SelectItem value="ARCHITECT_C4000">Architect C4000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lot_id">Mã Lô QC</Label>
              <Input
                id="lot_id"
                value={formData.lot_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, lot_id: e.target.value }))}
                placeholder="Nhập mã lô"
              />
            </div>
          </div>

          {/* Manufacturer Values (Optional) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mean_mfg">Giá Trị Trung Bình NSX (Tùy chọn)</Label>
              <Input
                id="mean_mfg"
                type="number"
                step="0.01"
                value={formData.mean_mfg || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    mean_mfg: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                placeholder="Giá trị trung bình tham chiếu"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sd_mfg">Độ Lệch Chuẩn NSX (Tùy chọn)</Label>
              <Input
                id="sd_mfg"
                type="number"
                step="0.01"
                value={formData.sd_mfg || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sd_mfg: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                placeholder="Độ lệch chuẩn tham chiếu"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lot Status */}
      {lotStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Trạng Thái Lô</span>
              <div className="flex items-center gap-2">
                {lotStatus.isLocked ? (
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    <Lock className="h-3 w-3 mr-1" />
                    Đã Khóa
                  </Badge>
                ) : (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <Unlock className="h-3 w-3 mr-1" />
                    Chưa Khóa
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Data Collection Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Điểm Dữ Liệu Đã Thu Thập</span>
                <span>
                  {lotStatus.pointsCount} / {lotStatus.requiredPoints}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {lotStatus.pointsCount < lotStatus.requiredPoints
                  ? `Cần thêm ${lotStatus.requiredPoints - lotStatus.pointsCount} điểm để thiết lập giới hạn`
                  : "Đã có đủ điểm dữ liệu"}
              </p>
            </div>

            <Separator />

            {/* Current Limits */}
            {lotStatus.hasLimits && lotStatus.limits && (
              <div className="space-y-3">
                <h4 className="font-medium">Giới Hạn Đã Thiết Lập</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Trung Bình Lab:</span>
                    <span className="ml-2 font-mono">{lotStatus.mean_lab?.toFixed(3)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Độ Lệch Chuẩn Lab:</span>
                    <span className="ml-2 font-mono">{lotStatus.sd_lab?.toFixed(3)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">±1SD:</span>
                    <span className="ml-2 font-mono">
                      {lotStatus.limits.limit_1s_lower?.toFixed(3)} - {lotStatus.limits.limit_1s_upper?.toFixed(3)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">±2SD:</span>
                    <span className="ml-2 font-mono">
                      {lotStatus.limits.limit_2s_lower?.toFixed(3)} - {lotStatus.limits.limit_2s_upper?.toFixed(3)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">±3SD:</span>
                    <span className="ml-2 font-mono">
                      {lotStatus.limits.limit_3s_lower?.toFixed(3)} - {lotStatus.limits.limit_3s_upper?.toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handleEstablishLimits} disabled={!lotStatus.canEstablish || loading} className="flex-1">
                <TrendingUp className="h-4 w-4 mr-2" />
                {loading ? "Đang thiết lập..." : "Thiết Lập Giới Hạn"}
              </Button>

              <Button
                onClick={handleLockLot}
                disabled={!lotStatus.canLock || loading}
                variant="outline"
                className="flex-1 bg-transparent"
              >
                <Lock className="h-4 w-4 mr-2" />
                {loading ? "Đang khóa..." : "Khóa Lô"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
