"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { WestgardRulesEngine, type QCPointForRules, type WestgardRuleResult } from "@/lib/westgard-rules"
import { TestTube, Play, RotateCcw, AlertTriangle, CheckCircle } from "lucide-react"

interface RuleConfig {
  enable_1_2s_warning: boolean
  enable_1_3s_reject: boolean
  enable_2_2s_within_run_reject: boolean
  enable_2_2s_across_runs_reject: boolean
  enable_R_4s_within_run_reject: boolean
  enable_4_1s_reject: boolean
  enable_10x_reject: boolean
}

export function RuleTester() {
  const [testData, setTestData] = useState<string>("")
  const [ruleConfig, setRuleConfig] = useState<RuleConfig>({
    enable_1_2s_warning: true,
    enable_1_3s_reject: true,
    enable_2_2s_within_run_reject: true,
    enable_2_2s_across_runs_reject: true,
    enable_R_4s_within_run_reject: true,
    enable_4_1s_reject: true,
    enable_10x_reject: true,
  })
  const [mean, setMean] = useState<number>(100)
  const [sd, setSd] = useState<number>(5)
  const [results, setResults] = useState<WestgardRuleResult[]>([])
  const [testPoints, setTestPoints] = useState<QCPointForRules[]>([])
  const [error, setError] = useState<string | null>(null)

  const parseTestData = (data: string): number[] => {
    return data
      .split(/[,\s\n]+/)
      .map((val) => val.trim())
      .filter((val) => val !== "")
      .map((val) => Number.parseFloat(val))
      .filter((val) => !Number.isNaN(val))
  }

  const runTest = () => {
    setError(null)
    setResults([])

    try {
      const values = parseTestData(testData)
      if (values.length === 0) {
        setError("Please enter valid numeric data points")
        return
      }

      // Convert values to QC points with Z-scores
      const points: QCPointForRules[] = values.map((value, index) => ({
        id: index,
        value,
        z: WestgardRulesEngine.calculateZScore(value, mean, sd),
        level: "L1", // Default level for testing
        timestamp: new Date(Date.now() + index * 60000).toISOString(), // 1 minute apart
        run_id: `RUN${Math.floor(index / 2) + 1}`, // 2 points per run
      }))

      setTestPoints(points)

      // Test each point against rules
      const allResults: WestgardRuleResult[] = []

      points.forEach((currentPoint, index) => {
        const historicalPoints = points.slice(0, index)
        const violations = WestgardRulesEngine.evaluatePoint(currentPoint, historicalPoints, ruleConfig)

        if (violations.length > 0) {
          allResults.push(
            ...violations.map(
              (v) =>
                ({
                  ...v,
                  pointIndex: index,
                  pointValue: currentPoint.value,
                  pointZ: currentPoint.z,
                }) as any,
            ),
          )
        }
      })

      setResults(allResults)
    } catch (error) {
      console.error("Test error:", error)
      setError("Error running test. Please check your data.")
    }
  }

  const generateSampleData = (type: "normal" | "1_3s" | "2_2s" | "R_4s" | "4_1s" | "10x") => {
    let sampleValues: number[] = []

    switch (type) {
      case "normal":
        sampleValues = [98, 102, 99, 101, 100, 103, 97, 99, 101, 98]
        break
      case "1_3s":
        sampleValues = [98, 102, 99, 101, 100, 116, 97, 99, 101, 98] // 116 is >3SD
        break
      case "2_2s":
        sampleValues = [98, 102, 99, 101, 111, 112, 97, 99, 101, 98] // Two consecutive >2SD
        break
      case "R_4s":
        sampleValues = [98, 102, 99, 101, 112, 88, 97, 99, 101, 98] // Range >4SD in same run
        break
      case "4_1s":
        sampleValues = [98, 102, 106, 107, 108, 109, 97, 99, 101, 98] // Four consecutive >1SD
        break
      case "10x":
        sampleValues = [102, 103, 101, 104, 103, 102, 101, 103, 102, 104] // Ten consecutive same side
        break
    }

    setTestData(sampleValues.join(", "))
  }

  const getRuleDescription = (rule: string): string => {
    const descriptions: Record<string, string> = {
      "1_3s": "Single point beyond ±3SD - Immediate rejection",
      "2_2s_within": "Two points in same run, same side, both ≥±2SD",
      "2_2s_across": "Two consecutive points same level, same side, both ≥±2SD",
      R_4s: "Two points in same run with opposite signs, range ≥4SD",
      "4_1s": "Four consecutive points same side, all >1SD",
      "10x": "Ten consecutive points same side of mean",
      "1_2s": "Single point ≥±2SD - Warning only",
    }
    return descriptions[rule] || rule
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Westgard Rules Tester
          </CardTitle>
          <CardDescription>Test and validate Westgard rules implementation with custom data sets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Control Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mean">Control Mean</Label>
              <Input
                id="mean"
                type="number"
                step="0.01"
                value={mean}
                onChange={(e) => setMean(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sd">Control SD</Label>
              <Input id="sd" type="number" step="0.01" value={sd} onChange={(e) => setSd(Number(e.target.value))} />
            </div>
          </div>

          {/* Rule Configuration */}
          <div className="space-y-4">
            <h4 className="font-medium">Rule Configuration</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(ruleConfig).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={key} className="text-sm">
                    {key
                      .replace(/enable_|_reject|_warning/g, "")
                      .replace(/_/g, " ")
                      .toUpperCase()}
                  </Label>
                  <Switch
                    id={key}
                    checked={value}
                    onCheckedChange={(checked) => setRuleConfig((prev) => ({ ...prev, [key]: checked }))}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Test Data Input */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="testData">Test Data (comma or space separated)</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => generateSampleData("normal")}>
                  Normal
                </Button>
                <Button variant="outline" size="sm" onClick={() => generateSampleData("1_3s")}>
                  1₃s
                </Button>
                <Button variant="outline" size="sm" onClick={() => generateSampleData("2_2s")}>
                  2₂s
                </Button>
                <Button variant="outline" size="sm" onClick={() => generateSampleData("R_4s")}>
                  R₄s
                </Button>
                <Button variant="outline" size="sm" onClick={() => generateSampleData("4_1s")}>
                  4₁s
                </Button>
                <Button variant="outline" size="sm" onClick={() => generateSampleData("10x")}>
                  10x
                </Button>
              </div>
            </div>
            <Textarea
              id="testData"
              value={testData}
              onChange={(e) => setTestData(e.target.value)}
              placeholder="Enter test values: 98, 102, 99, 101, 100, 116, 97, 99, 101, 98"
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={runTest} className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              Run Test
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setTestData("")
                setResults([])
                setTestPoints([])
                setError(null)
              }}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Test Results */}
      {testPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Analysis of {testPoints.length} data points with current rule configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{testPoints.length}</div>
                <div className="text-sm text-blue-600">Total Points</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">{results.length}</div>
                <div className="text-sm text-red-600">Rule Violations</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">{testPoints.length - results.length}</div>
                <div className="text-sm text-green-600">In-Control Points</div>
              </div>
            </div>

            {/* Data Points Table */}
            <div className="space-y-2">
              <h4 className="font-medium">Data Points Analysis</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Point</th>
                      <th className="text-left p-2">Value</th>
                      <th className="text-left p-2">Z-Score</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Violations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testPoints.map((point, index) => {
                      const pointViolations = results.filter((r: any) => r.pointIndex === index)
                      const hasViolations = pointViolations.length > 0

                      return (
                        <tr key={index} className="border-b">
                          <td className="p-2">{index + 1}</td>
                          <td className="p-2 font-mono">{point.value.toFixed(2)}</td>
                          <td className="p-2 font-mono">
                            <span className={Math.abs(point.z) >= 2 ? "text-red-600" : "text-green-600"}>
                              {point.z.toFixed(3)}
                            </span>
                          </td>
                          <td className="p-2">
                            {hasViolations ? (
                              <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Violation
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                In-Control
                              </Badge>
                            )}
                          </td>
                          <td className="p-2">
                            {pointViolations.map((violation, vIndex) => (
                              <Badge key={vIndex} variant="outline" className="mr-1 mb-1">
                                {violation.rule}
                              </Badge>
                            ))}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Violations Details */}
            {results.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Violation Details</h4>
                <div className="space-y-2">
                  {results.map((result, index) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="destructive">{result.rule}</Badge>
                        <span className="text-sm text-muted-foreground">Point {(result as any).pointIndex + 1}</span>
                      </div>
                      <p className="text-sm text-red-700">{result.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{getRuleDescription(result.rule)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
