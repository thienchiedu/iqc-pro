"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Trash2, Edit, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Data structure for a QC Level
interface QCLevel {
  id: string
  test_id: string
  level: "L1" | "L2" | "L3" | "L4"
  target_mean?: number
  target_sd?: number
  material?: string
  lot_hint?: string
  is_active: boolean
}

// Main component for QC Level configuration
export function QCLevelConfig() {
  const [qcLevels, setQcLevels] = useState<QCLevel[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLevel, setEditingLevel] = useState<QCLevel | null>(null)
  const [formData, setFormData] = useState<Omit<QCLevel, "id">>({
    test_id: "",
    level: "L1",
    target_mean: undefined,
    target_sd: undefined,
    material: "",
    lot_hint: "",
    is_active: true,
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchQCLevels()
  }, [])

  const fetchQCLevels = async () => {
    try {
      const response = await fetch("/api/config/qc-levels")
      if (response.ok) {
        const data = await response.json()
        setQcLevels(data)
      } else {
        throw new Error("Failed to fetch QC levels")
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách mức QC.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const url = editingLevel
      ? `/api/config/qc-levels/${editingLevel.id}`
      : "/api/config/qc-levels"
    const method = editingLevel ? "PUT" : "POST"

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Thành công",
          description: `Mức QC đã được ${editingLevel ? "cập nhật" : "tạo"} thành công.`,
        })
        fetchQCLevels()
        resetForm()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to save QC level")
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu mức QC.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      test_id: "",
      level: "L1",
      target_mean: undefined,
      target_sd: undefined,
      material: "",
      lot_hint: "",
      is_active: true,
    })
    setEditingLevel(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (level: QCLevel) => {
    setEditingLevel(level)
    setFormData(level)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa mức QC này?")) return

    try {
      const response = await fetch(`/api/config/qc-levels/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Đã xóa mức QC thành công.",
        })
        fetchQCLevels()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete QC level")
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa mức QC.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cấu Hình Mức QC</CardTitle>
            <CardDescription>
              Quản lý các mức kiểm tra chất lượng (ví dụ: Level 1, Level 2) cho từng lô QC.
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm Mức QC
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingLevel ? "Chỉnh Sửa Mức QC" : "Thêm Mức QC Mới"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="test_id">Mã Xét Nghiệm</Label>
                    <Input
                      id="test_id"
                      value={formData.test_id}
                      onChange={(e) => setFormData({ ...formData, test_id: e.target.value })}
                      placeholder="Vd: GLUCOSE_1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level">Mức</Label>
                    <Select
                      value={formData.level}
                      onValueChange={(value: any) => setFormData({ ...formData, level: value })}
                    >
                      <SelectTrigger id="level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L1">L1</SelectItem>
                        <SelectItem value="L2">L2</SelectItem>
                        <SelectItem value="L3">L3</SelectItem>
                        <SelectItem value="L4">L4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target_mean">Mean Mục Tiêu</Label>
                    <Input
                      id="target_mean"
                      type="number"
                      step="any"
                      value={formData.target_mean || ""}
                      onChange={(e) => setFormData({ ...formData, target_mean: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="Vd: 100.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target_sd">SD Mục Tiêu</Label>
                    <Input
                      id="target_sd"
                      type="number"
                      step="any"
                      value={formData.target_sd || ""}
                      onChange={(e) => setFormData({ ...formData, target_sd: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="Vd: 2.5"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="material">Vật liệu QC</Label>
                  <Input
                    id="material"
                    value={formData.material || ""}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    placeholder="Vd: Bio-Rad Lyphochek"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lot_hint">Gợi ý lô</Label>
                  <Input
                    id="lot_hint"
                    value={formData.lot_hint || ""}
                    onChange={(e) => setFormData({ ...formData, lot_hint: e.target.value })}
                    placeholder="Vd: Chứa 'ABC'"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Kích hoạt</Label>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => resetForm()}>
                    Hủy
                  </Button>
                  <Button type="submit">{editingLevel ? "Cập Nhật" : "Lưu"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã Xét Nghiệm</TableHead>
                <TableHead>Mức</TableHead>
                <TableHead>Mean/SD Mục Tiêu</TableHead>
                <TableHead>Vật liệu</TableHead>
                <TableHead>Trạng Thái</TableHead>
                <TableHead className="text-right">Thao Tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {qcLevels.length > 0 ? (
                qcLevels.map((level) => (
                  <TableRow key={level.id}>
                    <TableCell className="font-medium">{level.test_id}</TableCell>
                    <TableCell>{level.level}</TableCell>
                    <TableCell>
                      {level.target_mean ?? "N/A"} / {level.target_sd ?? "N/A"}
                    </TableCell>
                    <TableCell>{level.material ?? "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant={level.is_active ? "default" : "destructive"}>
                        {level.is_active ? "Hoạt động" : "Vô hiệu"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(level)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(level.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    Không có dữ liệu mức QC.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}