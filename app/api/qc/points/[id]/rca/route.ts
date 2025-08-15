import { type NextRequest, NextResponse } from "next/server"
import { getSheetsService } from "@/lib/google-sheets"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { root_cause, corrective_action, conclusion } = body

    // Validate at least one field is provided
    if (!root_cause && !corrective_action && !conclusion) {
      return NextResponse.json(
        { error: "At least one field (root_cause, corrective_action, conclusion) must be provided" },
        { status: 400 },
      )
    }

    const sheetsService = getSheetsService()

    // Update QC point with RCA information
    await sheetsService.updateQCPointRCA(id, {
      root_cause,
      corrective_action,
      conclusion,
    })

    return NextResponse.json({
      message: "Root cause analysis updated successfully",
      updated_fields: { root_cause, corrective_action, conclusion },
    })
  } catch (error) {
    console.error("Error updating RCA:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
