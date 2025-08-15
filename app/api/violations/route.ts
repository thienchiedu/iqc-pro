import { type NextRequest, NextResponse } from "next/server"
import { GoogleSheetsService } from "@/lib/google-sheets"

const sheetsService = new GoogleSheetsService()

export async function GET() {
  try {
    const violations = await sheetsService.getViolations()
    return NextResponse.json(violations)
  } catch (error) {
    console.error("Error fetching violations:", error)
    return NextResponse.json({ error: "Failed to fetch violations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const violationData = await request.json()
    const result = await sheetsService.addViolation(violationData)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error creating violation:", error)
    return NextResponse.json({ error: "Failed to create violation" }, { status: 500 })
  }
}
