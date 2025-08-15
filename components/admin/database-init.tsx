"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Database, CheckCircle, XCircle } from "lucide-react"

export function DatabaseInitializer() {
  const [isInitializing, setIsInitializing] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)

  const handleInitialize = async () => {
    setIsInitializing(true)
    setResult(null)

    try {
      console.log("[v0] Starting database initialization...")
      const response = await fetch("/api/admin/init-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      console.log("[v0] Database initialization response:", data)
      setResult(data)
    } catch (error) {
      console.error("[v0] Database initialization error:", error)
      setResult({ success: false, error: error.message })
    } finally {
      setIsInitializing(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Initialization
        </CardTitle>
        <CardDescription>Initialize the Google Sheets database with required tables and sample data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>This will create the following sheets in your Google Spreadsheet:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>
              <strong>qc_points</strong> - QC measurement data
            </li>
            <li>
              <strong>qc_limits</strong> - Statistical control limits
            </li>
            <li>
              <strong>westgard_config</strong> - Westgard rule configurations
            </li>
            <li>
              <strong>violations</strong> - QC rule violations
            </li>
            <li>
              <strong>users</strong> - User authentication data
            </li>
          </ul>
        </div>

        <Button onClick={handleInitialize} disabled={isInitializing} className="w-full">
          {isInitializing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Initializing Database...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Initialize Database
            </>
          )}
        </Button>

        {result && (
          <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
                {result.success ? result.message : result.error}
              </AlertDescription>
            </div>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
