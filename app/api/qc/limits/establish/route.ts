import { type NextRequest, NextResponse } from "next/server"
import { getSheetsService } from "@/lib/google-sheets"

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

    // Calculate mean and standard deviation
    const values = inControlPoints.map((p) => p.value)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length

    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1)
    const sd = Math.sqrt(variance)

    // Calculate control limits
    const limits = {
      analyte,
      level,
      instrument_id,
      lot_id,
      mean_lab: mean,
      sd_lab: sd,
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
      limits,
      pointsUsed: inControlPoints.length,
      message: "QC limits established successfully",
    })
  } catch (error) {
    console.error("Error establishing QC limits:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
