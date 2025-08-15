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
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
    }

    const sheetsService = getSheetsService()
    const points = await sheetsService.getQCPoints(filters)

    return NextResponse.json({ points })
  } catch (error) {
    console.error("Error fetching QC points:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
