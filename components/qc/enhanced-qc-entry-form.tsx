"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Save, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"

export function EnhancedQCEntryForm() {
  const [formData, setFormData] = useState({
    analyte: "",
    level: "",
    instrument_id: "",
    lot_id: "",
    value: "",
    timestamp: new Date().toISOString().slice(0, 16),
    run_id: "",
    shift: "",
    operator: "",
    comment: "",
    shift_flag: false,
    trend_flag: false,
    root_cause: "",
    corrective_action: "",
    conclusion: "",
  })

  const [cusumValues, setCusumValues] = useState({
    cusum_pos: 0,
    cusum_neg: 0,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/qc/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          value: Number.parseFloat(formData.value),
          ...cusumValues,
        }),
      })

      if (response.ok) {
        const result = await response.json()

        // Update CUSUM values from response
        if (result.cusum) {
          setCusumValues({
            cusum_pos: result.cusum.pos,
            cusum_neg: result.cusum.neg,
          })
        }

        toast({
          title: "Thành công",
          description: `Điểm QC đã được xử lý. Trạng thái: ${result.status}`,
          variant: result.status === "reject" ? "destructive" : "default",
        })

        // Reset form
        setFormData({
          ...formData,
          value: "",
          comment: "",
          root_cause: "",
          corrective_action: "",
          conclusion: "",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Lỗi",
          description: error.error || "Không thể xử lý điểm QC",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Lỗi kết nối mạng",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nhập dữ liệu QC nâng cao</CardTitle>
        <CardDescription>
          Nhập điểm QC với thông tin mở rộng bao gồm SHIFT, TREND, CUSUM và phân tích nguyên nhân
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Thông tin cơ bản</h3>

              <div>
                <Label htmlFor="analyte">Analyte</Label>
                <Select
                  value={formData.analyte}
                  onValueChange={(value) => setFormData({ ...formData, analyte: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn analyte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="glucose">Glucose</SelectItem>
                    <SelectItem value="cholesterol">Cholesterol</SelectItem>
                    <SelectItem value="triglycerides">Triglycerides</SelectItem>
                    <SelectItem value="urea">Urea</SelectItem>
                    <SelectItem value="creatinine">Creatinine</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="level">Mức QC</Label>
                <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn mức" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L1">Level 1 (Thấp)</SelectItem>
                    <SelectItem value="L2">Level 2 (Cao)</SelectItem>
                    <SelectItem value="L3">Level 3 (Rất cao)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="value">Giá trị</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="Nhập giá trị đo"
                  required
                />
              </div>

              <div>
                <Label htmlFor="instrument_id">Thiết bị</Label>
                <Input
                  id="instrument_id"
                  value={formData.instrument_id}
                  onChange={(e) => setFormData({ ...formData, instrument_id: e.target.value })}
                  placeholder="ID thiết bị"
                  required
                />
              </div>

              <div>
                <Label htmlFor="lot_id">Lô QC</Label>
                <Input
                  id="lot_id"
                  value={formData.lot_id}
                  onChange={(e) => setFormData({ ...formData, lot_id: e.target.value })}
                  placeholder="ID lô QC"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Thông tin mở rộng</h3>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <Label htmlFor="shift_flag">SHIFT</Label>
                </div>
                <Switch
                  id="shift_flag"
                  checked={formData.shift_flag}
                  onCheckedChange={(checked) => setFormData({ ...formData, shift_flag: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-blue-500" />
                  <Label htmlFor="trend_flag">TREND</Label>
                </div>
                <Switch
                  id="trend_flag"
                  checked={formData.trend_flag}
                  onCheckedChange={(checked) => setFormData({ ...formData, trend_flag: checked })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cusum_pos">CUSUM (+)</Label>
                  <Input
                    id="cusum_pos"
                    type="number"
                    step="0.01"
                    value={cusumValues.cusum_pos}
                    onChange={(e) =>
                      setCusumValues({ ...cusumValues, cusum_pos: Number.parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="cusum_neg">CUSUM (-)</Label>
                  <Input
                    id="cusum_neg"
                    type="number"
                    step="0.01"
                    value={cusumValues.cusum_neg}
                    onChange={(e) =>
                      setCusumValues({ ...cusumValues, cusum_neg: Number.parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="run_id">Run ID</Label>
                <Input
                  id="run_id"
                  value={formData.run_id}
                  onChange={(e) => setFormData({ ...formData, run_id: e.target.value })}
                  placeholder="ID run"
                />
              </div>

              <div>
                <Label htmlFor="operator">Người thực hiện</Label>
                <Input
                  id="operator"
                  value={formData.operator}
                  onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                  placeholder="Tên người thực hiện"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h3 className="font-semibold">Phân tích nguyên nhân gốc (RCA)</h3>
            </div>

            <div>
              <Label htmlFor="root_cause">Nguyên nhân gốc</Label>
              <Textarea
                id="root_cause"
                value={formData.root_cause}
                onChange={(e) => setFormData({ ...formData, root_cause: e.target.value })}
                placeholder="Mô tả nguyên nhân gốc của vấn đề..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="corrective_action">Hành động khắc phục</Label>
              <Textarea
                id="corrective_action"
                value={formData.corrective_action}
                onChange={(e) => setFormData({ ...formData, corrective_action: e.target.value })}
                placeholder="Mô tả các hành động khắc phục đã thực hiện..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="conclusion">Kết luận</Label>
              <Textarea
                id="conclusion"
                value={formData.conclusion}
                onChange={(e) => setFormData({ ...formData, conclusion: e.target.value })}
                placeholder="Kết luận và đánh giá hiệu quả..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="comment">Ghi chú</Label>
              <Textarea
                id="comment"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Ghi chú bổ sung..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? "Đang xử lý..." : "Lưu điểm QC"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
