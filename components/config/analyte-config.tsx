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
import { Trash2, Edit, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Định nghĩa kiểu dữ liệu cho một analyte
interface Analyte {
  id: string
  name: string
  unit: string
  category: string
  normalRange: {
    min: number
    max: number
  }
  criticalRange: {
    min: number
    max: number
  }
  decimalPlaces: number
  isActive: boolean
}

// Component chính cho cấu hình analyte
export function AnalyteConfig() {
  const [analytes, setAnalytes] = useState<Analyte[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAnalyte, setEditingAnalyte] = useState<Analyte | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    unit: "",
    category: "",
    normalMin: "",
    normalMax: "",
    criticalMin: "",
    criticalMax: "",
    decimalPlaces: "2",
  })
  const { toast } = useToast()

  // Fetch dữ liệu analytes khi component được mount
  useEffect(() => {
    fetchAnalytes()
  }, [])

  // Hàm fetch dữ liệu analytes từ API
  const fetchAnalytes = async () => {
    try {
      const response = await fetch("/api/config/analytes")
      if (response.ok) {
        const data = await response.json()
        setAnalytes(data)
      } else {
        throw new Error("Failed to fetch analytes")
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách chất phân tích.",
        variant: "destructive",
      })
    }
  }

  // Xử lý việc submit form (thêm mới hoặc cập nhật)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const analyteData = {
      id: editingAnalyte?.id || crypto.randomUUID(),
      name: formData.name,
      unit: formData.unit,
      category: formData.category,
      normalRange: {
        min: Number.parseFloat(formData.normalMin),
        max: Number.parseFloat(formData.normalMax),
      },
      criticalRange: {
        min: Number.parseFloat(formData.criticalMin),
        max: Number.parseFloat(formData.criticalMax),
      },
      decimalPlaces: Number.parseInt(formData.decimalPlaces),
      isActive: true,
    }

    try {
      const url = editingAnalyte
        ? `/api/config/analytes/${editingAnalyte.id}`
        : "/api/config/analytes"
      const method = editingAnalyte ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analyteData),
      })

      if (response.ok) {
        toast({
          title: "Thành công",
          description: `Chất phân tích đã được ${
            editingAnalyte ? "cập nhật" : "tạo"
          } thành công.`,
        })
        fetchAnalytes()
        resetForm()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to save analyte")
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu chất phân tích.",
        variant: "destructive",
      })
    }
  }

  // Reset form và đóng dialog
  const resetForm = () => {
    setFormData({
      name: "",
      unit: "",
      category: "",
      normalMin: "",
      normalMax: "",
      criticalMin: "",
      criticalMax: "",
      decimalPlaces: "2",
    })
    setEditingAnalyte(null)
    setIsDialogOpen(false)
  }

  // Chuẩn bị form để chỉnh sửa
  const handleEdit = (analyte: Analyte) => {
    setEditingAnalyte(analyte)
    setFormData({
      name: analyte.name,
      unit: analyte.unit,
      category: analyte.category,
      normalMin: analyte.normalRange.min.toString(),
      normalMax: analyte.normalRange.max.toString(),
      criticalMin: analyte.criticalRange.min.toString(),
      criticalMax: analyte.criticalRange.max.toString(),
      decimalPlaces: analyte.decimalPlaces.toString(),
    })
    setIsDialogOpen(true)
  }

  // Xử lý việc xóa analyte
  const handleDelete = async (id: string) => {
    // Nên có một dialog xác nhận ở đây trong ứng dụng thực tế
    if (!confirm("Bạn có chắc chắn muốn xóa chất phân tích này?")) return

    try {
      const response = await fetch(`/api/config/analytes/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Đã xóa chất phân tích thành công.",
        })
        fetchAnalytes()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete analyte")
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa chất phân tích.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cấu Hình Chất Phân Tích</CardTitle>
            <CardDescription>
              Quản lý các chất phân tích, đơn vị và khoảng tham chiếu được sử
              dụng trong hệ thống.
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm Chất Phân Tích
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingAnalyte
                    ? "Chỉnh Sửa Chất Phân Tích"
                    : "Thêm Chất Phân Tích Mới"}
                </DialogTitle>
                <DialogDescription>
                  Điền thông tin chi tiết để thêm hoặc cập nhật một chất phân
                  tích.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tên Chất Phân Tích</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Vd: Glucose"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Đơn Vị</Label>
                    <Input
                      id="unit"
                      value={formData.unit}
                      onChange={(e) =>
                        setFormData({ ...formData, unit: e.target.value })
                      }
                      placeholder="Vd: mg/dL"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Danh Mục</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Chọn một danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chemistry">Hóa sinh</SelectItem>
                      <SelectItem value="hematology">Huyết học</SelectItem>
                      <SelectItem value="immunology">Miễn dịch</SelectItem>
                      <SelectItem value="microbiology">Vi sinh</SelectItem>
                      <SelectItem value="coagulation">Đông máu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Khoảng Bình Thường</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="any"
                        value={formData.normalMin}
                        onChange={(e) =>
                          setFormData({ ...formData, normalMin: e.target.value })
                        }
                        placeholder="Tối thiểu"
                        required
                      />
                      <span>-</span>
                      <Input
                        type="number"
                        step="any"
                        value={formData.normalMax}
                        onChange={(e) =>
                          setFormData({ ...formData, normalMax: e.target.value })
                        }
                        placeholder="Tối đa"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Khoảng Nguy Hiểm</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="any"
                        value={formData.criticalMin}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            criticalMin: e.target.value,
                          })
                        }
                        placeholder="Tối thiểu"
                        required
                      />
                      <span>-</span>
                      <Input
                        type="number"
                        step="any"
                        value={formData.criticalMax}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            criticalMax: e.target.value,
                          })
                        }
                        placeholder="Tối đa"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="decimalPlaces">Số Chữ Số Thập Phân</Label>
                  <Select
                    value={formData.decimalPlaces}
                    onValueChange={(value) =>
                      setFormData({ ...formData, decimalPlaces: value })
                    }
                  >
                    <SelectTrigger id="decimalPlaces">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                    </SelectContent>
                  </Select>
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
                    {editingAnalyte ? "Cập Nhật" : "Lưu"}
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
                <TableHead>Đơn Vị</TableHead>
                <TableHead>Danh Mục</TableHead>
                <TableHead>Khoảng Bình Thường</TableHead>
                <TableHead>Trạng Thái</TableHead>
                <TableHead className="text-right">Thao Tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytes.length > 0 ? (
                analytes.map((analyte) => (
                  <TableRow key={analyte.id}>
                    <TableCell className="font-medium">{analyte.name}</TableCell>
                    <TableCell>{analyte.unit}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{analyte.category}</Badge>
                    </TableCell>
                    <TableCell>
                      {analyte.normalRange.min} - {analyte.normalRange.max}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={analyte.isActive ? "default" : "destructive"}
                      >
                        {analyte.isActive ? "Hoạt động" : "Vô hiệu"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(analyte)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(analyte.id)}
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
                    Không có dữ liệu chất phân tích.
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