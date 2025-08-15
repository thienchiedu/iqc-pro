import { type NextRequest, NextResponse } from "next/server"
import { GoogleSheetsService } from "@/lib/google-sheets"

const sheetsService = new GoogleSheetsService()

export async function GET() {
  try {
    const analytes = await sheetsService.getAnalytes()
    return NextResponse.json(analytes)
  } catch (error) {
    console.error("Error fetching analytes:", error)
    return NextResponse.json({ error: "Failed to fetch analytes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const analyteData = await request.json()
    const result = await sheetsService.addAnalyte(analyteData)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error creating analyte:", error)
    return NextResponse.json({ error: "Failed to create analyte" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const analyteData = await request.json()
    const result = await sheetsService.updateAnalyte(analyteData)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error updating analyte:", error)
    return NextResponse.json({ error: "Failed to update analyte" }, { status: 500 })
  }
}
