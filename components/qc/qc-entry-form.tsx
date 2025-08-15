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

    if (!formData.analyte) newErrors.push("Analyte is required")
    if (!formData.level) newErrors.push("Level is required")
    if (!formData.instrument_id) newErrors.push("Instrument is required")
    if (!formData.lot_id) newErrors.push("Lot ID is required")
    if (!formData.value || formData.value <= 0) newErrors.push("Valid value is required")
    if (!formData.run_id) newErrors.push("Run ID is required")

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
          QC Data Entry
        </CardTitle>
        <CardDescription>Enter quality control measurement data for analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Test Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="analyte">Analyte *</Label>
              <Select value={formData.analyte} onValueChange={(value) => handleInputChange("analyte", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select analyte" />
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
              <Label htmlFor="level">QC Level *</Label>
              <Select value={formData.level} onValueChange={(value) => handleInputChange("level", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L1">L1 (Low)</SelectItem>
                  <SelectItem value="L2">L2 (Normal)</SelectItem>
                  <SelectItem value="L3">L3 (High)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Instrument and Lot */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instrument_id">Instrument *</Label>
              <Select
                value={formData.instrument_id}
                onValueChange={(value) => handleInputChange("instrument_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select instrument" />
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
              <Label htmlFor="lot_id">QC Lot ID *</Label>
              <Input
                id="lot_id"
                value={formData.lot_id}
                onChange={(e) => handleInputChange("lot_id", e.target.value)}
                placeholder="Enter lot ID"
              />
            </div>
          </div>

          {/* Measurement Value */}
          <div className="space-y-2">
            <Label htmlFor="value">Measured Value *</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              value={formData.value || ""}
              onChange={(e) => handleInputChange("value", e.target.value)}
              placeholder="Enter measured value"
            />
          </div>

          {/* Run Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="run_id">Run ID *</Label>
              <Input
                id="run_id"
                value={formData.run_id}
                onChange={(e) => handleInputChange("run_id", e.target.value)}
                placeholder="e.g., RUN001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shift">Shift</Label>
              <Select value={formData.shift} onValueChange={(value) => handleInputChange("shift", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Shift A (Morning)</SelectItem>
                  <SelectItem value="B">Shift B (Afternoon)</SelectItem>
                  <SelectItem value="C">Shift C (Night)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timestamp">Date & Time</Label>
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
              <Label htmlFor="operator">Operator</Label>
              <Input
                id="operator"
                value={formData.operator}
                onChange={(e) => handleInputChange("operator", e.target.value)}
                placeholder="Operator name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Comment</Label>
              <Textarea
                id="comment"
                value={formData.comment}
                onChange={(e) => handleInputChange("comment", e.target.value)}
                placeholder="Optional comment"
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
              Clear
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Submit QC Data"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
