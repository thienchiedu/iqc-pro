
import { type NextRequest, NextResponse } from "next/server"
import { getSheetsService } from "@/lib/google-sheets"
import { z } from "zod"

// Zod schema for validating a QC Level
const qcLevelSchema = z.object({
  id: z.string().optional(), // ID is generated on creation
  test_id: z.string().min(1, "Test ID is required"),
  level: z.enum(["L1", "L2", "L3", "L4"]),
  target_mean: z.number().optional(),
  target_sd: z.number().optional(),
  material: z.string().optional(),
  lot_hint: z.string().optional(),
  is_active: z.boolean().default(true),
})

/**
 * GET handler to fetch all QC levels
 */
export async function GET() {
  try {
    const sheetsService = getSheetsService()
    const qcLevels = await sheetsService.getQCLevels() // Assumes this method exists
    return NextResponse.json(qcLevels)
  } catch (error: any) {
    console.error("Error fetching QC levels:", error)
    const status = error.code === 429 ? 429 : 500
    return NextResponse.json({ error: "Failed to fetch QC levels", details: error.message }, { status })
  }
}

/**
 * POST handler to create a new QC level
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = qcLevelSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request body", details: validation.error.flatten() }, { status: 422 })
    }

    const newQcLevel = {
      ...validation.data,
      id: `QCL-${crypto.randomUUID()}`,
    }

    const sheetsService = getSheetsService()
    await sheetsService.addQCLevel(newQcLevel) // Assumes this method exists

    return NextResponse.json(newQcLevel, { status: 201 })
  } catch (error: any) {
    console.error("Error creating QC level:", error)
    const status = error.code === 429 ? 429 : 500
    return NextResponse.json({ error: "Failed to create QC level", details: error.message }, { status })
  }
}
