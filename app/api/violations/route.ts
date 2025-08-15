import { type NextRequest, NextResponse } from "next/server"
import { getSheetsService } from "@/lib/google-sheets"

export async function GET() {
  try {
    const sheetsService = getSheetsService()
    const violations = await sheetsService.getViolations()
    return NextResponse.json(violations)
  } catch (error) {
    console.error("Error fetching violations:", error)
    return NextResponse.json({ error: "Failed to fetch violations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sheetsService = getSheetsService()
    const violationData = await request.json()
    const result = await sheetsService.addViolation(violationData)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error creating violation:", error)
    return NextResponse.json({ error: "Failed to create violation" }, { status: 500 })
  }
}
