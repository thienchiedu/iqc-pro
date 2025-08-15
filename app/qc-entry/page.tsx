"use client"

import { useState } from "react"
import { QCEntryForm, type QCEntryData } from "@/components/qc/qc-entry-form"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Header } from "@/components/layout/header"
import { BackButton } from "@/components/ui/back-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"

interface QCResult {
  z: number
  violations: any[]
  status: "in-control" | "warning" | "reject"
  message: string
}

export default function QCEntryPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QCResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: QCEntryData) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/qc/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        setResult(result)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to process QC data")
      }
    } catch (error) {
      console.error("QC submission error:", error)
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "in-control":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case "reject":
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-control":
        return "bg-green-100 text-green-800 border-green-200"
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "reject":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />

        <div className="container mx-auto px-4 pt-4">
          <BackButton />
        </div>

        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Nhập dữ liệu QC</h1>
            <p className="text-muted-foreground">
              Nhập các phép đo kiểm soát chất lượng để phân tích theo quy tắc Westgard
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Entry Form */}
            <div className="lg:col-span-2">
              <QCEntryForm onSubmit={handleSubmit} loading={loading} />
            </div>

            {/* Results Panel */}
            <div className="space-y-6">
              {/* Current Result */}
              {result && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      Kết Quả Phân Tích
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Trạng Thái:</span>
                      <Badge className={getStatusColor(result.status)}>{result.status.toUpperCase()}</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Điểm Z:</span>
                      <span className={`font-mono ${Math.abs(result.z) >= 2 ? "text-red-600" : "text-green-600"}`}>
                        {result.z.toFixed(3)}
                      </span>
                    </div>

                    {result.violations.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium">Vi Phạm:</span>
                        <div className="space-y-1">
                          {result.violations.map((violation, index) => (
                            <div key={index} className="text-xs bg-red-50 p-2 rounded border border-red-200">
                              <div className="font-medium text-red-800">{violation.rule}</div>
                              <div className="text-red-600">{violation.message}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-sm text-muted-foreground">{result.message}</div>
                  </CardContent>
                </Card>
              )}

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>Hướng Dẫn</CardTitle>
                  <CardDescription>Hướng dẫn nhập dữ liệu QC</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <strong>Trường Bắt Buộc:</strong>
                    <ul className="list-disc list-inside mt-1 text-muted-foreground">
                      <li>Chất phân tích và Mức QC</li>
                      <li>Thiết bị và ID Lô</li>
                      <li>Giá trị Đo</li>
                      <li>ID Run</li>
                    </ul>
                  </div>

                  <div>
                    <strong>Ý Nghĩa Trạng Thái:</strong>
                    <ul className="list-disc list-inside mt-1 text-muted-foreground">
                      <li>
                        <strong>Trong Kiểm Soát:</strong> Trong giới hạn chấp nhận được
                      </li>
                      <li>
                        <strong>Cảnh Báo:</strong> Tiến gần giới hạn kiểm soát
                      </li>
                      <li>
                        <strong>Từ Chối:</strong> Vi phạm quy tắc Westgard
                      </li>
                    </ul>
                  </div>

                  <div>
                    <strong>Giải Thích Điểm Z:</strong>
                    <ul className="list-disc list-inside mt-1 text-muted-foreground">
                      <li>|z| &lt; 2: Thường chấp nhận được</li>
                      <li>|z| ≥ 2: Mức cảnh báo</li>
                      <li>|z| ≥ 3: Mức từ chối</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
