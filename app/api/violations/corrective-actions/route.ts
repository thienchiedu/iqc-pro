import { type NextRequest, NextResponse } from "next/server"
import { GoogleSheetsService } from "@/lib/google-sheets"

const sheetsService = new GoogleSheetsService()

export async function POST(request: NextRequest) {
  try {
    const actionData = await request.json()
    const result = await sheetsService.addCorrectiveAction(actionData)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error creating corrective action:", error)
    return NextResponse.json({ error: "Failed to create corrective action" }, { status: 500 })
  }
}
