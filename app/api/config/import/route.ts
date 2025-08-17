
import { type NextRequest, NextResponse } from "next/server"
import { getSheetsService } from "@/lib/google-sheets"
import { z } from "zod"

// Define schemas for the parts of the config file to be imported
const analyteSchema = z.array(z.object({ id: z.string(), name: z.string() })) // Simplified for example
const instrumentSchema = z.array(z.object({ id: z.string(), name: z.string() })) // Simplified for example
const systemSettingsSchema = z.object({ labName: z.string() }) // Simplified for example

const configSchema = z.object({
  version: z.string(),
  exportDate: z.string(),
  analytes: analyteSchema.optional(),
  instruments: instrumentSchema.optional(),
  systemSettings: systemSettingsSchema.optional(),
})

/**
 * POST handler to import a configuration file
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("config") as File | null

    if (!file) {
      return NextResponse.json({ error: "No configuration file provided." }, { status: 400 })
    }

    if (file.type !== "application/json") {
      return NextResponse.json({ error: "Invalid file type. Please upload a .json file." }, { status: 400 })
    }

    const content = await file.text()
    const configJson = JSON.parse(content)

    // Validate the structure of the JSON file
    const validation = configSchema.safeParse(configJson)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid configuration file format.", details: validation.error.flatten() },
        { status: 422 }
      )
    }

    const { analytes, instruments, systemSettings } = validation.data
    const sheetsService = getSheetsService()

    // Perform updates in batch. Assumes the existence of batch/upsert methods
    // on the sheetsService to minimize API calls and handle retries internally.
    const promises = []

    if (systemSettings) {
      // This would be a single row update, so it's already atomic.
      promises.push(sheetsService.updateSystemSettings(systemSettings))
    }

    if (analytes) {
      // This assumes a method that can intelligently update/insert analytes.
      promises.push(sheetsService.batchUpdateAnalytes(analytes))
    }

    if (instruments) {
      promises.push(sheetsService.batchUpdateInstruments(instruments))
    }

    await Promise.all(promises)

    return NextResponse.json({ message: "Configuration imported successfully." })
  } catch (error: any) {
    console.error("Error importing configuration:", error)

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON in configuration file." }, { status: 400 })
    }

    const status = error.code === 429 ? 429 : 500
    return NextResponse.json({ error: "Failed to import configuration.", details: error.message }, { status })
  }
}
