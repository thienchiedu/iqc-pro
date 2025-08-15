"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, CheckCircle, Clock, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Violation {
  id: string
  timestamp: string
  analyte: string
  level: string
  instrument: string
  lot: string
  violatedRules: string[]
  qcValue: number
  expectedRange: string
  severity: "warning" | "critical"
  status: "open" | "investigating" | "resolved"
  assignedTo: string
  description: string
  correctiveActions: CorrectiveAction[]
}

interface CorrectiveAction {
  id: string
  violationId: string
  action: string
  assignedTo: string
  dueDate: string
  status: "pending" | "in-progress" | "completed"
  notes: string
  completedDate?: string
  completedBy?: string
}

export function ViolationTracker() {
  const [violations, setViolations] = useState<Violation[]>([])
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null)
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)
  const [actionForm, setActionForm] = useState({
    action: "",
    assignedTo: "",
    dueDate: "",
    notes: "",
  })
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterSeverity, setFilterSeverity] = useState<string>("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchViolations()
  }, [])

  const fetchViolations = async () => {
    try {
      const response = await fetch("/api/violations")
      if (response.ok) {
        const data = await response.json()
        setViolations(data)
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách vi phạm",
        variant: "destructive",
      })
    }
  }

  const handleAddCorrectiveAction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedViolation) return

    const actionData = {
      id: crypto.randomUUID(),
      violationId: selectedViolation.id,
      ...actionForm,
      status: "pending" as const,
    }

    try {
      const response = await fetch("/api/violations/corrective-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(actionData),
      })

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Đã thêm hành động khắc phục thành công",
        })
        fetchViolations()
        setActionForm({ action: "", assignedTo: "", dueDate: "", notes: "" })
        setIsActionDialogOpen(false)
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thêm hành động khắc phục",
        variant: "destructive",
      })
    }
  }

  const handleUpdateViolationStatus = async (violationId: string, status: string) => {
    try {
      const response = await fetch(`/api/violations/${violationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Đã cập nhật trạng thái vi phạm thành công",
        })
        fetchViolations()
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái vi phạm",
        variant: "destructive",
      })
    }
  }

  const handleCompleteAction = async (actionId: string) => {
    try {
      const response = await fetch(`/api/violations/corrective-actions/${actionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          completedDate: new Date().toISOString(),
          completedBy: "Current User",
        }),
      })

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Đã đánh dấu hành động khắc phục hoàn thành",
        })
        fetchViolations()
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể hoàn thành hành động",
        variant: "destructive",
      })
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive"
      case "warning":
        return "secondary"
      default:
        return "default"
    }
  }

  const getActionStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "in-progress":
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
    }
  }

  const filteredViolations = violations.filter((violation) => {
    if (filterStatus !== "all" && violation.status !== filterStatus) return false
    if (filterSeverity !== "all" && violation.severity !== filterSeverity) return false
    return true
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Vi Phạm QC
          </CardTitle>
          <CardDescription>Theo dõi và quản lý vi phạm kiểm soát chất lượng và hành động khắc phục</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div>
              <Label htmlFor="status-filter">Trạng Thái</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất Cả Trạng Thái</SelectItem>
                  <SelectItem value="open">Mở</SelectItem>
                  <SelectItem value="investigating">Đang Điều Tra</SelectItem>
                  <SelectItem value="resolved">Đã Giải Quyết</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="severity-filter">Mức Độ</Label>
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất Cả Mức Độ</SelectItem>
                  <SelectItem value="warning">Cảnh Báo</SelectItem>
                  <SelectItem value="critical">Nghiêm Trọng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời Gian</TableHead>
                <TableHead>Analyte/Mức</TableHead>
                <TableHead>Thiết Bị</TableHead>
                <TableHead>Quy Tắc Vi Phạm</TableHead>
                <TableHead>Mức Độ</TableHead>
                <TableHead>Trạng Thái</TableHead>
                <TableHead>Hành Động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredViolations.map((violation) => (
                <TableRow key={violation.id}>
                  <TableCell>{new Date(violation.timestamp).toLocaleString("vi-VN")}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{violation.analyte}</div>
                      <div className="text-sm text-muted-foreground">{violation.level}</div>
                    </div>
                  </TableCell>
                  <TableCell>{violation.instrument}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {violation.violatedRules.map((rule) => (
                        <Badge key={rule} variant="outline" className="text-xs">
                          {rule}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getSeverityColor(violation.severity)}>
                      {violation.severity === "critical" ? "Nghiêm Trọng" : "Cảnh Báo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={violation.status}
                      onValueChange={(value) => handleUpdateViolationStatus(violation.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Mở</SelectItem>
                        <SelectItem value="investigating">Đang Điều Tra</SelectItem>
                        <SelectItem value="resolved">Đã Giải Quyết</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedViolation(violation)
                        setIsActionDialogOpen(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Hành Động
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedViolation && (
        <Card>
          <CardHeader>
            <CardTitle>Chi Tiết Vi Phạm</CardTitle>
            <CardDescription>
              {selectedViolation.analyte} - {selectedViolation.level} trên {selectedViolation.instrument}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="details" className="w-full">
              <TabsList>
                <TabsTrigger value="details">Chi Tiết</TabsTrigger>
                <TabsTrigger value="actions">Hành Động Khắc Phục</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Giá Trị QC</Label>
                    <p className="text-sm">{selectedViolation.qcValue}</p>
                  </div>
                  <div>
                    <Label>Khoảng Mong Đợi</Label>
                    <p className="text-sm">{selectedViolation.expectedRange}</p>
                  </div>
                  <div>
                    <Label>Số Lô</Label>
                    <p className="text-sm">{selectedViolation.lot}</p>
                  </div>
                  <div>
                    <Label>Được Giao Cho</Label>
                    <p className="text-sm">{selectedViolation.assignedTo}</p>
                  </div>
                </div>
                <div>
                  <Label>Mô Tả</Label>
                  <p className="text-sm">{selectedViolation.description}</p>
                </div>
              </TabsContent>
              <TabsContent value="actions" className="space-y-4">
                <div className="space-y-4">
                  {selectedViolation.correctiveActions.map((action) => (
                    <Card key={action.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getActionStatusIcon(action.status)}
                              <span className="font-medium">{action.action}</span>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Được giao cho: {action.assignedTo}</p>
                              <p>Hạn: {new Date(action.dueDate).toLocaleDateString("vi-VN")}</p>
                              {action.notes && <p>Ghi chú: {action.notes}</p>}
                              {action.completedDate && (
                                <p>
                                  Hoàn thành: {new Date(action.completedDate).toLocaleDateString("vi-VN")} bởi{" "}
                                  {action.completedBy}
                                </p>
                              )}
                            </div>
                          </div>
                          {action.status !== "completed" && (
                            <Button variant="outline" size="sm" onClick={() => handleCompleteAction(action.id)}>
                              Đánh Dấu Hoàn Thành
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm Hành Động Khắc Phục</DialogTitle>
            <DialogDescription>Định nghĩa hành động khắc phục cho vi phạm này</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCorrectiveAction} className="space-y-4">
            <div>
              <Label htmlFor="action">Mô Tả Hành Động</Label>
              <Textarea
                id="action"
                value={actionForm.action}
                onChange={(e) => setActionForm({ ...actionForm, action: e.target.value })}
                required
                rows={3}
                placeholder="Nhập mô tả hành động khắc phục..."
              />
            </div>
            <div>
              <Label htmlFor="assignedTo">Giao Cho</Label>
              <Input
                id="assignedTo"
                value={actionForm.assignedTo}
                onChange={(e) => setActionForm({ ...actionForm, assignedTo: e.target.value })}
                required
                placeholder="Tên người được giao..."
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Ngày Hạn</Label>
              <Input
                id="dueDate"
                type="date"
                value={actionForm.dueDate}
                onChange={(e) => setActionForm({ ...actionForm, dueDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="notes">Ghi Chú</Label>
              <Textarea
                id="notes"
                value={actionForm.notes}
                onChange={(e) => setActionForm({ ...actionForm, notes: e.target.value })}
                rows={2}
                placeholder="Ghi chú thêm..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsActionDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit">Thêm Hành Động</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
