"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Clock } from "lucide-react"

interface QCEntryFormProps {
  onSubmit?: (data: QCEntryData) => void
  loading?: boolean
}

export interface QCEntryData {
  analyte: string
  level: string
  instrument_id: string
  lot_id: string
  value: number
  timestamp: string
  run_id: string
  shift: string
  operator: string
  comment: string
}

export function QCEntryForm({ onSubmit, loading = false }: QCEntryFormProps) {
  const [formData, setFormData] = useState<QCEntryData>({
    analyte: "",
    level: "",
    instrument_id: "",
    lot_id: "",
    value: 0,
    timestamp: new Date().toISOString().slice(0, 16), // Format for datetime-local input
    run_id: "",
    shift: "",
    operator: "",
    comment: "",
  })

  const [errors, setErrors] = useState<string[]>([])

  const validateForm = (): boolean => {
    const newErrors: string[] = []

    if (!formData.analyte) newErrors.push("Chất phân tích là bắt buộc")
    if (!formData.level) newErrors.push("Mức độ là bắt buộc")
    if (!formData.instrument_id) newErrors.push("Thiết bị là bắt buộc")
    if (!formData.lot_id) newErrors.push("Mã lô là bắt buộc")
    if (!formData.value || formData.value <= 0) newErrors.push("Giá trị hợp lệ là bắt buộc")
    if (!formData.run_id) newErrors.push("Mã chạy là bắt buộc")

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Convert datetime-local format to ISO string
    const submitData = {
      ...formData,
      timestamp: new Date(formData.timestamp).toISOString(),
      value: Number(formData.value),
    }

    onSubmit?.(submitData)
  }

  const handleInputChange = (field: keyof QCEntryData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([])
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Nhập Dữ Liệu QC
        </CardTitle>
        <CardDescription>Nhập dữ liệu đo lường kiểm soát chất lượng để phân tích</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Test Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="analyte">Chất phân tích *</Label>
              <Select value={formData.analyte} onValueChange={(value) => handleInputChange("analyte", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn chất phân tích" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Glucose">Glucose</SelectItem>
                  <SelectItem value="Cholesterol">Cholesterol</SelectItem>
                  <SelectItem value="Triglycerides">Triglycerides</SelectItem>
                  <SelectItem value="HDL">HDL Cholesterol</SelectItem>
                  <SelectItem value="LDL">LDL Cholesterol</SelectItem>
                  <SelectItem value="ALT">ALT (SGPT)</SelectItem>
                  <SelectItem value="AST">AST (SGOT)</SelectItem>
                  <SelectItem value="ALP">Alkaline Phosphatase</SelectItem>
                  <SelectItem value="GGT">Gamma GT</SelectItem>
                  <SelectItem value="Bilirubin">Total Bilirubin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Mức QC *</Label>
              <Select value={formData.level} onValueChange={(value) => handleInputChange("level", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn mức độ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L1">L1 (Thấp)</SelectItem>
                  <SelectItem value="L2">L2 (Bình thường)</SelectItem>
                  <SelectItem value="L3">L3 (Cao)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Instrument and Lot */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instrument_id">Thiết bị *</Label>
              <Select
                value={formData.instrument_id}
                onValueChange={(value) => handleInputChange("instrument_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn thiết bị" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COBAS_C311">Cobas C311</SelectItem>
                  <SelectItem value="COBAS_C501">Cobas C501</SelectItem>
                  <SelectItem value="ARCHITECT_C4000">Architect C4000</SelectItem>
                  <SelectItem value="VITROS_5600">Vitros 5600</SelectItem>
                  <SelectItem value="AU5800">AU5800</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lot_id">Mã Lô QC *</Label>
              <Input
                id="lot_id"
                value={formData.lot_id}
                onChange={(e) => handleInputChange("lot_id", e.target.value)}
                placeholder="Nhập mã lô"
              />
            </div>
          </div>

          {/* Measurement Value */}
          <div className="space-y-2">
            <Label htmlFor="value">Giá Trị Đo *</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              value={formData.value || ""}
              onChange={(e) => handleInputChange("value", e.target.value)}
              placeholder="Nhập giá trị đo"
            />
          </div>

          {/* Run Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="run_id">Mã Chạy *</Label>
              <Input
                id="run_id"
                value={formData.run_id}
                onChange={(e) => handleInputChange("run_id", e.target.value)}
                placeholder="vd: RUN001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shift">Ca Làm</Label>
              <Select value={formData.shift} onValueChange={(value) => handleInputChange("shift", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn ca làm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Ca A (Sáng)</SelectItem>
                  <SelectItem value="B">Ca B (Chiều)</SelectItem>
                  <SelectItem value="C">Ca C (Tối)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timestamp">Ngày & Giờ</Label>
              <Input
                id="timestamp"
                type="datetime-local"
                value={formData.timestamp}
                onChange={(e) => handleInputChange("timestamp", e.target.value)}
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="operator">Người Thực Hiện</Label>
              <Input
                id="operator"
                value={formData.operator}
                onChange={(e) => handleInputChange("operator", e.target.value)}
                placeholder="Tên người thực hiện"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Ghi Chú</Label>
              <Textarea
                id="comment"
                value={formData.comment}
                onChange={(e) => handleInputChange("comment", e.target.value)}
                placeholder="Ghi chú tùy chọn"
                rows={3}
              />
            </div>
          </div>

          {/* Error Display */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
                  analyte: "",
                  level: "",
                  instrument_id: "",
                  lot_id: "",
                  value: 0,
                  timestamp: new Date().toISOString().slice(0, 16),
                  run_id: "",
                  shift: "",
                  operator: "",
                  comment: "",
                })
                setErrors([])
              }}
            >
              Xóa
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang xử lý..." : "Gửi Dữ Liệu QC"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
