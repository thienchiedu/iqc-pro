import { type NextRequest, NextResponse } from "next/server"
import { getSheetsService } from "@/lib/google-sheets"
import { WestgardRulesEngine } from "@/lib/westgard-rules"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { analyte, level, instrument_id, lot_id, value, timestamp, run_id, shift, operator, comment } = body

    // Validate required fields
    if (!analyte || !level || !instrument_id || !lot_id || value === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: analyte, level, instrument_id, lot_id, value" },
        { status: 400 },
      )
    }

    const sheetsService = getSheetsService()

    // Get QC limits for this analyte/level/instrument/lot
    const limits = await sheetsService.getQCLimits({
      analyte,
      level,
      instrument_id,
      lot_id,
    })

    if (limits.length === 0) {
      return NextResponse.json(
        { error: "No QC limits found for this analyte/level/instrument/lot combination" },
        { status: 404 },
      )
    }

    const limit = limits[0]
    if (!limit.is_locked) {
      return NextResponse.json(
        { error: "QC limits are not locked for this lot. Please establish and lock limits first." },
        { status: 400 },
      )
    }

    // Calculate Z-score
    const z = WestgardRulesEngine.calculateZScore(value, limit.mean_lab, limit.sd_lab)

    // Get Westgard configuration
    const configs = await sheetsService.getWestgardConfig()
    const config = configs.find((c) => c.analyte === analyte && c.level === level && c.instrument_id === instrument_id)

    if (!config) {
      return NextResponse.json(
        { error: "No Westgard configuration found for this analyte/level/instrument combination" },
        { status: 404 },
      )
    }

    // Get historical points for rule evaluation
    const historicalPoints = await sheetsService.getQCPoints({
      analyte,
      level,
      instrument_id,
      lot_id,
    })

    // Convert to format needed by rules engine
    const historicalForRules = historicalPoints.map((p, index) => ({
      id: index,
      value: p.value,
      z: p.z || 0,
      level: p.level,
      timestamp: p.timestamp,
      run_id: p.run_id,
    }))

    // Create current point for evaluation
    const currentPoint = {
      id: historicalForRules.length,
      value,
      z,
      level,
      timestamp: timestamp || new Date().toISOString(),
      run_id: run_id || "default",
    }

    const lastPoint = historicalPoints[historicalPoints.length - 1]
    const previousCUSUM = lastPoint
      ? {
          pos: lastPoint.cusum_pos || 0,
          neg: lastPoint.cusum_neg || 0,
          crossed: false,
        }
      : { pos: 0, neg: 0, crossed: false }

    const evaluationResult = WestgardRulesEngine.evaluatePoint(
      currentPoint,
      historicalForRules,
      {
        ...config,
        enable_2of3_2s_reject: config.enable_2of3_2s_reject || false,
        enable_3_1s_reject: config.enable_3_1s_reject || false,
        enable_6x_reject: config.enable_6x_reject || false,
        enable_9x_reject: config.enable_9x_reject || false,
        enable_7T_reject: config.enable_7T_reject || false,
        enable_cusum: config.enable_cusum || false,
        cusum_K: config.cusum_K || 0.5,
        cusum_H: config.cusum_H || 4.0,
      },
      previousCUSUM,
    )

    const violations = evaluationResult.results
    const cusumState = evaluationResult.cusumState

    // Determine status
    const status = WestgardRulesEngine.determineStatus(violations)

    const levelBadges = calculateLevelBadges(violations, currentPoint, historicalForRules)

    const trendAnalysis = calculateTrendAnalysis(currentPoint, historicalForRules)

    const cusumResponse = {
      pos: cusumState?.pos || 0,
      neg: cusumState?.neg || 0,
      crossed: cusumState?.crossed || false,
    }

    const violationsMatrix = {
      [level]: violations.filter((v) => !v.rule.includes("R_")).map((v) => v.rule),
      pairs: violations
        .filter((v) => v.rule.includes("R_"))
        .reduce(
          (acc, v) => {
            acc["1-2"] = acc["1-2"] || []
            acc["1-2"].push(v.rule)
            return acc
          },
          {} as Record<string, string[]>,
        ),
    }

    // Create QC point record
    const qcPoint = {
      timestamp: timestamp || new Date().toISOString(),
      run_id: run_id || "default",
      shift: shift || "",
      analyte,
      level,
      instrument_id,
      lot_id,
      value,
      z,
      violations_json: JSON.stringify(violations),
      status,
      operator: operator || "",
      comment: comment || "",
      shift_flag: trendAnalysis.shift,
      trend_flag: trendAnalysis.trend,
      cusum_pos: cusumState?.pos || 0,
      cusum_neg: cusumState?.neg || 0,
      violations_matrix_json: JSON.stringify(violationsMatrix),
    }

    // Save QC point
    await sheetsService.addQCPoint(qcPoint)

    // Save violations if any
    for (const violation of violations) {
      const violationRecord = {
        violation_id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        rule_code: violation.rule,
        analyte,
        level,
        instrument_id,
        lot_id,
        detection_date: new Date().toISOString(),
        involved_result_ids: violation.involvedPoints.join(","),
        status: "new" as const,
        corrective_action: "",
        action_user_id: "",
        resolved_at: "",
      }

      await sheetsService.addViolation(violationRecord)
    }

    return NextResponse.json({
      z,
      status,
      violations: violations.map((v) => v.rule),
      level_badges: levelBadges,
      trend: trendAnalysis,
      cusum: cusumResponse,
      message: `QC point processed successfully. Status: ${status}`,
    })
  } catch (error) {
    console.error("Error processing QC point:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function calculateLevelBadges(violations: any[], currentPoint: any, historicalPoints: any[]) {
  const badges: Record<string, string[]> = {}
  const pairs: Record<string, string[]> = {}

  for (const violation of violations) {
    if (violation.rule.includes("R_")) {
      // Range rules apply to pairs
      pairs["1-2"] = pairs["1-2"] || []
      pairs["1-2"].push(violation.rule)
    } else {
      // Other rules apply to individual levels
      badges[currentPoint.level] = badges[currentPoint.level] || []
      badges[currentPoint.level].push(violation.rule)
    }
  }

  return { ...badges, pairs }
}

function calculateTrendAnalysis(currentPoint: any, historicalPoints: any[]) {
  // Simple trend detection - can be enhanced based on requirements
  const recentPoints = historicalPoints.slice(-6) // Last 6 points

  let shift = false
  let trend = false

  if (recentPoints.length >= 6) {
    // Check for shift (6+ points on same side)
    const sameSide = recentPoints.every((p) => Math.sign(p.z) === Math.sign(currentPoint.z))
    shift = sameSide && currentPoint.z !== 0

    // Check for trend (6+ points consistently increasing/decreasing)
    const values = [...recentPoints.map((p) => p.value), currentPoint.value]
    let increasing = true
    let decreasing = true

    for (let i = 1; i < values.length; i++) {
      if (values[i] <= values[i - 1]) increasing = false
      if (values[i] >= values[i - 1]) decreasing = false
    }

    trend = increasing || decreasing
  }

  return { shift, trend }
}
