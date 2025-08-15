import { type NextRequest, NextResponse } from "next/server"
import { GoogleSheetsService } from "@/lib/google-sheets"

const sheetsService = new GoogleSheetsService()

export async function GET() {
  try {
    const instruments = await sheetsService.getInstruments()
    return NextResponse.json(instruments)
  } catch (error) {
    console.error("Error fetching instruments:", error)
    return NextResponse.json({ error: "Failed to fetch instruments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const instrumentData = await request.json()
    const result = await sheetsService.addInstrument(instrumentData)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error creating instrument:", error)
    return NextResponse.json({ error: "Failed to create instrument" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const instrumentData = await request.json()
    const result = await sheetsService.updateInstrument(instrumentData)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error updating instrument:", error)
    return NextResponse.json({ error: "Failed to update instrument" }, { status: 500 })
  }
}
