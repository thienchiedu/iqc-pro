import { type NextRequest, NextResponse } from "next/server"
import { getSheetsService } from "@/lib/google-sheets"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { startDate, endDate, analyte, instrument_id, lot_id, format = "pdf" } = body

    // Validate required fields
    if (!startDate || !endDate) {
      return NextResponse.json({ error: "startDate and endDate are required" }, { status: 400 })
    }

    const sheetsService = getSheetsService()

    // Get QC points with filters
    const qcPoints = await sheetsService.getQCPoints({
      analyte,
      instrument_id,
      lot_id,
      startDate,
      endDate,
    })

    // Get violations for the same period
    const violations = await sheetsService.getViolations({
      analyte,
      startDate,
      endDate,
    })

    // Calculate violation statistics
    const violationStats = calculateViolationStats(violations)

    // Generate report data
    const reportData = {
      metadata: {
        title: "QC Report",
        period: `${startDate} to ${endDate}`,
        analyte: analyte || "All",
        instrument: instrument_id || "All",
        lot: lot_id || "All",
        generated_at: new Date().toISOString(),
      },
      summary: {
        total_points: qcPoints.length,
        in_control: qcPoints.filter((p) => p.status === "in-control").length,
        warnings: qcPoints.filter((p) => p.status === "warning").length,
        rejections: qcPoints.filter((p) => p.status === "reject").length,
      },
      violation_stats: violationStats,
      qc_points: qcPoints,
      violations: violations,
    }

    if (format === "json") {
      return NextResponse.json(reportData)
    }

    // For PDF format, return a simplified response
    // In a real implementation, you would use a PDF generation library
    return NextResponse.json({
      message: "PDF generation not implemented yet",
      data: reportData,
      download_url: "/api/reports/download/placeholder.pdf",
    })
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function calculateViolationStats(violations: any[]) {
  const stats: Record<string, { count: number; category: string }> = {}

  for (const violation of violations) {
    const rule = violation.rule_code
    if (!stats[rule]) {
      stats[rule] = {
        count: 0,
        category: categorizeRule(rule),
      }
    }
    stats[rule].count++
  }

  return stats
}

function categorizeRule(rule: string): string {
  if (rule.includes("1_3s")) return "RE" // Random Error
  if (rule.includes("2_2s") || rule.includes("R_4s")) return "SE" // Systematic Error
  if (rule.includes("4_1s") || rule.includes("10x") || rule.includes("6x") || rule.includes("9x")) return "SE"
  if (rule.includes("2of3_2s") || rule.includes("3_1s")) return "SE"
  if (rule.includes("7T")) return "Trend"
  if (rule.includes("CUSUM")) return "Shift"
  return "Other"
}
