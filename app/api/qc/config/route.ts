import { type NextRequest, NextResponse } from "next/server"
import { getSheetsService } from "@/lib/google-sheets"

export async function GET() {
  try {
    const sheetsService = getSheetsService()
    const config = await sheetsService.getWestgardConfig()

    return NextResponse.json({ config })
  } catch (error) {
    console.error("Error getting Westgard config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { configRow } = body

    if (!configRow) {
      return NextResponse.json({ error: "Missing configRow data" }, { status: 400 })
    }

    const sheetsService = getSheetsService()

    // For now, we'll append the new config
    // In a real implementation, you'd want to update the existing row
    const headers = [
      "analyte",
      "level",
      "instrument_id",
      "qc_levels_per_run",
      "profile",
      "enable_1_2s_warning",
      "enable_1_3s_reject",
      "enable_2_2s_within_run_reject",
      "enable_2_2s_across_runs_reject",
      "enable_R_4s_within_run_reject",
      "enable_4_1s_reject",
      "enable_10x_reject",
      "action_default",
      "notes",
    ]

    const row = headers.map((header) => {
      const value = configRow[header]
      return value !== undefined ? value.toString() : ""
    })

    await sheetsService.appendSheet("westgard_config", [row])

    return NextResponse.json({ ok: true, message: "Configuration updated successfully" })
  } catch (error) {
    console.error("Error updating Westgard config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
