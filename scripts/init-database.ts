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

    // Initialize tests sheet (Master data)
    console.log("[v0] Initializing tests sheet...")
    await sheetsService.ensureSheetExists("tests")
    const testsHeaders = [
      "test_id",
      "test_name",
      "unit",
      "is_active",
      "reference_range_low",
      "reference_range_high",
      "critical_low",
      "critical_high",
      "notes",
    ]
    await sheetsService.writeSheet("tests", [testsHeaders], "A1:I1")

    // Initialize devices sheet (Master data)
    console.log("[v0] Initializing devices sheet...")
    await sheetsService.ensureSheetExists("devices")
    const devicesHeaders = [
      "device_id",
      "device_name",
      "serial_number",
      "manufacturer",
      "model",
      "installation_date",
      "last_maintenance",
      "is_active",
      "notes",
    ]
    await sheetsService.writeSheet("devices", [devicesHeaders], "A1:I1")

    // Initialize qc_lots sheet (Master data)
    console.log("[v0] Initializing qc_lots sheet...")
    await sheetsService.ensureSheetExists("qc_lots")
    const qcLotsHeaders = [
      "lot_id",
      "test_id",
      "level",
      "lot_number",
      "expiry_date",
      "mean_mfg",
      "sd_mfg",
      "manufacturer",
      "product_name",
      "is_active",
      "notes",
    ]
    await sheetsService.writeSheet("qc_lots", [qcLotsHeaders], "A1:K1")

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

    // Sample tests data
    const sampleTests = [
      ["GLU", "Glucose", "mg/dL", "true", "70", "100", "40", "400", "Blood glucose test"],
      ["CHOL", "Cholesterol", "mg/dL", "true", "150", "200", "100", "400", "Total cholesterol"],
      ["TG", "Triglycerides", "mg/dL", "true", "50", "150", "30", "500", "Triglycerides test"],
      ["HDL", "HDL Cholesterol", "mg/dL", "true", "40", "60", "20", "100", "High-density lipoprotein"],
      ["LDL", "LDL Cholesterol", "mg/dL", "true", "100", "130", "50", "200", "Low-density lipoprotein"],
      ["ALT", "ALT (SGPT)", "U/L", "true", "7", "40", "5", "200", "Alanine aminotransferase"],
      ["AST", "AST (SGOT)", "U/L", "true", "8", "40", "5", "200", "Aspartate aminotransferase"],
      ["ALP", "Alkaline Phosphatase", "U/L", "true", "44", "147", "20", "300", "Alkaline phosphatase"],
      ["GGT", "Gamma GT", "U/L", "true", "9", "48", "5", "200", "Gamma-glutamyl transferase"],
      ["TBIL", "Total Bilirubin", "mg/dL", "true", "0.3", "1.2", "0.1", "20", "Total bilirubin"],
    ]
    await sheetsService.appendSheet("tests", sampleTests)

    // Sample devices data
    const sampleDevices = [
      ["COBAS_C311", "Cobas C311", "C311001", "Roche", "C311", "2023-01-15", "2024-12-01", "true", "Chemistry analyzer"],
      ["COBAS_C501", "Cobas C501", "C501001", "Roche", "C501", "2023-02-20", "2024-11-15", "true", "High-throughput chemistry analyzer"],
      ["ARCHITECT_C4000", "Architect C4000", "AC4000001", "Abbott", "C4000", "2023-03-10", "2024-10-20", "true", "Clinical chemistry analyzer"],
      ["VITROS_5600", "Vitros 5600", "V5600001", "Ortho Clinical Diagnostics", "5600", "2023-04-05", "2024-09-30", "true", "Integrated chemistry system"],
      ["AU5800", "AU5800", "AU5800001", "Beckman Coulter", "AU5800", "2023-05-12", "2024-08-25", "true", "Clinical chemistry analyzer"],
    ]
    await sheetsService.appendSheet("devices", sampleDevices)

    // Sample QC lots data
    const sampleQCLots = [
      ["LOT001", "GLU", "Level 1", "QC001L1", "2025-12-31", "100.0", "5.0", "Bio-Rad", "Lyphochek Chemistry Control", "true", "Low level glucose control"],
      ["LOT002", "GLU", "Level 2", "QC001L2", "2025-12-31", "300.0", "15.0", "Bio-Rad", "Lyphochek Chemistry Control", "true", "High level glucose control"],
      ["LOT003", "CHOL", "Level 1", "QC002L1", "2025-11-30", "150.0", "8.0", "Bio-Rad", "Lyphochek Chemistry Control", "true", "Low level cholesterol control"],
      ["LOT004", "CHOL", "Level 2", "QC002L2", "2025-11-30", "250.0", "12.0", "Bio-Rad", "Lyphochek Chemistry Control", "true", "High level cholesterol control"],
      ["LOT005", "ALT", "Level 1", "QC003L1", "2025-10-31", "25.0", "3.0", "Bio-Rad", "Lyphochek Chemistry Control", "true", "Low level ALT control"],
      ["LOT006", "ALT", "Level 2", "QC003L2", "2025-10-31", "80.0", "8.0", "Bio-Rad", "Lyphochek Chemistry Control", "true", "High level ALT control"],
    ]
    await sheetsService.appendSheet("qc_lots", sampleQCLots)

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
