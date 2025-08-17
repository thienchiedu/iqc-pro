import { type NextRequest, NextResponse } from "next/server"
import { getSheetsService } from "@/lib/google-sheets"
import { StatisticalEngine } from "@/lib/statistical-engine"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { analyte, level, instrument_id, lot_id, minPoints = 20 } = body

    // Validate required fields
    if (!analyte || !level || !instrument_id || !lot_id) {
      return NextResponse.json(
        { error: "Missing required fields: analyte, level, instrument_id, lot_id" },
        { status: 400 },
      )
    }

    const sheetsService = getSheetsService()

    // Get QC points for this combination that are in-control
    const qcPoints = await sheetsService.getQCPoints({
      analyte,
      level,
      instrument_id,
      lot_id,
    })

    // Filter for in-control points only
    const inControlPoints = qcPoints.filter((p) => p.status === "in-control")

    if (inControlPoints.length < minPoints) {
      return NextResponse.json(
        {
          error: `Insufficient in-control points. Found ${inControlPoints.length}, need at least ${minPoints}`,
          currentPoints: inControlPoints.length,
          requiredPoints: minPoints,
        },
        { status: 400 },
      )
    }

    // Calculate mean, standard deviation, and CV
    const values = inControlPoints.map((p) => p.value)
    const stats = StatisticalEngine.calculateBasicStats(values)
    const { mean, standardDeviation: sd, cv } = stats

    // Calculate control limits
    const limits = {
      analyte,
      level,
      instrument_id,
      lot_id,
      mean_lab: mean,
      sd_lab: sd,
      cv_lab: cv,
      source_mean_sd: "lab" as const,
      date_established: new Date().toISOString(),
      lock_date: "",
      is_locked: false,
      mean_mfg: 0,
      sd_mfg: 0,
      limit_1s_lower: mean - sd,
      limit_1s_upper: mean + sd,
      limit_2s_lower: mean - 2 * sd,
      limit_2s_upper: mean + 2 * sd,
      limit_3s_lower: mean - 3 * sd,
      limit_3s_upper: mean + 3 * sd,
      notes: `Established from ${inControlPoints.length} in-control points`,
    }

    // Save the limits
    await sheetsService.updateQCLimit(limits)

    return NextResponse.json({
      mean_lab: mean,
      sd_lab: sd,
      cv_lab: cv,
      limits,
      pointsUsed: inControlPoints.length,
      message: "QC limits established successfully",
    })
  } catch (error) {
    console.error("Error establishing QC limits:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
