
import { type NextRequest, NextResponse } from "next/server"
import { getSheetsService } from "@/lib/google-sheets"
import { z } from "zod"

// Zod schema for validating an update to a QC Level
// All fields are optional for partial updates
const qcLevelUpdateSchema = z.object({
  test_id: z.string().min(1, "Test ID is required").optional(),
  level: z.enum(["L1", "L2", "L3", "L4"]).optional(),
  target_mean: z.number().optional(),
  target_sd: z.number().optional(),
  material: z.string().optional(),
  lot_hint: z.string().optional(),
  is_active: z.boolean().optional(),
})

/**
 * PUT handler to update an existing QC level
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const validation = qcLevelUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request body", details: validation.error.flatten() }, { status: 422 })
    }

    const sheetsService = getSheetsService()
    const updatedData = { id, ...validation.data }

    await sheetsService.updateQCLevel(updatedData) // Assumes this method exists

    return NextResponse.json(updatedData)
  } catch (error: any) {
    console.error(`Error updating QC level ${params.id}:`, error)
    const status = error.code === 429 ? 429 : 500
    return NextResponse.json({ error: "Failed to update QC level", details: error.message }, { status })
  }
}

/**
 * DELETE handler to remove a QC level
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const sheetsService = getSheetsService()

    await sheetsService.deleteQCLevel(id) // Assumes this method exists

    return new NextResponse(null, { status: 204 }) // No Content
  } catch (error: any) {
    console.error(`Error deleting QC level ${params.id}:`, error)
    const status = error.code === 429 ? 429 : 500
    return NextResponse.json({ error: "Failed to delete QC level", details: error.message }, { status })
  }
}
