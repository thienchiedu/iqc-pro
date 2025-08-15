"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Filter, RotateCcw, Search } from "lucide-react"
import type { DateRange } from "react-day-picker"

export interface QCFilters {
  analyte: string
  level: string
  instrument_id: string
  lot_id: string
  dateRange: DateRange | undefined
  showViolationsOnly: boolean
  showTrend: boolean
  maxPoints: number
}

interface QCMonitorFiltersProps {
  filters: QCFilters
  onFiltersChange: (filters: QCFilters) => void
  onApplyFilters: () => void
  loading?: boolean
}

export function QCMonitorFilters({ filters, onFiltersChange, onApplyFilters, loading = false }: QCMonitorFiltersProps) {
  const handleFilterChange = (key: keyof QCFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  const resetFilters = () => {
    onFiltersChange({
      analyte: "",
      level: "",
      instrument_id: "",
      lot_id: "",
      dateRange: undefined,
      showViolationsOnly: false,
      showTrend: false,
      maxPoints: 100,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          QC Data Filters
        </CardTitle>
        <CardDescription>Filter and customize the QC data display</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="analyte">Analyte</Label>
            <Select value={filters.analyte} onValueChange={(value) => handleFilterChange("analyte", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All analytes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All analytes</SelectItem>
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
            <Label htmlFor="level">QC Level</Label>
            <Select value={filters.level} onValueChange={(value) => handleFilterChange("level", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All levels</SelectItem>
                <SelectItem value="L1">L1 (Low)</SelectItem>
                <SelectItem value="L2">L2 (Normal)</SelectItem>
                <SelectItem value="L3">L3 (High)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instrument_id">Instrument</Label>
            <Select value={filters.instrument_id} onValueChange={(value) => handleFilterChange("instrument_id", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All instruments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All instruments</SelectItem>
                <SelectItem value="COBAS_C311">Cobas C311</SelectItem>
                <SelectItem value="COBAS_C501">Cobas C501</SelectItem>
                <SelectItem value="ARCHITECT_C4000">Architect C4000</SelectItem>
                <SelectItem value="VITROS_5600">Vitros 5600</SelectItem>
                <SelectItem value="AU5800">AU5800</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lot_id">QC Lot ID</Label>
            <Input
              id="lot_id"
              value={filters.lot_id}
              onChange={(e) => handleFilterChange("lot_id", e.target.value)}
              placeholder="Enter lot ID"
            />
          </div>
        </div>

        <Separator />

        {/* Date Range and Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <DatePickerWithRange
                date={filters.dateRange}
                onDateChange={(dateRange) => handleFilterChange("dateRange", dateRange)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxPoints">Max Data Points</Label>
              <Select
                value={filters.maxPoints.toString()}
                onValueChange={(value) => handleFilterChange("maxPoints", Number.parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 points</SelectItem>
                  <SelectItem value="100">100 points</SelectItem>
                  <SelectItem value="200">200 points</SelectItem>
                  <SelectItem value="500">500 points</SelectItem>
                  <SelectItem value="1000">1000 points</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Display Options</Label>

              <div className="flex items-center justify-between">
                <Label htmlFor="showViolationsOnly" className="text-sm font-normal">
                  Show violations only
                </Label>
                <Switch
                  id="showViolationsOnly"
                  checked={filters.showViolationsOnly}
                  onCheckedChange={(checked) => handleFilterChange("showViolationsOnly", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showTrend" className="text-sm font-normal">
                  Show trend line
                </Label>
                <Switch
                  id="showTrend"
                  checked={filters.showTrend}
                  onCheckedChange={(checked) => handleFilterChange("showTrend", checked)}
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={onApplyFilters} disabled={loading} className="flex-1">
            <Search className="h-4 w-4 mr-2" />
            {loading ? "Loading..." : "Apply Filters"}
          </Button>
          <Button variant="outline" onClick={resetFilters} disabled={loading}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
