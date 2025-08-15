import { getSheetsService } from "../lib/google-sheets"

interface MigrationResult {
  success: boolean
  message: string
  changes: string[]
}

export class WestgardPatchMigration {
  private sheetsService = getSheetsService()

  async runMigration(): Promise<MigrationResult> {
    const changes: string[] = []

    try {
      console.log("[Migration] Starting Westgard Patch Migration...")

      // Step 1: Migrate westgard_config sheet
      await this.migrateWestgardConfig()
      changes.push("Added new columns to westgard_config sheet")

      // Step 2: Migrate qc_points sheet
      await this.migrateQCPoints()
      changes.push("Added new columns to qc_points sheet")

      // Step 3: Ensure rule_settings sheet exists and seed new rules
      await this.migrateRuleSettings()
      changes.push("Created/updated rule_settings sheet with new rules")

      console.log("[Migration] Westgard Patch Migration completed successfully")

      return {
        success: true,
        message: "Migration completed successfully",
        changes,
      }
    } catch (error) {
      console.error("[Migration] Error during migration:", error)
      return {
        success: false,
        message: `Migration failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        changes,
      }
    }
  }

  private async migrateWestgardConfig(): Promise<void> {
    console.log("[Migration] Migrating westgard_config sheet...")

    // Ensure sheet exists
    await this.sheetsService.ensureSheetExists("westgard_config")

    // Read current data
    const data = await this.sheetsService.readSheet("westgard_config")

    if (data.length === 0) {
      // Create headers if sheet is empty
      const headers = [
        "analyte",
        "level",
        "instrument_id",
        "qc_levels_per_run",
        "profile",
        "enable_1_2s_warning",
        "enable_1_3s_reject",
        "enable_2_2s_within_run_reject",
        "enable_2_2s_across_runs_reject",
        "enable_R_4s_within_run_reject",
        "enable_4_1s_reject",
        "enable_10x_reject",
        "action_default",
        "notes",
        // New columns with safe defaults
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

      await this.sheetsService.writeSheet("westgard_config", [headers])
      console.log("[Migration] Created westgard_config headers")
      return
    }

    const headers = data[0]
    const newColumns = [
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

    // Check which columns need to be added
    const columnsToAdd = newColumns.filter((col) => !headers.includes(col))

    if (columnsToAdd.length > 0) {
      // Add new column headers
      const updatedHeaders = [...headers, ...columnsToAdd]

      // Update existing rows with default values
      const updatedData = [updatedHeaders]

      for (let i = 1; i < data.length; i++) {
        const row = [...data[i]]
        // Pad row to match header length
        while (row.length < headers.length) {
          row.push("")
        }
        // Add default values for new columns
        for (const col of columnsToAdd) {
          if (col === "n_per_run") {
            row.push("2") // Default N=2
          } else if (col === "cusum_K") {
            row.push("0.5") // Default K=0.5
          } else if (col === "cusum_H") {
            row.push("4.0") // Default H=4.0
          } else {
            row.push("FALSE") // All enable flags default to FALSE
          }
        }
        updatedData.push(row)
      }

      await this.sheetsService.writeSheet("westgard_config", updatedData)
      console.log(`[Migration] Added ${columnsToAdd.length} new columns to westgard_config`)
    }
  }

  private async migrateQCPoints(): Promise<void> {
    console.log("[Migration] Migrating qc_points sheet...")

    // Ensure sheet exists
    await this.sheetsService.ensureSheetExists("qc_points")

    // Read current data
    const data = await this.sheetsService.readSheet("qc_points")

    if (data.length === 0) {
      // Create headers if sheet is empty
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
        // New columns
        "shift_flag",
        "trend_flag",
        "cusum_pos",
        "cusum_neg",
        "violations_matrix_json",
        "root_cause",
        "corrective_action",
        "conclusion",
      ]

      await this.sheetsService.writeSheet("qc_points", [headers])
      console.log("[Migration] Created qc_points headers")
      return
    }

    const headers = data[0]
    const newColumns = [
      "shift_flag",
      "trend_flag",
      "cusum_pos",
      "cusum_neg",
      "violations_matrix_json",
      "root_cause",
      "corrective_action",
      "conclusion",
    ]

    // Check which columns need to be added
    const columnsToAdd = newColumns.filter((col) => !headers.includes(col))

    if (columnsToAdd.length > 0) {
      // Add new column headers
      const updatedHeaders = [...headers, ...columnsToAdd]

      // Update existing rows with default values
      const updatedData = [updatedHeaders]

      for (let i = 1; i < data.length; i++) {
        const row = [...data[i]]
        // Pad row to match header length
        while (row.length < headers.length) {
          row.push("")
        }
        // Add default values for new columns
        for (const col of columnsToAdd) {
          if (col === "shift_flag" || col === "trend_flag") {
            row.push("FALSE")
          } else if (col === "cusum_pos" || col === "cusum_neg") {
            row.push("0")
          } else {
            row.push("") // Text fields default to empty
          }
        }
        updatedData.push(row)
      }

      await this.sheetsService.writeSheet("qc_points", updatedData)
      console.log(`[Migration] Added ${columnsToAdd.length} new columns to qc_points`)
    }
  }

  private async migrateRuleSettings(): Promise<void> {
    console.log("[Migration] Migrating rule_settings sheet...")

    // Ensure sheet exists
    await this.sheetsService.ensureSheetExists("rule_settings")

    // Read current data
    const data = await this.sheetsService.readSheet("rule_settings")

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

    if (data.length === 0) {
      // Create headers and seed all rules
      await this.sheetsService.writeSheet("rule_settings", [headers])
      await this.seedAllRuleSettings()
      console.log("[Migration] Created rule_settings sheet and seeded all rules")
      return
    }

    // Check if new rules exist
    const existingRules = data.slice(1).map((row) => row[0]) // rule_code is first column
    const newRules = [
      {
        rule_code: "2of3_2s",
        rule_name: "2 of 3 exceed ±2SD",
        description: "2 out of 3 consecutive points exceed ±2SD on same side",
        is_active: "FALSE",
        is_extension: "FALSE",
        default_enabled: "FALSE",
        severity: "reject",
        category: "westgard",
      },
      {
        rule_code: "3_1s",
        rule_name: "3 consecutive exceed ±1SD",
        description: "3 consecutive points exceed ±1SD on same side",
        is_active: "FALSE",
        is_extension: "FALSE",
        default_enabled: "FALSE",
        severity: "reject",
        category: "westgard",
      },
      {
        rule_code: "6x",
        rule_name: "6 consecutive same side",
        description: "6 consecutive points on same side of mean",
        is_active: "FALSE",
        is_extension: "FALSE",
        default_enabled: "FALSE",
        severity: "reject",
        category: "westgard",
      },
      {
        rule_code: "9x",
        rule_name: "9 consecutive same side",
        description: "9 consecutive points on same side of mean",
        is_active: "FALSE",
        is_extension: "FALSE",
        default_enabled: "FALSE",
        severity: "reject",
        category: "westgard",
      },
      {
        rule_code: "7T",
        rule_name: "7 point trend",
        description: "7 consecutive points showing consistent trend",
        is_active: "FALSE",
        is_extension: "TRUE", // Only 7T is marked as extension
        default_enabled: "FALSE",
        severity: "reject",
        category: "extension",
      },
    ]

    // Add missing rules
    const rulesToAdd = newRules.filter((rule) => !existingRules.includes(rule.rule_code))

    if (rulesToAdd.length > 0) {
      const rowsToAdd = rulesToAdd.map((rule) => [
        rule.rule_code,
        rule.rule_name,
        rule.description,
        rule.is_active,
        rule.is_extension,
        rule.default_enabled,
        rule.severity,
        rule.category,
      ])

      await this.sheetsService.appendSheet("rule_settings", rowsToAdd)
      console.log(`[Migration] Added ${rulesToAdd.length} new rules to rule_settings`)
    }
  }

  private async seedAllRuleSettings(): Promise<void> {
    const allRules = [
      // Existing rules
      {
        rule_code: "1_2s",
        rule_name: "Single point ±2SD",
        description: "Single point exceeds ±2SD (warning)",
        is_active: "TRUE",
        is_extension: "FALSE",
        default_enabled: "TRUE",
        severity: "warning",
        category: "westgard",
      },
      {
        rule_code: "1_3s",
        rule_name: "Single point ±3SD",
        description: "Single point exceeds ±3SD",
        is_active: "TRUE",
        is_extension: "FALSE",
        default_enabled: "TRUE",
        severity: "reject",
        category: "westgard",
      },
      {
        rule_code: "2_2s_within",
        rule_name: "2 points ±2SD within run",
        description: "2 points in same run exceed ±2SD on same side",
        is_active: "TRUE",
        is_extension: "FALSE",
        default_enabled: "TRUE",
        severity: "reject",
        category: "westgard",
      },
      {
        rule_code: "2_2s_across",
        rule_name: "2 points ±2SD across runs",
        description: "2 consecutive points same level exceed ±2SD on same side",
        is_active: "TRUE",
        is_extension: "FALSE",
        default_enabled: "TRUE",
        severity: "reject",
        category: "westgard",
      },
      {
        rule_code: "R_4s",
        rule_name: "Range 4SD within run",
        description: "Range between 2 points in same run exceeds 4SD",
        is_active: "TRUE",
        is_extension: "FALSE",
        default_enabled: "TRUE",
        severity: "reject",
        category: "westgard",
      },
      {
        rule_code: "4_1s",
        rule_name: "4 consecutive ±1SD",
        description: "4 consecutive points exceed ±1SD on same side",
        is_active: "TRUE",
        is_extension: "FALSE",
        default_enabled: "TRUE",
        severity: "reject",
        category: "westgard",
      },
      {
        rule_code: "10x",
        rule_name: "10 consecutive same side",
        description: "10 consecutive points on same side of mean",
        is_active: "TRUE",
        is_extension: "FALSE",
        default_enabled: "TRUE",
        severity: "reject",
        category: "westgard",
      },
      // New rules (all inactive by default)
      {
        rule_code: "2of3_2s",
        rule_name: "2 of 3 exceed ±2SD",
        description: "2 out of 3 consecutive points exceed ±2SD on same side",
        is_active: "FALSE",
        is_extension: "FALSE",
        default_enabled: "FALSE",
        severity: "reject",
        category: "westgard",
      },
      {
        rule_code: "3_1s",
        rule_name: "3 consecutive exceed ±1SD",
        description: "3 consecutive points exceed ±1SD on same side",
        is_active: "FALSE",
        is_extension: "FALSE",
        default_enabled: "FALSE",
        severity: "reject",
        category: "westgard",
      },
      {
        rule_code: "6x",
        rule_name: "6 consecutive same side",
        description: "6 consecutive points on same side of mean",
        is_active: "FALSE",
        is_extension: "FALSE",
        default_enabled: "FALSE",
        severity: "reject",
        category: "westgard",
      },
      {
        rule_code: "9x",
        rule_name: "9 consecutive same side",
        description: "9 consecutive points on same side of mean",
        is_active: "FALSE",
        is_extension: "FALSE",
        default_enabled: "FALSE",
        severity: "reject",
        category: "westgard",
      },
      {
        rule_code: "7T",
        rule_name: "7 point trend",
        description: "7 consecutive points showing consistent trend",
        is_active: "FALSE",
        is_extension: "TRUE", // Only 7T is extension
        default_enabled: "FALSE",
        severity: "reject",
        category: "extension",
      },
    ]

    const rows = allRules.map((rule) => [
      rule.rule_code,
      rule.rule_name,
      rule.description,
      rule.is_active,
      rule.is_extension,
      rule.default_enabled,
      rule.severity,
      rule.category,
    ])

    await this.sheetsService.appendSheet("rule_settings", rows)
  }

  async rollback(): Promise<MigrationResult> {
    console.log("[Migration] Rollback not implemented - new columns contain safe defaults")
    console.log("[Migration] To rollback, manually remove the new columns from Google Sheets")

    return {
      success: false,
      message: "Rollback not implemented - migration uses safe defaults",
      changes: [],
    }
  }
}

// CLI execution
if (require.main === module) {
  const migration = new WestgardPatchMigration()

  migration
    .runMigration()
    .then((result) => {
      console.log("\n=== Migration Result ===")
      console.log(`Status: ${result.success ? "SUCCESS" : "FAILED"}`)
      console.log(`Message: ${result.message}`)
      console.log("Changes:")
      result.changes.forEach((change) => console.log(`  - ${change}`))

      process.exit(result.success ? 0 : 1)
    })
    .catch((error) => {
      console.error("Migration failed:", error)
      process.exit(1)
    })
}
