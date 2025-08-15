import { type NextRequest, NextResponse } from "next/server"
import { GoogleSheetsService } from "@/lib/google-sheets"

const sheetsService = new GoogleSheetsService()

export async function GET() {
  try {
    const settings = await sheetsService.getSystemSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching system settings:", error)
    return NextResponse.json({ error: "Failed to fetch system settings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const settings = await request.json()
    const result = await sheetsService.updateSystemSettings(settings)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error updating system settings:", error)
    return NextResponse.json({ error: "Failed to update system settings" }, { status: 500 })
  }
}
