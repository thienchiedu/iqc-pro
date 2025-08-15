import { GoogleAuth } from "google-auth-library"

export interface SheetConfig {
  spreadsheetId: string
  sheetName: string
}

export interface QCPoint {
  timestamp: string
  run_id: string
  shift: string
  analyte: string
  level: string
  instrument_id: string
  lot_id: string
  value: number
  z?: number
  violations_json?: string
  status?: "in-control" | "warning" | "reject"
  operator?: string
  comment?: string
}

export interface QCLimit {
  analyte: string
  level: string
  instrument_id: string
  lot_id: string
  mean_lab: number
  sd_lab: number
  source_mean_sd: "lab" | "mfg" | "peer"
  date_established?: string
  lock_date?: string
  is_locked: boolean
  mean_mfg?: number
  sd_mfg?: number
  limit_1s_lower: number
  limit_1s_upper: number
  limit_2s_lower: number
  limit_2s_upper: number
  limit_3s_lower: number
  limit_3s_upper: number
  notes?: string
}

export interface WestgardConfig {
  analyte: string
  level: string
  instrument_id: string
  qc_levels_per_run: number
  profile: "strict" | "relaxed" | "custom"
  enable_1_2s_warning: boolean
  enable_1_3s_reject: boolean
  enable_2_2s_within_run_reject: boolean
  enable_2_2s_across_runs_reject: boolean
  enable_R_4s_within_run_reject: boolean
  enable_4_1s_reject: boolean
  enable_10x_reject: boolean
  action_default: "reject" | "warning"
  notes?: string
}

export interface Violation {
  violation_id: string
  rule_code: string
  analyte: string
  level: string
  instrument_id: string
  lot_id: string
  detection_date: string
  involved_result_ids: string
  status: "new" | "resolved"
  corrective_action?: string
  action_user_id?: string
  resolved_at?: string
}

export class GoogleSheetsService {
  private auth: GoogleAuth
  private spreadsheetId: string

  constructor(spreadsheetId: string) {
    this.spreadsheetId = spreadsheetId
    
    // Use credentials from environment variables if available
    if (process.env.GOOGLE_SHEETS_PRIVATE_KEY && process.env.GOOGLE_SHEETS_CLIENT_EMAIL) {
      this.auth = new GoogleAuth({
        credentials: {
          private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
          client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      })
    } else {
      // Fallback to key file
      this.auth = new GoogleAuth({
        keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      })
    }
  }

  private async getSheets() {
    const { google } = await import("googleapis")
    const authClient = await this.auth.getClient()
    return google.sheets({ version: "v4", auth: authClient as any })
  }

  async createSheet(sheetName: string): Promise<void> {
    try {
      const sheets = await this.getSheets()
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                },
              },
            },
          ],
        },
      })
      console.log(`[v0] Sheet '${sheetName}' created successfully`)
    } catch (error: any) {
      // If sheet already exists, ignore the error
      if (error.message?.includes('already exists')) {
        console.log(`[v0] Sheet '${sheetName}' already exists, skipping creation`)
      } else {
        console.error(`Error creating sheet ${sheetName}:`, error)
        throw error
      }
    }
  }

  async ensureSheetExists(sheetName: string): Promise<void> {
    try {
      // Try to read a small range to check if sheet exists
      await this.readSheet(sheetName, "A1:A1")
    } catch (error: any) {
      // If sheet doesn't exist, create it
      if (error.message?.includes('Unable to parse range') || error.message?.includes('not found')) {
        await this.createSheet(sheetName)
      } else {
        throw error
      }
    }
  }

  async readSheet(sheetName: string, range?: string): Promise<any[][]> {
    try {
      const sheets = await this.getSheets()
      const fullRange = range ? `${sheetName}!${range}` : sheetName

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: fullRange,
      })

      return response.data.values || []
    } catch (error) {
      console.error(`Error reading sheet ${sheetName}:`, error)
      throw error
    }
  }

  async writeSheet(sheetName: string, values: any[][], range?: string): Promise<void> {
    try {
      const sheets = await this.getSheets()
      const fullRange = range ? `${sheetName}!${range}` : sheetName

      await sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: fullRange,
        valueInputOption: "RAW",
        requestBody: {
          values,
        },
      })
    } catch (error) {
      console.error(`Error writing to sheet ${sheetName}:`, error)
      throw error
    }
  }

  async appendSheet(sheetName: string, values: any[][]): Promise<void> {
    try {
      const sheets = await this.getSheets()

      await sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: sheetName,
        valueInputOption: "RAW",
        requestBody: {
          values,
        },
      })
    } catch (error) {
      console.error(`Error appending to sheet ${sheetName}:`, error)
      throw error
    }
  }

  // QC Points operations
  async getQCPoints(filters?: {
    analyte?: string
    level?: string
    instrument_id?: string
    lot_id?: string
    startDate?: string
    endDate?: string
  }): Promise<QCPoint[]> {
    const data = await this.readSheet("qc_points")
    if (data.length === 0) return []

    const headers = data[0]
    const rows = data.slice(1)

    let points = rows.map((row) => {
      const point: any = {}
      headers.forEach((header, index) => {
        point[header] = row[index] || ""
      })
      return point as QCPoint
    })

    // Apply filters
    if (filters) {
      if (filters.analyte) {
        points = points.filter((p) => p.analyte === filters.analyte)
      }
      if (filters.level) {
        points = points.filter((p) => p.level === filters.level)
      }
      if (filters.instrument_id) {
        points = points.filter((p) => p.instrument_id === filters.instrument_id)
      }
      if (filters.lot_id) {
        points = points.filter((p) => p.lot_id === filters.lot_id)
      }
      if (filters.startDate) {
        points = points.filter((p) => p.timestamp >= filters.startDate!)
      }
      if (filters.endDate) {
        points = points.filter((p) => p.timestamp <= filters.endDate!)
      }
    }

    return points
  }

  async addQCPoint(point: QCPoint): Promise<void> {
    const headers = [
      "timestamp",
      "run_id",
      "shift",
      "analyte",
      "level",
      "instrument_id",
      "lot_id",
      "value",
      "z",
      "violations_json",
      "status",
      "operator",
      "comment",
    ]

    const row = headers.map((header) => point[header as keyof QCPoint] || "")
    await this.appendSheet("qc_points", [row])
  }

  // QC Limits operations
  async getQCLimits(filters?: {
    analyte?: string
    level?: string
    instrument_id?: string
    lot_id?: string
  }): Promise<QCLimit[]> {
    const data = await this.readSheet("qc_limits")
    if (data.length === 0) return []

    const headers = data[0]
    const rows = data.slice(1)

    let limits = rows.map((row) => {
      const limit: any = {}
      headers.forEach((header, index) => {
        const value = row[index] || ""
        // Convert numeric fields
        if (
          [
            "mean_lab",
            "sd_lab",
            "mean_mfg",
            "sd_mfg",
            "limit_1s_lower",
            "limit_1s_upper",
            "limit_2s_lower",
            "limit_2s_upper",
            "limit_3s_lower",
            "limit_3s_upper",
          ].includes(header)
        ) {
          limit[header] = value ? Number.parseFloat(value) : 0
        } else if (header === "is_locked") {
          limit[header] = value.toLowerCase() === "true"
        } else {
          limit[header] = value
        }
      })
      return limit as QCLimit
    })

    // Apply filters
    if (filters) {
      if (filters.analyte) {
        limits = limits.filter((l) => l.analyte === filters.analyte)
      }
      if (filters.level) {
        limits = limits.filter((l) => l.level === filters.level)
      }
      if (filters.instrument_id) {
        limits = limits.filter((l) => l.instrument_id === filters.instrument_id)
      }
      if (filters.lot_id) {
        limits = limits.filter((l) => l.lot_id === filters.lot_id)
      }
    }

    return limits
  }

  async updateQCLimit(limit: QCLimit): Promise<void> {
    // This would require finding the specific row and updating it
    // For now, we'll implement a simple append for new limits
    const headers = [
      "analyte",
      "level",
      "instrument_id",
      "lot_id",
      "mean_lab",
      "sd_lab",
      "source_mean_sd",
      "date_established",
      "lock_date",
      "is_locked",
      "mean_mfg",
      "sd_mfg",
      "limit_1s_lower",
      "limit_1s_upper",
      "limit_2s_lower",
      "limit_2s_upper",
      "limit_3s_lower",
      "limit_3s_upper",
      "notes",
    ]

    const row = headers.map((header) => {
      const value = limit[header as keyof QCLimit]
      return value !== undefined ? value.toString() : ""
    })

    await this.appendSheet("qc_limits", [row])
  }

  // Westgard Config operations
  async getWestgardConfig(): Promise<WestgardConfig[]> {
    const data = await this.readSheet("westgard_config")
    if (data.length === 0) return []

    const headers = data[0]
    const rows = data.slice(1)

    return rows.map((row) => {
      const config: any = {}
      headers.forEach((header, index) => {
        const value = row[index] || ""
        // Convert boolean fields
        if (header.startsWith("enable_") || header === "is_active") {
          config[header] = value.toLowerCase() === "true"
        } else if (header === "qc_levels_per_run") {
          config[header] = Number.parseInt(value) || 1
        } else {
          config[header] = value
        }
      })
      return config as WestgardConfig
    })
  }

  // Violations operations
  async getViolations(filters?: {
    status?: "new" | "resolved"
    analyte?: string
    startDate?: string
    endDate?: string
  }): Promise<Violation[]> {
    const data = await this.readSheet("violations")
    if (data.length === 0) return []

    const headers = data[0]
    const rows = data.slice(1)

    let violations = rows.map((row) => {
      const violation: any = {}
      headers.forEach((header, index) => {
        violation[header] = row[index] || ""
      })
      return violation as Violation
    })

    // Apply filters
    if (filters) {
      if (filters.status) {
        violations = violations.filter((v) => v.status === filters.status)
      }
      if (filters.analyte) {
        violations = violations.filter((v) => v.analyte === filters.analyte)
      }
      if (filters.startDate) {
        violations = violations.filter((v) => v.detection_date >= filters.startDate!)
      }
      if (filters.endDate) {
        violations = violations.filter((v) => v.detection_date <= filters.endDate!)
      }
    }

    return violations
  }

  async addViolation(violation: Violation): Promise<void> {
    const headers = [
      "violation_id",
      "rule_code",
      "analyte",
      "level",
      "instrument_id",
      "lot_id",
      "detection_date",
      "involved_result_ids",
      "status",
      "corrective_action",
      "action_user_id",
      "resolved_at",
    ]

    const row = headers.map((header) => violation[header as keyof Violation] || "")
    await this.appendSheet("violations", [row])
  }
}

// Singleton instance
let sheetsService: GoogleSheetsService | null = null

export function getSheetsService(): GoogleSheetsService {
  if (!sheetsService) {
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
    if (!spreadsheetId) {
      throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID environment variable is required")
    }
    sheetsService = new GoogleSheetsService(spreadsheetId)
  }
  return sheetsService
}
