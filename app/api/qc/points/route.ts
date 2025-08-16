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
    const page = searchParams.get("page") ? parseInt(searchParams.get("page") as string) : 1
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit") as string) : 20

    const sheetsService = getSheetsService()
    const { points, total } = await sheetsService.getQCPoints(filters, { page, limit })

    console.log(`[api/qc/points] Filters: ${JSON.stringify(filters)}, Page: ${page}, Limit: ${limit}, Total: ${total}`)

    return NextResponse.json({ points, total, page, limit })
  } catch (error) {
    console.error("Error fetching QC points:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

