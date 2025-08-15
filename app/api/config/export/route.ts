import { NextResponse } from "next/server"
import { GoogleSheetsService } from "@/lib/google-sheets"

const sheetsService = new GoogleSheetsService()

export async function GET() {
  try {
    // Export all configuration data
    const [analytes, instruments, systemSettings] = await Promise.all([
      sheetsService.getAnalytes(),
      sheetsService.getInstruments(),
      sheetsService.getSystemSettings(),
    ])

    const configData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      analytes,
      instruments,
      systemSettings,
    }

    const jsonString = JSON.stringify(configData, null, 2)

    return new NextResponse(jsonString, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="qc-config-${new Date().toISOString().split("T")[0]}.json"`,
      },
    })
  } catch (error) {
    console.error("Error exporting configuration:", error)
    return NextResponse.json({ error: "Failed to export configuration" }, { status: 500 })
  }
}
