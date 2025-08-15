import { WestgardAcceptanceTests } from "./westgard-acceptance-tests"
import { MigrationVerification } from "./verify-migration"

async function runAllTests() {
  console.log("🚀 Starting comprehensive test suite for Westgard Patch...")

  // Step 1: Verify migration
  console.log("\n📋 Step 1: Verifying migration...")
  const migrationVerification = new MigrationVerification()
  const migrationResult = await migrationVerification.verifyMigration()

  if (!migrationResult.success) {
    console.error("❌ Migration verification failed. Cannot proceed with acceptance tests.")
    console.log("Migration issues:")
    migrationResult.checks.forEach((check) => {
      if (!check.passed) {
        console.log(`  ❌ ${check.name}: ${check.details}`)
      }
    })
    process.exit(1)
  }

  console.log("✅ Migration verification passed")

  // Step 2: Run acceptance tests
  console.log("\n📋 Step 2: Running Westgard acceptance tests...")
  const acceptanceTests = new WestgardAcceptanceTests()
  const acceptanceResult = await acceptanceTests.runAllTests()

  acceptanceTests.printResults()

  // Step 3: Generate summary report
  console.log("\n📊 COMPREHENSIVE TEST SUMMARY")
  console.log("=".repeat(50))
  console.log(`Migration Verification: ${migrationResult.success ? "✅ PASSED" : "❌ FAILED"}`)
  console.log(`Acceptance Tests: ${acceptanceResult.passed ? "✅ PASSED" : "❌ FAILED"}`)

  const overallSuccess = migrationResult.success && acceptanceResult.passed

  console.log(`\n🎯 OVERALL RESULT: ${overallSuccess ? "✅ ALL SYSTEMS GO" : "❌ ISSUES DETECTED"}`)

  if (overallSuccess) {
    console.log("\n🎉 Westgard Patch is ready for deployment!")
    console.log("✅ All rules comply with Westgard standards")
    console.log("✅ Backward compatibility maintained")
    console.log("✅ Database migration successful")
  } else {
    console.log("\n⚠️  Please address the issues above before deployment")
  }

  process.exit(overallSuccess ? 0 : 1)
}

// Execute if run directly
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error("Test suite execution failed:", error)
    process.exit(1)
  })
}
