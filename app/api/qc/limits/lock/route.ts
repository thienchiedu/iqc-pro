import { type NextRequest, NextResponse } from "next/server"
import { getSheetsService } from "@/lib/google-sheets"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lot_id } = body

    if (!lot_id) {
      return NextResponse.json({ error: "Missing required field: lot_id" }, { status: 400 })
    }

    const sheetsService = getSheetsService()

    // Get all limits for this lot
    const limits = await sheetsService.getQCLimits({ lot_id })

    if (limits.length === 0) {
      return NextResponse.json({ error: "No QC limits found for this lot" }, { status: 404 })
    }

    // Update all limits for this lot to locked status
    const lockDate = new Date().toISOString()

    for (const limit of limits) {
      const updatedLimit = {
        ...limit,
        is_locked: true,
        lock_date: lockDate,
      }

      await sheetsService.updateQCLimit(updatedLimit)
    }

    return NextResponse.json({
      is_locked: true,
      lock_date: lockDate,
      limitsLocked: limits.length,
      message: `Successfully locked ${limits.length} QC limits for lot ${lot_id}`,
    })
  } catch (error) {
    console.error("Error locking QC limits:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
