"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Download, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ViolationStats {
  totalViolations: number
  openViolations: number
  resolvedViolations: number
  criticalViolations: number
  averageResolutionTime: number
  violationsByAnalyte: Array<{ name: string; count: number }>
  violationsByRule: Array<{ name: string; count: number }>
  violationsTrend: Array<{ date: string; count: number }>
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export function ViolationReports() {
  const [stats, setStats] = useState<ViolationStats | null>(null)
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date(),
  })
  const [selectedAnalyte, setSelectedAnalyte] = useState<string>("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchViolationStats()
  }, [dateRange, selectedAnalyte])

  const fetchViolationStats = async () => {
    try {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        analyte: selectedAnalyte,
      })

      const response = await fetch(`/api/violations/stats?${params}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch violation statistics",
        variant: "destructive",
      })
    }
  }

  const handleExportReport = async () => {
    try {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        analyte: selectedAnalyte,
      })

      const response = await fetch(`/api/violations/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `violation-report-${dateRange.from.toISOString().split("T")[0]}-to-${
          dateRange.to.toISOString().split("T")[0]
        }.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Success",
          description: "Violation report exported successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive",
      })
    }
  }

  if (!stats) {
    return <div>Loading violation statistics...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Violation Reports & Analytics
              </CardTitle>
              <CardDescription>Analyze violation patterns and trends</CardDescription>
            </div>
            <div className="flex gap-2">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              <Select value={selectedAnalyte} onValueChange={setSelectedAnalyte}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Analytes</SelectItem>
                  <SelectItem value="glucose">Glucose</SelectItem>
                  <SelectItem value="cholesterol">Cholesterol</SelectItem>
                  <SelectItem value="hemoglobin">Hemoglobin</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleExportReport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalViolations}</p>
                    <p className="text-sm text-muted-foreground">Total Violations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.openViolations}</p>
                    <p className="text-sm text-muted-foreground">Open Violations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.resolvedViolations}</p>
                    <p className="text-sm text-muted-foreground">Resolved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.criticalViolations}</p>
                    <p className="text-sm text-muted-foreground">Critical</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Violations by Analyte</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.violationsByAnalyte}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Violations by Westgard Rule</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.violationsByRule}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {stats.violationsByRule.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Violation Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.violationsTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Key Insights</h3>
            <div className="space-y-2 text-sm">
              <p>
                • Average resolution time: <Badge variant="secondary">{stats.averageResolutionTime} hours</Badge>
              </p>
              <p>
                • Resolution rate:{" "}
                <Badge variant="secondary">
                  {((stats.resolvedViolations / stats.totalViolations) * 100).toFixed(1)}%
                </Badge>
              </p>
              <p>
                • Most violated rule:{" "}
                <Badge variant="secondary">
                  {stats.violationsByRule.length > 0 ? stats.violationsByRule[0].name : "N/A"}
                </Badge>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
