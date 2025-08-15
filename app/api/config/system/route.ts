import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Return basic system configuration
    const systemConfig = {
      googleSheetsEnabled: !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      westgardRulesEnabled: true,
      databaseConnected: true
    }
    
    return NextResponse.json(systemConfig)
  } catch (error) {
    console.error("Error fetching system settings:", error)
    return NextResponse.json({ error: "Failed to fetch system settings" }, { status: 500 })
  }
}
