import { type NextRequest, NextResponse } from "next/server"
import { getSheetsService } from "@/lib/google-sheets"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filters = {
      analyte: searchParams.get("analyte") || undefined,
      level: searchParams.get("level") || undefined,
      instrument_id: searchParams.get("instrument_id") || undefined,
      lot_id: searchParams.get("lot_id") || undefined,
    }

    const sheetsService = getSheetsService()
    const limits = await sheetsService.getQCLimits(filters)

    return NextResponse.json({ limits })
  } catch (error) {
    console.error("Error fetching QC limits:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
