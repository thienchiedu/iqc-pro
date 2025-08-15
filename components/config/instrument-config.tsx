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
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Edit, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

export function InstrumentConfig() {
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingInstrument, setEditingInstrument] = useState<Instrument | null>(null)
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

  useEffect(() => {
    fetchInstruments()
  }, [])

  const fetchInstruments = async () => {
    try {
      const response = await fetch("/api/config/instruments")
      if (response.ok) {
        const data = await response.json()
        setInstruments(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch instruments",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const instrumentData = {
      id: editingInstrument?.id || crypto.randomUUID(),
      ...formData,
    }

    try {
      const response = await fetch("/api/config/instruments", {
        method: editingInstrument ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(instrumentData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Instrument ${editingInstrument ? "updated" : "created"} successfully`,
        })
        fetchInstruments()
        resetForm()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save instrument",
        variant: "destructive",
      })
    }
  }

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

  const handleEdit = (instrument: Instrument) => {
    setEditingInstrument(instrument)
    setFormData({
      name: instrument.name,
      model: instrument.model,
      serialNumber: instrument.serialNumber,
      manufacturer: instrument.manufacturer,
      location: instrument.location,
      status: instrument.status,
      installDate: instrument.installDate,
      lastCalibration: instrument.lastCalibration,
      nextCalibration: instrument.nextCalibration,
      notes: instrument.notes,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this instrument?")) return

    try {
      const response = await fetch(`/api/config/instruments/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Instrument deleted successfully",
        })
        fetchInstruments()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete instrument",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "maintenance":
        return "secondary"
      case "inactive":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Instrument Configuration</CardTitle>
            <CardDescription>Manage laboratory instruments and their maintenance schedules</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Instrument
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingInstrument ? "Edit Instrument" : "Add New Instrument"}</DialogTitle>
                <DialogDescription>Configure instrument details and maintenance information</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Instrument Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="serialNumber">Serial Number</Label>
                    <Input
                      id="serialNumber"
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Input
                      id="manufacturer"
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="installDate">Install Date</Label>
                    <Input
                      id="installDate"
                      type="date"
                      value={formData.installDate}
                      onChange={(e) => setFormData({ ...formData, installDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastCalibration">Last Calibration</Label>
                    <Input
                      id="lastCalibration"
                      type="date"
                      value={formData.lastCalibration}
                      onChange={(e) => setFormData({ ...formData, lastCalibration: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nextCalibration">Next Calibration</Label>
                    <Input
                      id="nextCalibration"
                      type="date"
                      value={formData.nextCalibration}
                      onChange={(e) => setFormData({ ...formData, nextCalibration: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingInstrument ? "Update" : "Create"} Instrument</Button>
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
              <TableHead>Model</TableHead>
              <TableHead>Serial Number</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Next Calibration</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {instruments.map((instrument) => (
              <TableRow key={instrument.id}>
                <TableCell className="font-medium">{instrument.name}</TableCell>
                <TableCell>{instrument.model}</TableCell>
                <TableCell>{instrument.serialNumber}</TableCell>
                <TableCell>{instrument.location}</TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(instrument.status)}>{instrument.status}</Badge>
                </TableCell>
                <TableCell>{instrument.nextCalibration || "Not set"}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(instrument)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(instrument.id)}>
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
