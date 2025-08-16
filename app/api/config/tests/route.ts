import { NextResponse } from "next/server"
import { getSheetsService } from "@/lib/google-sheets"

export async function GET() {
  try {
    const sheetsService = getSheetsService()
    const tests = await sheetsService.getTests()
    
    return NextResponse.json({ tests })
  } catch (error) {
    console.error("Error fetching tests:", error)
    return NextResponse.json({ error: "Failed to fetch tests" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { test_name, unit, is_active = true, reference_range_low, reference_range_high, critical_low, critical_high, notes } = body

    // Validate required fields
    if (!test_name || !unit) {
      return NextResponse.json(
        { error: "Missing required fields: test_name, unit" },
        { status: 400 }
      )
    }

    const sheetsService = getSheetsService()
    
    await sheetsService.addTest({
      test_name,
      unit,
      is_active,
      reference_range_low,
      reference_range_high,
      critical_low,
      critical_high,
      notes,
    })

    return NextResponse.json({ 
      message: "Test added successfully",
      test: { test_name, unit, is_active }
    })
  } catch (error) {
    console.error("Error adding test:", error)
    return NextResponse.json({ error: "Failed to add test" }, { status: 500 })
  }
}
