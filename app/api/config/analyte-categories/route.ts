
import { NextResponse } from "next/server"
import { getSheetsService } from "@/lib/google-sheets"

/**
 * GET handler to fetch all analyte categories
 */
export async function GET() {
  try {
    const sheetsService = getSheetsService()
    // Assumes this method reads from a dedicated 'analyte_categories' sheet
    const categories = await sheetsService.getAnalyteCategories()
    return NextResponse.json(categories)
  } catch (error: any) {
    console.error("Error fetching analyte categories:", error)
    const status = error.code === 429 ? 429 : 500
    return NextResponse.json({ error: "Failed to fetch analyte categories", details: error.message }, { status })
  }
}
