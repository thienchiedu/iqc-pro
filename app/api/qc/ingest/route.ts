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

    // Evaluate Westgard rules
    const violations = WestgardRulesEngine.evaluatePoint(currentPoint, historicalForRules, config)

    // Determine status
    const status = WestgardRulesEngine.determineStatus(violations)

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
      violations,
      status,
      message: `QC point processed successfully. Status: ${status}`,
    })
  } catch (error) {
    console.error("Error processing QC point:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
