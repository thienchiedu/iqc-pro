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
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Edit, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Định nghĩa kiểu dữ liệu cho một thiết bị
interface Instrument {
  id: string
  name: string
  model: string
  serialNumber: string
  manufacturer: string
  location: string
  status: "active" | "maintenance" | "inactive"
  installDate: string
  lastCalibration: string
  nextCalibration: string
  notes: string
}

// Component chính cho cấu hình thiết bị
export function InstrumentConfig() {
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingInstrument, setEditingInstrument] = useState<Instrument | null>(
    null
  )
  const [formData, setFormData] = useState({
    name: "",
    model: "",
    serialNumber: "",
    manufacturer: "",
    location: "",
    status: "active" as const,
    installDate: "",
    lastCalibration: "",
    nextCalibration: "",
    notes: "",
  })
  const { toast } = useToast()

  // Fetch dữ liệu thiết bị khi component được mount
  useEffect(() => {
    fetchInstruments()
  }, [])

  // Hàm fetch dữ liệu thiết bị từ API
  const fetchInstruments = async () => {
    try {
      const response = await fetch("/api/config/instruments")
      if (response.ok) {
        const data = await response.json()
        setInstruments(data)
      } else {
        throw new Error("Failed to fetch instruments")
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách thiết bị.",
        variant: "destructive",
      })
    }
  }

  // Xử lý việc submit form (thêm mới hoặc cập nhật)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const instrumentData = {
      id: editingInstrument?.id || crypto.randomUUID(),
      ...formData,
    }

    try {
      const url = editingInstrument
        ? `/api/config/instruments/${editingInstrument.id}`
        : "/api/config/instruments"
      const method = editingInstrument ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(instrumentData),
      })

      if (response.ok) {
        toast({
          title: "Thành công",
          description: `Thiết bị đã được ${
            editingInstrument ? "cập nhật" : "tạo"
          } thành công.`,
        })
        fetchInstruments()
        resetForm()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to save instrument")
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu thiết bị.",
        variant: "destructive",
      })
    }
  }

  // Reset form và đóng dialog
  const resetForm = () => {
    setFormData({
      name: "",
      model: "",
      serialNumber: "",
      manufacturer: "",
      location: "",
      status: "active",
      installDate: "",
      lastCalibration: "",
      nextCalibration: "",
      notes: "",
    })
    setEditingInstrument(null)
    setIsDialogOpen(false)
  }

  // Chuẩn bị form để chỉnh sửa
  const handleEdit = (instrument: Instrument) => {
    setEditingInstrument(instrument)
    setFormData({
      ...instrument,
      installDate: instrument.installDate.split("T")[0], // Định dạng lại ngày
      lastCalibration: instrument.lastCalibration.split("T")[0],
      nextCalibration: instrument.nextCalibration.split("T")[0],
    })
    setIsDialogOpen(true)
  }

  // Xử lý việc xóa thiết bị
  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thiết bị này?")) return

    try {
      const response = await fetch(`/api/config/instruments/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Đã xóa thiết bị thành công.",
        })
        fetchInstruments()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete instrument")
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa thiết bị.",
        variant: "destructive",
      })
    }
  }

  // Lấy màu cho trạng thái
  const getStatusBadgeVariant = (
    status: "active" | "maintenance" | "inactive"
  ) => {
    switch (status) {
      case "active":
        return "default"
      case "maintenance":
        return "secondary"
      case "inactive":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cấu Hình Thiết Bị</CardTitle>
            <CardDescription>
              Quản lý các thiết bị xét nghiệm và lịch trình bảo trì của chúng.
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm Thiết Bị
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>
                  {editingInstrument ? "Chỉnh Sửa Thiết Bị" : "Thêm Thiết Bị Mới"}
                </DialogTitle>
                <DialogDescription>
                  Điền thông tin chi tiết và thông tin bảo trì của thiết bị.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tên Thiết Bị</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Vd: Cobas 8000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) =>
                        setFormData({ ...formData, model: e.target.value })
                      }
                      placeholder="Vd: c702"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serialNumber">Số Sê-ri</Label>
                    <Input
                      id="serialNumber"
                      value={formData.serialNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, serialNumber: e.target.value })
                      }
                      placeholder="Vd: 12345-XYZ"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer">Nhà Sản Xuất</Label>
                    <Input
                      id="manufacturer"
                      value={formData.manufacturer}
                      onChange={(e) =>
                        setFormData({ ...formData, manufacturer: e.target.value })
                      }
                      placeholder="Vd: Roche Diagnostics"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Vị Trí</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      placeholder="Vd: Phòng Hóa sinh"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Trạng Thái</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Hoạt động</SelectItem>
                        <SelectItem value="maintenance">Bảo trì</SelectItem>
                        <SelectItem value="inactive">Vô hiệu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="installDate">Ngày Cài Đặt</Label>
                    <Input
                      id="installDate"
                      type="date"
                      value={formData.installDate}
                      onChange={(e) =>
                        setFormData({ ...formData, installDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastCalibration">Lần Hiệu Chuẩn Cuối</Label>
                    <Input
                      id="lastCalibration"
                      type="date"
                      value={formData.lastCalibration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lastCalibration: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nextCalibration">Lần Hiệu Chuẩn Kế Tiếp</Label>
                    <Input
                      id="nextCalibration"
                      type="date"
                      value={formData.nextCalibration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nextCalibration: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Ghi Chú</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Thêm ghi chú về thiết bị..."
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => resetForm()}
                  >
                    Hủy
                  </Button>
                  <Button type="submit">
                    {editingInstrument ? "Cập Nhật" : "Lưu"}
                  </Button>
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
                <TableHead>Tên</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Số Sê-ri</TableHead>
                <TableHead>Vị Trí</TableHead>
                <TableHead>Trạng Thái</TableHead>
                <TableHead>Hiệu Chuẩn Kế Tiếp</TableHead>
                <TableHead className="text-right">Thao Tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instruments.length > 0 ? (
                instruments.map((instrument) => (
                  <TableRow key={instrument.id}>
                    <TableCell className="font-medium">
                      {instrument.name}
                    </TableCell>
                    <TableCell>{instrument.model}</TableCell>
                    <TableCell>{instrument.serialNumber}</TableCell>
                    <TableCell>{instrument.location}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(instrument.status)}
                        className="capitalize"
                      >
                        {instrument.status === "active"
                          ? "Hoạt động"
                          : instrument.status === "maintenance"
                          ? "Bảo trì"
                          : "Vô hiệu"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {instrument.nextCalibration
                        ? new Date(
                            instrument.nextCalibration
                          ).toLocaleDateString()
                        : "Chưa đặt"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(instrument)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(instrument.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    Không có dữ liệu thiết bị.
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