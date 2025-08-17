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
  shift_flag?: boolean
  trend_flag?: boolean
  cusum_pos?: number
  cusum_neg?: number
  violations_matrix_json?: string
  root_cause?: string
  corrective_action?: string
  conclusion?: string
}

export interface Test {
  test_id: string
  test_name: string
  unit: string
  is_active: boolean
  reference_range_low?: number
  reference_range_high?: number
  critical_low?: number
  critical_high?: number
  notes?: string
}

export interface Device {
  device_id: string
  device_name: string
  serial_number: string
  manufacturer?: string
  model?: string
  installation_date?: string
  last_maintenance?: string
  is_active: boolean
  notes?: string
}

export interface QCLot {
  lot_id: string
  test_id: string
  level: string
  lot_number: string
  expiry_date: string
  mean_mfg?: number
  sd_mfg?: number
  manufacturer?: string
  product_name?: string
  is_active: boolean
  notes?: string
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
  enable_2of3_2s_reject?: boolean
  enable_3_1s_reject?: boolean
  enable_6x_reject?: boolean
  enable_9x_reject?: boolean
  enable_7T_reject?: boolean
  n_per_run?: number
  enable_cusum?: boolean
  cusum_K?: number
  cusum_H?: number
}

export interface RuleSetting {
  rule_code: string
  rule_name: string
  description: string
  is_active: boolean
  is_extension?: boolean
  default_enabled: boolean
  severity: "warning" | "reject"
  category: "westgard" | "extension"
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
          private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, "\n"),
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
      if (error.message?.includes("already exists")) {
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
      if (error.message?.includes("Unable to parse range") || error.message?.includes("not found")) {
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
  async getQCPoints(
    filters?: {
      analyte?: string
      level?: string
      instrument_id?: string
      lot_id?: string
      startDate?: string
      endDate?: string
    },
    pagination?: { page?: number; limit?: number },
  ): Promise<{ points: QCPoint[]; total: number }> {
    const data = await this.readSheet("qc_points")
    if (data.length === 0) return { points: [], total: 0 }

    const headers = data[0]
    const rows = data.slice(1)

    let points = rows.map((row) => {
      const point: any = {}
      headers.forEach((header, index) => {
        const value = row[index] || ""
        if (["shift_flag", "trend_flag"].includes(header)) {
          point[header] = value.toLowerCase() === "true"
        } else if (
          [
            "cusum_pos",
            "cusum_neg",
            "value",
            "z",
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
          point[header] = value ? Number.parseFloat(value) : 0
        } else if (header === "timestamp") {
          point[header] = this.normalizeTimestamp(value)
        } else {
          point[header] = value
        }
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

    const total = points.length

    // Apply pagination (only if limit is reasonable and less than total)
    if (pagination && pagination.page && pagination.limit && pagination.limit < points.length) {
      const { page, limit } = pagination
      const startIndex = (page - 1) * limit
      const endIndex = page * limit
      points = points.slice(startIndex, endIndex)
    }

    return { points, total }
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
      "shift_flag",
      "trend_flag",
      "cusum_pos",
      "cusum_neg",
      "violations_matrix_json",
      "root_cause",
      "corrective_action",
      "conclusion",
    ]

    const row = headers.map((header) => {
      const value = point[header as keyof QCPoint]
      return value !== undefined ? value.toString() : ""
    })
    await this.appendSheet("qc_points", [row])
  }

  async updateQCPointRCA(
    pointId: string,
    rca: {
      root_cause?: string
      corrective_action?: string
      conclusion?: string
    },
  ): Promise<void> {
    // This would require finding the specific row and updating it
    // For now, we'll implement a simple approach by reading all data, finding the row, and updating
    const data = await this.readSheet("qc_points")
    if (data.length === 0) return

    const headers = data[0]
    const rows = data.slice(1)

    // Find the row with matching ID (assuming first column is ID or we have an ID column)
    const rowIndex = rows.findIndex((row) => row[0] === pointId)
    if (rowIndex === -1) return

    // Update the specific fields
    const updatedRow = [...rows[rowIndex]]
    if (rca.root_cause !== undefined) {
      const rcIndex = headers.indexOf("root_cause")
      if (rcIndex !== -1) updatedRow[rcIndex] = rca.root_cause
    }
    if (rca.corrective_action !== undefined) {
      const caIndex = headers.indexOf("corrective_action")
      if (caIndex !== -1) updatedRow[caIndex] = rca.corrective_action
    }
    if (rca.conclusion !== undefined) {
      const conclusionIndex = headers.indexOf("conclusion")
      if (conclusionIndex !== -1) updatedRow[conclusionIndex] = rca.conclusion
    }

    // Write back the updated row
    const range = `qc_points!A${rowIndex + 2}:${String.fromCharCode(65 + headers.length - 1)}${rowIndex + 2}`
    await this.writeSheet("qc_points", [updatedRow], range)
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
        if (header.startsWith("enable_") || header === "is_locked") {
          limit[header] = value.toLowerCase() === "true"
        } else if (
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
        } else if (["qc_levels_per_run", "n_per_run"].includes(header)) {
          limit[header] = Number.parseInt(value) || (header === "n_per_run" ? 2 : 1)
        } else if (["cusum_K", "cusum_H"].includes(header)) {
          limit[header] = value ? Number.parseFloat(value) : header === "cusum_K" ? 0.5 : 4.0
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
      "enable_2of3_2s_reject",
      "enable_3_1s_reject",
      "enable_6x_reject",
      "enable_9x_reject",
      "enable_7T_reject",
      "n_per_run",
      "enable_cusum",
      "cusum_K",
      "cusum_H",
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
        if (header.startsWith("enable_") || header === "is_active") {
          config[header] = value.toLowerCase() === "true"
        } else if (["qc_levels_per_run", "n_per_run"].includes(header)) {
          config[header] = Number.parseInt(value) || (header === "n_per_run" ? 2 : 1)
        } else if (["cusum_K", "cusum_H"].includes(header)) {
          config[header] = value ? Number.parseFloat(value) : header === "cusum_K" ? 0.5 : 4.0
        } else {
          config[header] = value
        }
      })
      return config as WestgardConfig
    })
  }

  // Rule Settings operations
  async getRuleSettings(): Promise<RuleSetting[]> {
    const data = await this.readSheet("rule_settings")
    if (data.length === 0) return []

    const headers = data[0]
    const rows = data.slice(1)

    return rows.map((row) => {
      const setting: any = {}
      headers.forEach((header, index) => {
        const value = row[index] || ""
        if (["is_active", "is_extension", "default_enabled"].includes(header)) {
          setting[header] = value.toLowerCase() === "true"
        } else {
          setting[header] = value
        }
      })
      return setting as RuleSetting
    })
  }

  async addRuleSetting(setting: RuleSetting): Promise<void> {
    const headers = [
      "rule_code",
      "rule_name",
      "description",
      "is_active",
      "is_extension",
      "default_enabled",
      "severity",
      "category",
    ]

    const row = headers.map((header) => {
      const value = setting[header as keyof RuleSetting]
      return value !== undefined ? value.toString() : ""
    })
    await this.appendSheet("rule_settings", [row])
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

  /**
   * Normalize timestamp to ensure it's in a valid ISO format
   * Handles various timestamp formats from Google Sheets
   */
  private normalizeTimestamp(value: string): string {
    if (!value || value.trim() === "") {
      // Return current timestamp if empty
      return new Date().toISOString()
    }

    try {
      // Try to parse the value as a date
      const date = new Date(value)

      // Check if the date is valid
      if (!isNaN(date.getTime())) {
        return date.toISOString()
      }

      // If invalid, try to handle common Google Sheets date formats
      // Google Sheets sometimes exports dates as serial numbers
      const numericValue = Number(value)
      if (!isNaN(numericValue) && numericValue > 25569) {
        // Excel/Google Sheets serial date (days since 1900-01-01)
        // 25569 is 1970-01-01 in Excel serial date format
        const excelDate = new Date((numericValue - 25569) * 86400 * 1000)
        if (!isNaN(excelDate.getTime())) {
          return excelDate.toISOString()
        }
      }

      // If all else fails, return current timestamp
      console.warn("Could not parse timestamp:", value, "using current time")
      return new Date().toISOString()
    } catch (error) {
      console.warn("Error parsing timestamp:", value, error, "using current time")
      return new Date().toISOString()
    }
  }

  // Master Data operations
  async getTests(): Promise<Test[]> {
    const data = await this.readSheet("tests")
    if (data.length === 0) return []

    const headers = data[0]
    const rows = data.slice(1)

    return rows.map((row) => {
      const test: any = {}
      headers.forEach((header, index) => {
        const value = row[index] || ""
        if (header === "is_active") {
          test[header] = value.toLowerCase() === "true"
        } else if (["reference_range_low", "reference_range_high", "critical_low", "critical_high"].includes(header)) {
          test[header] = value ? Number.parseFloat(value) : undefined
        } else {
          test[header] = value
        }
      })
      return test as Test
    })
  }

  async getDevices(): Promise<Device[]> {
    const data = await this.readSheet("devices")
    if (data.length === 0) return []

    const headers = data[0]
    const rows = data.slice(1)

    return rows.map((row) => {
      const device: any = {}
      headers.forEach((header, index) => {
        const value = row[index] || ""
        if (header === "is_active") {
          device[header] = value.toLowerCase() === "true"
        } else {
          device[header] = value
        }
      })
      return device as Device
    })
  }

  async getQCLots(): Promise<QCLot[]> {
    const data = await this.readSheet("qc_lots")
    if (data.length === 0) return []

    const headers = data[0]
    const rows = data.slice(1)

    return rows.map((row) => {
      const lot: any = {}
      headers.forEach((header, index) => {
        const value = row[index] || ""
        if (header === "is_active") {
          lot[header] = value.toLowerCase() === "true"
        } else if (["mean_mfg", "sd_mfg"].includes(header)) {
          lot[header] = value ? Number.parseFloat(value) : undefined
        } else {
          lot[header] = value
        }
      })
      return lot as QCLot
    })
  }

  async addTest(test: Omit<Test, "test_id"> & { test_id?: string }): Promise<void> {
    const testId = test.test_id || `TEST_${Date.now()}`
    const row = [
      testId,
      test.test_name,
      test.unit,
      test.is_active.toString(),
      test.reference_range_low?.toString() || "",
      test.reference_range_high?.toString() || "",
      test.critical_low?.toString() || "",
      test.critical_high?.toString() || "",
      test.notes || "",
    ]
    await this.appendSheet("tests", [row])
  }

  async addDevice(device: Omit<Device, "device_id"> & { device_id?: string }): Promise<void> {
    const deviceId = device.device_id || `DEV_${Date.now()}`
    const row = [
      deviceId,
      device.device_name,
      device.serial_number,
      device.manufacturer || "",
      device.model || "",
      device.installation_date || "",
      device.last_maintenance || "",
      device.is_active.toString(),
      device.notes || "",
    ]
    await this.appendSheet("devices", [row])
  }

  async addQCLot(lot: Omit<QCLot, "lot_id"> & { lot_id?: string }): Promise<void> {
    const lotId = lot.lot_id || `LOT_${Date.now()}`
    const row = [
      lotId,
      lot.test_id,
      lot.level,
      lot.lot_number,
      lot.expiry_date,
      lot.mean_mfg?.toString() || "",
      lot.sd_mfg?.toString() || "",
      lot.manufacturer || "",
      lot.product_name || "",
      lot.is_active.toString(),
      lot.notes || "",
    ]
    await this.appendSheet("qc_lots", [row])
  }

  // System Settings operations
  async getSystemSettings(): Promise<any | null> {
    const data = await this.readSheet("system_config", "A1:Z1000"); // Read the first row
    if (data.length < 2) return null; // Headers + at least one data row

    const headers = data[0];
    const values = data[1];
    const settings: { [key: string]: any } = {};

    headers.forEach((header, index) => {
      const value = values[index];
      if (value && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')) {
        settings[header] = value.toLowerCase() === 'true';
      } else {
        settings[header] = value;
      }
    });
    return settings;
  }

  async updateSystemSettings(settings: { [key: string]: any }): Promise<void> {
    const headers = (await this.readSheet("system_config", "A1:Z1"))[0];
    if (!headers) {
      throw new Error("System config sheet or headers not found.");
    }
    const orderedValues = headers.map(header => settings[header] ?? "");
    // Write to the second row (A2:Z2) to avoid overwriting headers
    await this.writeSheet("system_config", [orderedValues], `A2:${String.fromCharCode(65 + headers.length - 1)}2`);
  }

  // QC Levels operations
  async getQCLevels(): Promise<any[]> {
    const data = await this.readSheet("qc_levels");
    if (data.length < 2) return [];
    const headers = data[0];
    const rows = data.slice(1);
    return rows.map(row => {
      const level: { [key: string]: any } = {};
      headers.forEach((header, index) => {
        level[header] = row[index];
      });
      return level;
    });
  }

  async addQCLevel(level: any): Promise<void> {
    const headers = (await this.readSheet("qc_levels", "A1:Z1"))[0];
    if (!headers) throw new Error("QC Levels sheet headers not found.");
    const row = headers.map(header => level[header] ?? "");
    await this.appendSheet("qc_levels", [row]);
  }

  async updateQCLevel(level: any): Promise<void> {
    const data = await this.readSheet("qc_levels");
    if (data.length < 2) throw new Error("QC Levels not found.");
    const headers = data[0];
    const idIndex = headers.indexOf("id");
    if (idIndex === -1) throw new Error("'id' column not found in qc_levels sheet.");

    const rowIndex = data.slice(1).findIndex(row => row[idIndex] === level.id);
    if (rowIndex === -1) throw new Error(`QC Level with ID ${level.id} not found.`);

    const currentRow = data[rowIndex + 1];
    const updatedRow = headers.map((header, index) => level[header] ?? currentRow[index]);

    const range = `qc_levels!A${rowIndex + 2}:${String.fromCharCode(65 + headers.length - 1)}${rowIndex + 2}`;
    await this.writeSheet("qc_levels", [updatedRow], range);
  }

  async deleteQCLevel(id: string): Promise<void> {
    // This performs a soft delete by marking the level as inactive.
    const data = await this.readSheet("qc_levels");
    if (data.length < 2) return;
    const headers = data[0];
    const idIndex = headers.indexOf("id");
    const activeIndex = headers.indexOf("is_active");
    if (idIndex === -1 || activeIndex === -1) throw new Error("'id' or 'is_active' column not found in qc_levels");

    const rowIndex = data.slice(1).findIndex(row => row[idIndex] === id);
    if (rowIndex === -1) return; // Not found, do nothing

    const range = `qc_levels!${String.fromCharCode(65 + activeIndex)}${rowIndex + 2}`;
    await this.writeSheet("qc_levels", [["FALSE"]], range);
  }

  // Analyte Categories
  async getAnalyteCategories(): Promise<string[]> {
    const data = await this.readSheet("analyte_categories", "A:A");
    return data.flat().filter(cat => cat); // Flatten and remove empty values
  }

  // Batch operations for import
  async batchUpdateAnalytes(analytes: any[]): Promise<void> {
    // This clears the sheet and writes the new data.
    const headers = ["id", "name", "unit", "category", "normalRange.min", "normalRange.max", "criticalRange.min", "criticalRange.max", "decimalPlaces", "isActive"];
    const values = analytes.map(a => [a.id, a.name, a.unit, a.category, a.normalRange.min, a.normalRange.max, a.criticalRange.min, a.criticalRange.max, a.decimalPlaces, a.isActive]);
    const data = [headers, ...values];
    await this.writeSheet("analytes", data);
  }

  async batchUpdateInstruments(instruments: any[]): Promise<void> {
    const headers = ["id", "name", "model", "serialNumber", "manufacturer", "location", "status", "installDate", "lastCalibration", "nextCalibration", "notes"];
    const values = instruments.map(i => [i.id, i.name, i.model, i.serialNumber, i.manufacturer, i.location, i.status, i.installDate, i.lastCalibration, i.nextCalibration, i.notes]);
    const data = [headers, ...values];
    await this.writeSheet("instruments", data);
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
