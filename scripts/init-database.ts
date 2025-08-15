import { getSheetsService } from "../lib/google-sheets"

async function initializeDatabase() {
  console.log("[v0] Starting database initialization...")

  try {
    const sheetsService = getSheetsService()

    // Initialize qc_points sheet
    console.log("[v0] Initializing qc_points sheet...")
    await sheetsService.ensureSheetExists("qc_points")
    const qcPointsHeaders = [
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
    await sheetsService.writeSheet("qc_points", [qcPointsHeaders], "A1:M1")

    // Initialize qc_limits sheet
    console.log("[v0] Initializing qc_limits sheet...")
    await sheetsService.ensureSheetExists("qc_limits")
    const qcLimitsHeaders = [
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
    await sheetsService.writeSheet("qc_limits", [qcLimitsHeaders], "A1:S1")

    // Initialize westgard_config sheet
    console.log("[v0] Initializing westgard_config sheet...")
    await sheetsService.ensureSheetExists("westgard_config")
    const westgardHeaders = [
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
    ]
    await sheetsService.writeSheet("westgard_config", [westgardHeaders], "A1:N1")

    // Initialize violations sheet
    console.log("[v0] Initializing violations sheet...")
    await sheetsService.ensureSheetExists("violations")
    const violationsHeaders = [
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
    await sheetsService.writeSheet("violations", [violationsHeaders], "A1:L1")

    // Initialize users sheet
    console.log("[v0] Initializing users sheet...")
    await sheetsService.ensureSheetExists("users")
    const usersHeaders = [
      "user_id",
      "username",
      "email",
      "password_hash",
      "role",
      "full_name",
      "created_at",
      "last_login",
      "is_active",
    ]
    await sheetsService.writeSheet("users", [usersHeaders], "A1:I1")

    // Add sample data
    console.log("[v0] Adding sample configuration data...")

    // Sample Westgard config
    const sampleWestgardConfig = [
      [
        "Glucose",
        "Level 1",
        "INST001",
        "2",
        "strict",
        "true",
        "true",
        "true",
        "true",
        "true",
        "true",
        "false",
        "reject",
        "Default strict profile for Glucose Level 1",
      ],
      [
        "Glucose",
        "Level 2",
        "INST001",
        "2",
        "strict",
        "true",
        "true",
        "true",
        "true",
        "true",
        "true",
        "false",
        "reject",
        "Default strict profile for Glucose Level 2",
      ],
    ]
    await sheetsService.appendSheet("westgard_config", sampleWestgardConfig)

    // Sample QC limits
    const sampleQCLimits = [
      [
        "Glucose",
        "Level 1",
        "INST001",
        "LOT001",
        "100.0",
        "5.0",
        "lab",
        new Date().toISOString().split("T")[0],
        "",
        "false",
        "",
        "",
        "95.0",
        "105.0",
        "90.0",
        "110.0",
        "85.0",
        "115.0",
        "Initial limits established",
      ],
      [
        "Glucose",
        "Level 2",
        "INST001",
        "LOT001",
        "300.0",
        "15.0",
        "lab",
        new Date().toISOString().split("T")[0],
        "",
        "false",
        "",
        "",
        "285.0",
        "315.0",
        "270.0",
        "330.0",
        "255.0",
        "345.0",
        "Initial limits established",
      ],
    ]
    await sheetsService.appendSheet("qc_limits", sampleQCLimits)

    console.log("[v0] Database initialization completed successfully!")
    return { success: true, message: "Database initialized successfully" }
  } catch (error) {
    console.error("[v0] Database initialization failed:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, error: errorMessage }
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase()
    .then((result) => {
      console.log("[v0] Result:", result)
      process.exit(result.success ? 0 : 1)
    })
    .catch((error) => {
      console.error("[v0] Fatal error:", error)
      process.exit(1)
    })
}

export { initializeDatabase }
