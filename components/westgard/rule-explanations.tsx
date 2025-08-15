"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { BookOpen, AlertTriangle, XCircle, TrendingUp, BarChart3, Zap } from "lucide-react"

interface RuleExplanation {
  code: string
  name: string
  description: string
  interpretation: string
  action: "reject" | "warning"
  scope: "within_run" | "across_runs" | "across_levels"
  sensitivity: "high" | "medium" | "low"
  specificity: "high" | "medium" | "low"
  commonCauses: string[]
  example: string
  icon: React.ReactNode
}

const westgardRules: RuleExplanation[] = [
  {
    code: "1_3s",
    name: "1₃s Rule",
    description: "Single control observation exceeds ±3 standard deviations from the mean",
    interpretation: "Indicates a random error or systematic error of large magnitude",
    action: "reject",
    scope: "within_run",
    sensitivity: "low",
    specificity: "high",
    commonCauses: [
      "Pipetting errors",
      "Sample mix-up",
      "Instrument malfunction",
      "Reagent contamination",
      "Temperature fluctuations",
    ],
    example: "If mean = 100 and SD = 5, any value < 85 or > 115 triggers this rule",
    icon: <XCircle className="h-4 w-4" />,
  },
  {
    code: "1_2s",
    name: "1₂s Warning",
    description: "Single control observation exceeds ±2 standard deviations from the mean",
    interpretation: "Warning level - may indicate beginning of systematic error",
    action: "warning",
    scope: "within_run",
    sensitivity: "high",
    specificity: "low",
    commonCauses: ["Early detection of systematic error", "Random variation", "Environmental changes", "Reagent aging"],
    example: "If mean = 100 and SD = 5, values < 90 or > 110 trigger this warning",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  {
    code: "2_2s_within",
    name: "2₂s Within-Run",
    description: "Two control observations in the same run exceed ±2SD on the same side of the mean",
    interpretation: "Indicates systematic error affecting the analytical run",
    action: "reject",
    scope: "within_run",
    sensitivity: "medium",
    specificity: "high",
    commonCauses: ["Calibration drift", "Reagent deterioration", "Temperature changes during run", "Instrument drift"],
    example: "L1 = 110 and L2 = 112 (both > mean + 2SD) in same run",
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    code: "2_2s_across",
    name: "2₂s Across-Runs",
    description: "Two consecutive control observations of the same level exceed ±2SD on the same side",
    interpretation: "Indicates systematic error persisting across runs",
    action: "reject",
    scope: "across_runs",
    sensitivity: "medium",
    specificity: "high",
    commonCauses: ["Calibration bias", "Systematic pipetting error", "Reagent lot change", "Environmental drift"],
    example: "L1 in Run 1 = 110, L1 in Run 2 = 111 (both > mean + 2SD)",
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    code: "R_4s",
    name: "R₄s Rule",
    description: "Range between two control levels in the same run exceeds 4 standard deviations",
    interpretation: "Indicates random error affecting precision within the run",
    action: "reject",
    scope: "within_run",
    sensitivity: "medium",
    specificity: "high",
    commonCauses: [
      "Imprecision in pipetting",
      "Mixing problems",
      "Temperature instability",
      "Electrical interference",
      "Mechanical problems",
    ],
    example: "L1 = 88, L2 = 112 (range = 24, which is > 4×SD if SD = 5)",
    icon: <Zap className="h-4 w-4" />,
  },
  {
    code: "4_1s",
    name: "4₁s Rule",
    description: "Four consecutive control observations exceed ±1SD on the same side of the mean",
    interpretation: "Indicates systematic error or drift developing over time",
    action: "reject",
    scope: "across_runs",
    sensitivity: "high",
    specificity: "medium",
    commonCauses: [
      "Gradual calibration drift",
      "Reagent aging",
      "Environmental changes",
      "Instrument drift",
      "Systematic bias",
    ],
    example: "Four consecutive L1 values: 106, 107, 105, 108 (all > mean + 1SD)",
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    code: "10x",
    name: "10x Rule",
    description: "Ten consecutive control observations fall on the same side of the mean",
    interpretation: "Indicates systematic bias or calibration shift",
    action: "reject",
    scope: "across_runs",
    sensitivity: "high",
    specificity: "medium",
    commonCauses: [
      "Calibration bias",
      "Systematic error in standards",
      "Environmental bias",
      "Reagent lot bias",
      "Instrument bias",
    ],
    example: "Ten consecutive values all above or all below the mean",
    icon: <TrendingUp className="h-4 w-4" />,
  },
]

export function RuleExplanations() {
  const getActionColor = (action: string) => {
    return action === "reject"
      ? "bg-red-100 text-red-800 border-red-200"
      : "bg-yellow-100 text-yellow-800 border-yellow-200"
  }

  const getSensitivityColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-green-100 text-green-800 border-green-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Westgard Rules Reference
          </CardTitle>
          <CardDescription>
            Comprehensive guide to Westgard quality control rules and their interpretations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Westgard rules should be applied systematically and in combination. The choice
              of rules depends on the analytical method's sigma level and quality requirements.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {westgardRules.map((rule, index) => (
        <Card key={rule.code}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {rule.icon}
                {rule.name}
              </div>
              <div className="flex gap-2">
                <Badge className={getActionColor(rule.action)}>{rule.action.toUpperCase()}</Badge>
                <Badge variant="outline">{rule.scope.replace(/_/g, " ")}</Badge>
              </div>
            </CardTitle>
            <CardDescription>{rule.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">Interpretation</h4>
                  <p className="text-sm text-muted-foreground">{rule.interpretation}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Performance Characteristics</h4>
                  <div className="flex gap-2">
                    <Badge className={getSensitivityColor(rule.sensitivity)}>Sensitivity: {rule.sensitivity}</Badge>
                    <Badge className={getSensitivityColor(rule.specificity)}>Specificity: {rule.specificity}</Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Example</h4>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded border">{rule.example}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Common Causes</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {rule.commonCauses.map((cause, causeIndex) => (
                    <li key={causeIndex} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{cause}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Sigma Rules Guidance */}
      <Card>
        <CardHeader>
          <CardTitle>Sigma-Based Rule Selection</CardTitle>
          <CardDescription>
            Recommended rule combinations based on analytical method performance (Sigma level)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-green-600 mb-2">≥6 Sigma (Excellent)</h4>
              <p className="text-sm text-muted-foreground mb-2">
                High quality methods with excellent precision and accuracy
              </p>
              <div className="space-y-1">
                <Badge variant="outline" className="mr-1">
                  1₃s
                </Badge>
                <p className="text-xs text-muted-foreground">Single rule sufficient for most applications</p>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-blue-600 mb-2">≈5 Sigma (Good)</h4>
              <p className="text-sm text-muted-foreground mb-2">Good quality methods with acceptable performance</p>
              <div className="space-y-1">
                <Badge variant="outline" className="mr-1">
                  1₃s
                </Badge>
                <Badge variant="outline" className="mr-1">
                  2₂s
                </Badge>
                <Badge variant="outline" className="mr-1">
                  R₄s
                </Badge>
                <p className="text-xs text-muted-foreground">Multi-rule approach recommended</p>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-orange-600 mb-2">≈4 Sigma (Acceptable)</h4>
              <p className="text-sm text-muted-foreground mb-2">Acceptable methods requiring enhanced monitoring</p>
              <div className="space-y-1">
                <Badge variant="outline" className="mr-1">
                  1₃s
                </Badge>
                <Badge variant="outline" className="mr-1">
                  2₂s
                </Badge>
                <Badge variant="outline" className="mr-1">
                  R₄s
                </Badge>
                <Badge variant="outline" className="mr-1">
                  4₁s
                </Badge>
                <p className="text-xs text-muted-foreground">Extended rule set with N=4 or N=2×2</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">Implementation Guidelines</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  <strong>Start simple:</strong> Begin with 1₃s rule and add complexity as needed
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  <strong>Consider false rejection rate:</strong> More rules = higher false rejection rate
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  <strong>Balance sensitivity vs specificity:</strong> Choose rules based on error detection needs
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  <strong>Document decisions:</strong> Record rationale for rule selection and configuration
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
