import { type NextRequest, NextResponse } from "next/server"
import { GoogleSheetsService } from "@/lib/google-sheets"

const sheetsService = new GoogleSheetsService()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const analyte = searchParams.get("analyte")

    const stats = await sheetsService.getViolationStats({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      analyte: analyte !== "all" ? analyte : undefined,
    })

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching violation stats:", error)
    return NextResponse.json({ error: "Failed to fetch violation statistics" }, { status: 500 })
  }
}
