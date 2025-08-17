import { NextResponse, NextRequest } from "next/server"
import { getSheetsService } from "@/lib/google-sheets"
import { z } from "zod"

// Zod schema for validating the incoming PUT request body
const systemSettingsSchema = z.object({
  labName: z.string().min(1, "Laboratory Name is required"),
  timezone: z.string().min(1, "Timezone is required"),
  dateFormat: z.enum(["YYYY-MM-DD", "MM/DD/YYYY", "DD/MM/YYYY"]),
  retentionPeriod: z.string().refine((val) => !isNaN(parseInt(val, 10)) && parseInt(val, 10) > 0, {
    message: "Retention period must be a positive number",
  }),
  autoBackup: z.boolean(),
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  defaultWestgardRules: z.array(z.string()),
})

// Helper to map API keys to sheet columns and back
const keyToColumnMap: { [key: string]: string } = {
  labName: "laboratory_name",
  timezone: "timezone",
  dateFormat: "date_format",
  retentionPeriod: "data_retention_days",
  autoBackup: "automatic_backup_enabled",
  emailNotifications: "email_notifications_enabled",
  smsNotifications: "sms_notifications_enabled",
}

const westgardRules = ["1-3s", "2-2s", "R-4s", "4-1s", "8-x", "10-x", "2of3-2s", "12-x"]

export async function GET() {
  try {
    console.log("GET /api/config/system called")
    
    const sheetsService = getSheetsService()
    const settingsFromSheet = await sheetsService.getSystemSettings()

    if (!settingsFromSheet) {
      // Return default settings if none found
      return NextResponse.json({
        labName: "",
        timezone: "UTC",
        dateFormat: "YYYY-MM-DD",
        retentionPeriod: "365",
        autoBackup: false,
        emailNotifications: false,
        smsNotifications: false,
        defaultWestgardRules: []
      })
    }

    // Transform sheet data to API response format
    const responsePayload: { [key: string]: any } = {
      defaultWestgardRules: [],
    }

    for (const key in keyToColumnMap) {
      responsePayload[key] = settingsFromSheet[keyToColumnMap[key]] || ""
    }

    const rules: string[] = []
    for (const rule of westgardRules) {
      const normalizedRule = rule.replace("-", "") // "8-x" -> "8x"
      if (settingsFromSheet[`default_rules__${normalizedRule}`] === true) {
        rules.push(rule)
      }
    }
    responsePayload.defaultWestgardRules = rules

    return NextResponse.json(responsePayload)
  } catch (error: any) {
    console.error("Error fetching system settings:", error)
    // Return default settings on error
    return NextResponse.json({
      labName: "",
      timezone: "UTC", 
      dateFormat: "YYYY-MM-DD",
      retentionPeriod: "365",
      autoBackup: false,
      emailNotifications: false,
      smsNotifications: false,
      defaultWestgardRules: []
    })
  }
}

/**
 * PUT handler to update system configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = systemSettingsSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request body", details: validation.error.flatten() }, { status: 422 })
    }

    const { defaultWestgardRules, ...otherSettings } = validation.data

    // Transform API data to sheet format
    const settingsForSheet: { [key: string]: any } = {}
    for (const key in otherSettings) {
      if (keyToColumnMap[key]) {
        settingsForSheet[keyToColumnMap[key]] = (otherSettings as any)[key]
      }
    }

    // Map the rules array to individual boolean columns
    for (const rule of westgardRules) {
      const normalizedRule = rule.replace("-", "")
      settingsForSheet[`default_rules__${normalizedRule}`] = defaultWestgardRules.includes(rule)
    }

    const sheetsService = getSheetsService()
    // Assumes updateSystemSettings performs an atomic update of the single config row
    await sheetsService.updateSystemSettings(settingsForSheet)

    return NextResponse.json({ message: "System settings updated successfully." })
  } catch (error: any) {
    console.error("Error updating system settings:", error)
    const status = error.code === 429 ? 429 : 500
    return NextResponse.json({ error: "Failed to update system settings", details: error.message }, { status })
  }
}

/**
 * Handler for unsupported methods
 */
function createMethodNotAllowedHandler() {
  return async function(request: NextRequest) {
    const headers = { Allow: "GET, PUT" }
    return new NextResponse(null, { status: 405, headers })
  }
}

export const OPTIONS = createMethodNotAllowedHandler()
export const POST = createMethodNotAllowedHandler()
export const DELETE = createMethodNotAllowedHandler()
export const PATCH = createMethodNotAllowedHandler()
