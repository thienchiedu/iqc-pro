import { getSheetsService } from "../lib/google-sheets"

interface VerificationResult {
  success: boolean
  message: string
  checks: { name: string; passed: boolean; details: string }[]
}

export class MigrationVerification {
  private sheetsService = getSheetsService()

  async verifyMigration(): Promise<VerificationResult> {
    const checks: { name: string; passed: boolean; details: string }[] = []

    try {
      console.log("[Verification] Starting migration verification...")

      // Check westgard_config sheet
      await this.verifyWestgardConfig(checks)

      // Check qc_points sheet
      await this.verifyQCPoints(checks)

      // Check rule_settings sheet
      await this.verifyRuleSettings(checks)

      // Check backward compatibility
      await this.verifyBackwardCompatibility(checks)

      const allPassed = checks.every((check) => check.passed)

      return {
        success: allPassed,
        message: allPassed ? "All verification checks passed" : "Some verification checks failed",
        checks,
      }
    } catch (error) {
      return {
        success: false,
        message: `Verification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        checks,
      }
    }
  }

  private async verifyWestgardConfig(checks: { name: string; passed: boolean; details: string }[]): Promise<void> {
    try {
      const data = await this.sheetsService.readSheet("westgard_config")

      if (data.length === 0) {
        checks.push({
          name: "westgard_config exists",
          passed: false,
          details: "Sheet is empty",
        })
        return
      }

      const headers = data[0]
      const requiredNewColumns = [
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

      const missingColumns = requiredNewColumns.filter((col) => !headers.includes(col))

      checks.push({
        name: "westgard_config new columns",
        passed: missingColumns.length === 0,
        details:
          missingColumns.length === 0 ? "All new columns present" : `Missing columns: ${missingColumns.join(", ")}`,
      })

      // Verify default values
      if (data.length > 1) {
        const sampleRow = data[1]
        const enableColumns = requiredNewColumns.filter((col) => col.startsWith("enable_"))
        let defaultsCorrect = true

        for (const col of enableColumns) {
          const colIndex = headers.indexOf(col)
          if (colIndex !== -1 && sampleRow[colIndex] && sampleRow[colIndex].toLowerCase() !== "false") {
            defaultsCorrect = false
            break
          }
        }

        checks.push({
          name: "westgard_config default values",
          passed: defaultsCorrect,
          details: defaultsCorrect ? "Default values are FALSE" : "Some enable flags not set to FALSE",
        })
      }
    } catch (error) {
      checks.push({
        name: "westgard_config verification",
        passed: false,
        details: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    }
  }

  private async verifyQCPoints(checks: { name: string; passed: boolean; details: string }[]): Promise<void> {
    try {
      const data = await this.sheetsService.readSheet("qc_points")

      if (data.length === 0) {
        checks.push({
          name: "qc_points exists",
          passed: true,
          details: "Sheet exists (empty is OK)",
        })
        return
      }

      const headers = data[0]
      const requiredNewColumns = [
        "shift_flag",
        "trend_flag",
        "cusum_pos",
        "cusum_neg",
        "violations_matrix_json",
        "root_cause",
        "corrective_action",
        "conclusion",
      ]

      const missingColumns = requiredNewColumns.filter((col) => !headers.includes(col))

      checks.push({
        name: "qc_points new columns",
        passed: missingColumns.length === 0,
        details:
          missingColumns.length === 0 ? "All new columns present" : `Missing columns: ${missingColumns.join(", ")}`,
      })
    } catch (error) {
      checks.push({
        name: "qc_points verification",
        passed: false,
        details: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    }
  }

  private async verifyRuleSettings(checks: { name: string; passed: boolean; details: string }[]): Promise<void> {
    try {
      const data = await this.sheetsService.readSheet("rule_settings")

      if (data.length === 0) {
        checks.push({
          name: "rule_settings exists",
          passed: false,
          details: "Sheet is empty",
        })
        return
      }

      const headers = data[0]
      const requiredColumns = [
        "rule_code",
        "rule_name",
        "description",
        "is_active",
        "is_extension",
        "default_enabled",
        "severity",
        "category",
      ]

      const missingColumns = requiredColumns.filter((col) => !headers.includes(col))

      checks.push({
        name: "rule_settings columns",
        passed: missingColumns.length === 0,
        details:
          missingColumns.length === 0
            ? "All required columns present"
            : `Missing columns: ${missingColumns.join(", ")}`,
      })

      // Check for new rules
      const rules = data.slice(1).map((row) => row[0]) // rule_code is first column
      const requiredNewRules = ["2of3_2s", "3_1s", "6x", "9x", "7T"]
      const missingRules = requiredNewRules.filter((rule) => !rules.includes(rule))

      checks.push({
        name: "rule_settings new rules",
        passed: missingRules.length === 0,
        details: missingRules.length === 0 ? "All new rules present" : `Missing rules: ${missingRules.join(", ")}`,
      })

      // Verify 7T is marked as extension
      const sevenTRow = data.find((row) => row[0] === "7T")
      if (sevenTRow) {
        const isExtensionIndex = headers.indexOf("is_extension")
        const isExtension = isExtensionIndex !== -1 ? sevenTRow[isExtensionIndex] : ""

        checks.push({
          name: "7T extension flag",
          passed: isExtension.toLowerCase() === "true",
          details:
            isExtension.toLowerCase() === "true" ? "7T correctly marked as extension" : "7T not marked as extension",
        })
      }
    } catch (error) {
      checks.push({
        name: "rule_settings verification",
        passed: false,
        details: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    }
  }

  private async verifyBackwardCompatibility(
    checks: { name: string; passed: boolean; details: string }[],
  ): Promise<void> {
    // This would test that existing functionality still works
    // For now, we'll just verify that old columns still exist

    try {
      const configData = await this.sheetsService.readSheet("westgard_config")
      if (configData.length > 0) {
        const headers = configData[0]
        const oldColumns = [
          "analyte",
          "level",
          "instrument_id",
          "enable_1_3s_reject",
          "enable_2_2s_within_run_reject",
          "enable_4_1s_reject",
          "enable_10x_reject",
        ]

        const missingOldColumns = oldColumns.filter((col) => !headers.includes(col))

        checks.push({
          name: "backward compatibility",
          passed: missingOldColumns.length === 0,
          details:
            missingOldColumns.length === 0
              ? "All original columns preserved"
              : `Missing original columns: ${missingOldColumns.join(", ")}`,
        })
      }
    } catch (error) {
      checks.push({
        name: "backward compatibility",
        passed: false,
        details: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    }
  }
}

// CLI execution
if (require.main === module) {
  const verification = new MigrationVerification()

  verification
    .verifyMigration()
    .then((result) => {
      console.log("\n=== Verification Result ===")
      console.log(`Status: ${result.success ? "PASSED" : "FAILED"}`)
      console.log(`Message: ${result.message}`)
      console.log("\nChecks:")
      result.checks.forEach((check) => {
        const status = check.passed ? "✓" : "✗"
        console.log(`  ${status} ${check.name}: ${check.details}`)
      })

      process.exit(result.success ? 0 : 1)
    })
    .catch((error) => {
      console.error("Verification failed:", error)
      process.exit(1)
    })
}
