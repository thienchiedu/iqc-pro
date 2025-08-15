"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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

  useEffect(() => {
    fetchAnalytes()
  }, [])

  const fetchAnalytes = async () => {
    try {
      const response = await fetch("/api/config/analytes")
      if (response.ok) {
        const data = await response.json()
        setAnalytes(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch analytes",
        variant: "destructive",
      })
    }
  }

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
      const response = await fetch("/api/config/analytes", {
        method: editingAnalyte ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analyteData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Analyte ${editingAnalyte ? "updated" : "created"} successfully`,
        })
        fetchAnalytes()
        resetForm()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save analyte",
        variant: "destructive",
      })
    }
  }

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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this analyte?")) return

    try {
      const response = await fetch(`/api/config/analytes/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Analyte deleted successfully",
        })
        fetchAnalytes()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete analyte",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Analyte Configuration</CardTitle>
            <CardDescription>Manage analytes, their units, and reference ranges</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Analyte
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingAnalyte ? "Edit Analyte" : "Add New Analyte"}</DialogTitle>
                <DialogDescription>Configure analyte parameters and reference ranges</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Analyte Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chemistry">Chemistry</SelectItem>
                      <SelectItem value="hematology">Hematology</SelectItem>
                      <SelectItem value="immunology">Immunology</SelectItem>
                      <SelectItem value="microbiology">Microbiology</SelectItem>
                      <SelectItem value="coagulation">Coagulation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Normal Range</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Min"
                        type="number"
                        step="any"
                        value={formData.normalMin}
                        onChange={(e) => setFormData({ ...formData, normalMin: e.target.value })}
                        required
                      />
                      <Input
                        placeholder="Max"
                        type="number"
                        step="any"
                        value={formData.normalMax}
                        onChange={(e) => setFormData({ ...formData, normalMax: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Critical Range</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Min"
                        type="number"
                        step="any"
                        value={formData.criticalMin}
                        onChange={(e) => setFormData({ ...formData, criticalMin: e.target.value })}
                        required
                      />
                      <Input
                        placeholder="Max"
                        type="number"
                        step="any"
                        value={formData.criticalMax}
                        onChange={(e) => setFormData({ ...formData, criticalMax: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="decimalPlaces">Decimal Places</Label>
                  <Select
                    value={formData.decimalPlaces}
                    onValueChange={(value) => setFormData({ ...formData, decimalPlaces: value })}
                  >
                    <SelectTrigger>
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
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingAnalyte ? "Update" : "Create"} Analyte</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Normal Range</TableHead>
              <TableHead>Critical Range</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analytes.map((analyte) => (
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
                  {analyte.criticalRange.min} - {analyte.criticalRange.max}
                </TableCell>
                <TableCell>
                  <Badge variant={analyte.isActive ? "default" : "secondary"}>
                    {analyte.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(analyte)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(analyte.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
