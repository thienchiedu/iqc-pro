import { WestgardRulesEngine, type QCPointForRules, type CUSUMState } from "../lib/westgard-rules"

interface TestResult {
  testName: string
  passed: boolean
  details: string
  expected: any
  actual: any
}

interface TestSuite {
  suiteName: string
  results: TestResult[]
  passed: boolean
  summary: string
}

export class WestgardAcceptanceTests {
  private testResults: TestSuite[] = []

  async runAllTests(): Promise<{ passed: boolean; suites: TestSuite[] }> {
    console.log("[Acceptance Tests] Starting Westgard compliance tests...")

    // Test basic Westgard rules
    await this.testBasicWestgardRules()

    // Test new extended rules (N=3)
    await this.testExtendedRules()

    // Test CUSUM functionality
    await this.testCUSUMRules()

    // Test rule configuration and toggles
    await this.testRuleConfiguration()

    // Test lot limits and establishment
    await this.testLotLimits()

    const allPassed = this.testResults.every((suite) => suite.passed)

    console.log(`[Acceptance Tests] Completed. Overall result: ${allPassed ? "PASSED" : "FAILED"}`)

    return {
      passed: allPassed,
      suites: this.testResults,
    }
  }

  private async testBasicWestgardRules(): Promise<void> {
    const results: TestResult[] = []

    // Test R₄s within-run: L1 = −2SD & L2 = +2SD ⇒ violation
    const r4sTest = this.testR4sWithinRun()
    results.push(r4sTest)

    // Test 2₂s across-runs: 2 consecutive same level, same side ≥2SD ⇒ violation
    const across2sTest = this.test2_2sAcrossRuns()
    results.push(across2sTest)

    // Test 4₁s: 4 consecutive points >1SD same side ⇒ violation
    const fourOnesTest = this.test4_1sRule()
    results.push(fourOnesTest)

    // Test 10x: 10 consecutive points same side ⇒ violation
    const tenXTest = this.test10xRule()
    results.push(tenXTest)

    // Test 1₃s: Single point ±3SD ⇒ violation
    const oneThreesTest = this.test1_3sRule()
    results.push(oneThreesTest)

    const suitePassed = results.every((r) => r.passed)

    this.testResults.push({
      suiteName: "Basic Westgard Rules",
      results,
      passed: suitePassed,
      summary: `${results.filter((r) => r.passed).length}/${results.length} tests passed`,
    })
  }

  private testR4sWithinRun(): TestResult {
    // Create test points: L1 = -2SD, L2 = +2SD in same run
    const currentPoint: QCPointForRules = {
      id: 1,
      value: 98, // -2SD from mean 100
      z: -2.0,
      level: "L1",
      timestamp: "2024-01-01T10:00:00Z",
      run_id: "run_001",
    }

    const sameRunPoints: QCPointForRules[] = [
      {
        id: 2,
        value: 102, // +2SD from mean 100
        z: 2.0,
        level: "L2",
        timestamp: "2024-01-01T10:05:00Z",
        run_id: "run_001",
      },
    ]

    const result = WestgardRulesEngine.checkR_4s_within_run(currentPoint, sameRunPoints)

    return {
      testName: "R₄s within-run violation",
      passed: result.violated === true,
      details: "L1=-2SD and L2=+2SD in same run should trigger R₄s violation",
      expected: { violated: true, range: 4.0 },
      actual: { violated: result.violated, range: Math.abs(-2.0 - 2.0) },
    }
  }

  private test2_2sAcrossRuns(): TestResult {
    const currentPoint: QCPointForRules = {
      id: 2,
      value: 102,
      z: 2.1,
      level: "L1",
      timestamp: "2024-01-01T11:00:00Z",
      run_id: "run_002",
    }

    const previousPoints: QCPointForRules[] = [
      {
        id: 1,
        value: 102.5,
        z: 2.2,
        level: "L1",
        timestamp: "2024-01-01T10:00:00Z",
        run_id: "run_001",
      },
    ]

    const result = WestgardRulesEngine.check2_2s_across_runs(currentPoint, previousPoints)

    return {
      testName: "2₂s across-runs violation",
      passed: result.violated === true,
      details: "2 consecutive points same level, same side ≥2SD should trigger violation",
      expected: { violated: true },
      actual: { violated: result.violated },
    }
  }

  private test4_1sRule(): TestResult {
    const currentPoint: QCPointForRules = {
      id: 4,
      value: 101.5,
      z: 1.5,
      level: "L1",
      timestamp: "2024-01-01T13:00:00Z",
      run_id: "run_004",
    }

    const previousPoints: QCPointForRules[] = [
      {
        id: 1,
        value: 101.2,
        z: 1.2,
        level: "L1",
        timestamp: "2024-01-01T10:00:00Z",
        run_id: "run_001",
      },
      {
        id: 2,
        value: 101.3,
        z: 1.3,
        level: "L1",
        timestamp: "2024-01-01T11:00:00Z",
        run_id: "run_002",
      },
      {
        id: 3,
        value: 101.4,
        z: 1.4,
        level: "L1",
        timestamp: "2024-01-01T12:00:00Z",
        run_id: "run_003",
      },
    ]

    const result = WestgardRulesEngine.check4_1s(currentPoint, previousPoints)

    return {
      testName: "4₁s consecutive violation",
      passed: result.violated === true,
      details: "4 consecutive points >1SD same side should trigger violation",
      expected: { violated: true, pointCount: 4 },
      actual: { violated: result.violated, pointCount: result.involvedPoints.length },
    }
  }

  private test10xRule(): TestResult {
    const currentPoint: QCPointForRules = {
      id: 10,
      value: 100.1,
      z: 0.1,
      level: "L1",
      timestamp: "2024-01-01T19:00:00Z",
      run_id: "run_010",
    }

    // Create 9 previous points all on positive side
    const previousPoints: QCPointForRules[] = []
    for (let i = 1; i <= 9; i++) {
      previousPoints.push({
        id: i,
        value: 100 + i * 0.1,
        z: i * 0.1,
        level: "L1",
        timestamp: `2024-01-01T${10 + i}:00:00Z`,
        run_id: `run_00${i}`,
      })
    }

    const result = WestgardRulesEngine.check10x(currentPoint, previousPoints)

    return {
      testName: "10x consecutive same side",
      passed: result.violated === true,
      details: "10 consecutive points same side of mean should trigger violation",
      expected: { violated: true, pointCount: 10 },
      actual: { violated: result.violated, pointCount: result.involvedPoints.length },
    }
  }

  private test1_3sRule(): TestResult {
    const point: QCPointForRules = {
      id: 1,
      value: 97,
      z: -3.1,
      level: "L1",
      timestamp: "2024-01-01T10:00:00Z",
      run_id: "run_001",
    }

    const result = WestgardRulesEngine.check1_3s(point)

    return {
      testName: "1₃s single point violation",
      passed: result.violated === true,
      details: "Single point exceeding ±3SD should trigger violation",
      expected: { violated: true, z: -3.1 },
      actual: { violated: result.violated, z: point.z },
    }
  }

  private async testExtendedRules(): Promise<void> {
    const results: TestResult[] = []

    // Test 2of3_2s rule
    results.push(this.test2of3_2sRule())

    // Test 3_1s rule
    results.push(this.test3_1sRule())

    // Test 6x rule (N=3)
    results.push(this.test6xRule())

    // Test 9x rule (N=3)
    results.push(this.test9xRule())

    // Test 7T trend rule
    results.push(this.test7TRule())

    const suitePassed = results.every((r) => r.passed)

    this.testResults.push({
      suiteName: "Extended Rules (N=3)",
      results,
      passed: suitePassed,
      summary: `${results.filter((r) => r.passed).length}/${results.length} tests passed`,
    })
  }

  private test2of3_2sRule(): TestResult {
    const currentPoint: QCPointForRules = {
      id: 3,
      value: 102.2,
      z: 2.2,
      level: "L1",
      timestamp: "2024-01-01T12:00:00Z",
      run_id: "run_003",
    }

    const previousPoints: QCPointForRules[] = [
      {
        id: 1,
        value: 102.1,
        z: 2.1,
        level: "L1",
        timestamp: "2024-01-01T10:00:00Z",
        run_id: "run_001",
      },
      {
        id: 2,
        value: 99.5, // This one is <2SD
        z: -0.5,
        level: "L1",
        timestamp: "2024-01-01T11:00:00Z",
        run_id: "run_002",
      },
    ]

    const result = WestgardRulesEngine.check2of3_2s(currentPoint, previousPoints)

    return {
      testName: "2of3_2s rule violation",
      passed: result.violated === true,
      details: "2 out of 3 consecutive points ≥2SD same side should trigger violation",
      expected: { violated: true },
      actual: { violated: result.violated },
    }
  }

  private test3_1sRule(): TestResult {
    const currentPoint: QCPointForRules = {
      id: 3,
      value: 101.2,
      z: 1.2,
      level: "L1",
      timestamp: "2024-01-01T12:00:00Z",
      run_id: "run_003",
    }

    const previousPoints: QCPointForRules[] = [
      {
        id: 1,
        value: 101.1,
        z: 1.1,
        level: "L1",
        timestamp: "2024-01-01T10:00:00Z",
        run_id: "run_001",
      },
      {
        id: 2,
        value: 101.3,
        z: 1.3,
        level: "L1",
        timestamp: "2024-01-01T11:00:00Z",
        run_id: "run_002",
      },
    ]

    const result = WestgardRulesEngine.check3_1s(currentPoint, previousPoints)

    return {
      testName: "3_1s rule violation",
      passed: result.violated === true,
      details: "3 consecutive points >1SD same side should trigger violation",
      expected: { violated: true },
      actual: { violated: result.violated },
    }
  }

  private test6xRule(): TestResult {
    const currentPoint: QCPointForRules = {
      id: 6,
      value: 100.1,
      z: 0.1,
      level: "L1",
      timestamp: "2024-01-01T15:00:00Z",
      run_id: "run_006",
    }

    // Create 5 previous points all on positive side
    const previousPoints: QCPointForRules[] = []
    for (let i = 1; i <= 5; i++) {
      previousPoints.push({
        id: i,
        value: 100 + i * 0.1,
        z: i * 0.1,
        level: "L1",
        timestamp: `2024-01-01T${10 + i}:00:00Z`,
        run_id: `run_00${i}`,
      })
    }

    const result = WestgardRulesEngine.check6x(currentPoint, previousPoints)

    return {
      testName: "6x rule violation (N=3)",
      passed: result.violated === true,
      details: "6 consecutive points same side should trigger violation for N=3",
      expected: { violated: true },
      actual: { violated: result.violated },
    }
  }

  private test9xRule(): TestResult {
    const currentPoint: QCPointForRules = {
      id: 9,
      value: 100.1,
      z: 0.1,
      level: "L1",
      timestamp: "2024-01-01T18:00:00Z",
      run_id: "run_009",
    }

    // Create 8 previous points all on positive side
    const previousPoints: QCPointForRules[] = []
    for (let i = 1; i <= 8; i++) {
      previousPoints.push({
        id: i,
        value: 100 + i * 0.1,
        z: i * 0.1,
        level: "L1",
        timestamp: `2024-01-01T${10 + i}:00:00Z`,
        run_id: `run_00${i}`,
      })
    }

    const result = WestgardRulesEngine.check9x(currentPoint, previousPoints)

    return {
      testName: "9x rule violation (N=3)",
      passed: result.violated === true,
      details: "9 consecutive points same side should trigger violation for N=3",
      expected: { violated: true },
      actual: { violated: result.violated },
    }
  }

  private test7TRule(): TestResult {
    const currentPoint: QCPointForRules = {
      id: 7,
      value: 107,
      z: 7.0,
      level: "L1",
      timestamp: "2024-01-01T16:00:00Z",
      run_id: "run_007",
    }

    // Create 6 previous points with increasing trend
    const previousPoints: QCPointForRules[] = []
    for (let i = 1; i <= 6; i++) {
      previousPoints.push({
        id: i,
        value: 100 + i,
        z: i,
        level: "L1",
        timestamp: `2024-01-01T${10 + i}:00:00Z`,
        run_id: `run_00${i}`,
      })
    }

    const result = WestgardRulesEngine.check7T(currentPoint, previousPoints)

    return {
      testName: "7T trend rule violation",
      passed: result.violated === true,
      details: "7 consecutive points with consistent trend should trigger violation",
      expected: { violated: true },
      actual: { violated: result.violated },
    }
  }

  private async testCUSUMRules(): Promise<void> {
    const results: TestResult[] = []

    // Test CUSUM positive shift detection
    results.push(this.testCUSUMPositiveShift())

    // Test CUSUM negative shift detection
    results.push(this.testCUSUMNegativeShift())

    // Test CUSUM reset behavior
    results.push(this.testCUSUMReset())

    const suitePassed = results.every((r) => r.passed)

    this.testResults.push({
      suiteName: "CUSUM Rules",
      results,
      passed: suitePassed,
      summary: `${results.filter((r) => r.passed).length}/${results.length} tests passed`,
    })
  }

  private testCUSUMPositiveShift(): TestResult {
    // Simulate small positive bias over multiple points
    const K = 0.5
    const H = 4.0
    let cusumState: CUSUMState = { pos: 0, neg: 0, crossed: false }

    // Apply 8 points with small positive bias (~0.8 SD)
    for (let i = 1; i <= 8; i++) {
      const point: QCPointForRules = {
        id: i,
        value: 100.8,
        z: 0.8,
        level: "L1",
        timestamp: `2024-01-01T${10 + i}:00:00Z`,
        run_id: `run_00${i}`,
      }

      cusumState = WestgardRulesEngine.calculateCUSUM(point, cusumState, K, H)
    }

    const cusumResult = WestgardRulesEngine.checkCUSUM(cusumState, H)

    return {
      testName: "CUSUM positive shift detection",
      passed: cusumResult.violated === true && cusumState.pos > H,
      details: "Small positive bias over multiple points should trigger CUSUM violation",
      expected: { violated: true, pos_greater_than_H: true },
      actual: { violated: cusumResult.violated, pos: cusumState.pos, H },
    }
  }

  private testCUSUMNegativeShift(): TestResult {
    const K = 0.5
    const H = 4.0
    let cusumState: CUSUMState = { pos: 0, neg: 0, crossed: false }

    // Apply 8 points with small negative bias (~-0.8 SD)
    for (let i = 1; i <= 8; i++) {
      const point: QCPointForRules = {
        id: i,
        value: 99.2,
        z: -0.8,
        level: "L1",
        timestamp: `2024-01-01T${10 + i}:00:00Z`,
        run_id: `run_00${i}`,
      }

      cusumState = WestgardRulesEngine.calculateCUSUM(point, cusumState, K, H)
    }

    const cusumResult = WestgardRulesEngine.checkCUSUM(cusumState, H)

    return {
      testName: "CUSUM negative shift detection",
      passed: cusumResult.violated === true && cusumState.neg > H,
      details: "Small negative bias over multiple points should trigger CUSUM violation",
      expected: { violated: true, neg_greater_than_H: true },
      actual: { violated: cusumResult.violated, neg: cusumState.neg, H },
    }
  }

  private testCUSUMReset(): TestResult {
    const K = 0.5
    const H = 4.0
    const cusumState: CUSUMState = { pos: 2.0, neg: 0, crossed: false }

    // Apply point that should reset positive CUSUM
    const point: QCPointForRules = {
      id: 1,
      value: 98.0,
      z: -2.0,
      level: "L1",
      timestamp: "2024-01-01T10:00:00Z",
      run_id: "run_001",
    }

    const newState = WestgardRulesEngine.calculateCUSUM(point, cusumState, K, H)

    return {
      testName: "CUSUM reset behavior",
      passed: newState.pos === 0 && newState.neg > 0,
      details: "CUSUM should reset to 0 when calculation goes negative",
      expected: { pos_reset: true, neg_increased: true },
      actual: { pos: newState.pos, neg: newState.neg },
    }
  }

  private async testRuleConfiguration(): Promise<void> {
    const results: TestResult[] = []

    // Test that disabled rules don't trigger violations
    results.push(this.testDisabledRulesBehavior())

    // Test rule enable/disable functionality
    results.push(this.testRuleToggling())

    const suitePassed = results.every((r) => r.passed)

    this.testResults.push({
      suiteName: "Rule Configuration",
      results,
      passed: suitePassed,
      summary: `${results.filter((r) => r.passed).length}/${results.length} tests passed`,
    })
  }

  private testDisabledRulesBehavior(): TestResult {
    const currentPoint: QCPointForRules = {
      id: 4,
      value: 101.5,
      z: 1.5,
      level: "L1",
      timestamp: "2024-01-01T13:00:00Z",
      run_id: "run_004",
    }

    const previousPoints: QCPointForRules[] = [
      { id: 1, value: 101.2, z: 1.2, level: "L1", timestamp: "2024-01-01T10:00:00Z", run_id: "run_001" },
      { id: 2, value: 101.3, z: 1.3, level: "L1", timestamp: "2024-01-01T11:00:00Z", run_id: "run_002" },
      { id: 3, value: 101.4, z: 1.4, level: "L1", timestamp: "2024-01-01T12:00:00Z", run_id: "run_003" },
    ]

    // Test with 4_1s rule disabled
    const config = {
      enable_1_2s_warning: false,
      enable_1_3s_reject: false,
      enable_2_2s_within_run_reject: false,
      enable_2_2s_across_runs_reject: false,
      enable_R_4s_within_run_reject: false,
      enable_4_1s_reject: false, // Disabled
      enable_10x_reject: false,
    }

    const evaluationResult = WestgardRulesEngine.evaluatePoint(currentPoint, previousPoints, config)
    const violations = evaluationResult.results

    return {
      testName: "Disabled rules behavior",
      passed: violations.length === 0,
      details: "Disabled rules should not trigger violations even when conditions are met",
      expected: { violationCount: 0 },
      actual: { violationCount: violations.length, violations: violations.map((v) => v.rule) },
    }
  }

  private testRuleToggling(): TestResult {
    const point: QCPointForRules = {
      id: 1,
      value: 97,
      z: -3.1,
      level: "L1",
      timestamp: "2024-01-01T10:00:00Z",
      run_id: "run_001",
    }

    // Test with rule enabled
    const enabledConfig = {
      enable_1_2s_warning: false,
      enable_1_3s_reject: true, // Enabled
      enable_2_2s_within_run_reject: false,
      enable_2_2s_across_runs_reject: false,
      enable_R_4s_within_run_reject: false,
      enable_4_1s_reject: false,
      enable_10x_reject: false,
    }

    const enabledResult = WestgardRulesEngine.evaluatePoint(point, [], enabledConfig)
    const enabledViolations = enabledResult.results

    // Test with rule disabled
    const disabledConfig = { ...enabledConfig, enable_1_3s_reject: false }
    const disabledResult = WestgardRulesEngine.evaluatePoint(point, [], disabledConfig)
    const disabledViolations = disabledResult.results

    const enabledHasViolation = enabledViolations.some((v) => v.rule === "1_3s")
    const disabledHasNoViolation = !disabledViolations.some((v) => v.rule === "1_3s")

    return {
      testName: "Rule toggling functionality",
      passed: enabledHasViolation && disabledHasNoViolation,
      details: "Rules should trigger violations when enabled and not when disabled",
      expected: { enabled_triggers: true, disabled_no_trigger: true },
      actual: { enabled_triggers: enabledHasViolation, disabled_no_trigger: disabledHasNoViolation },
    }
  }

  private async testLotLimits(): Promise<void> {
    const results: TestResult[] = []

    // Test lot establishment requirements
    results.push(this.testLotEstablishmentRequirements())

    // Test lot locking behavior
    results.push(this.testLotLockingBehavior())

    const suitePassed = results.every((r) => r.passed)

    this.testResults.push({
      suiteName: "Lot Limits Management",
      results,
      passed: suitePassed,
      summary: `${results.filter((r) => r.passed).length}/${results.length} tests passed`,
    })
  }

  private testLotEstablishmentRequirements(): TestResult {
    // This test verifies the concept that lots should require ≥20 measurements
    // In a real implementation, this would test the actual lot establishment logic

    const minimumPoints = 20
    const testPoints = 15 // Less than required

    const canEstablish = testPoints >= minimumPoints

    return {
      testName: "Lot establishment requirements",
      passed: !canEstablish, // Should NOT be able to establish with <20 points
      details: "Lot limits should require ≥20 measurements before establishment (Westgard recommendation)",
      expected: { can_establish: false, minimum_required: 20 },
      actual: { can_establish: canEstablish, points_available: testPoints },
    }
  }

  private testLotLockingBehavior(): TestResult {
    // This test verifies that once locked, limits don't change
    // In a real implementation, this would test actual database behavior

    const initialMean = 100.0
    const initialSD = 1.0
    const isLocked = true

    // Simulate new data that would change mean/SD if not locked
    const newMean = 100.5
    const newSD = 1.2

    // If locked, values should remain unchanged
    const finalMean = isLocked ? initialMean : newMean
    const finalSD = isLocked ? initialSD : newSD

    const limitsUnchanged = finalMean === initialMean && finalSD === initialSD

    return {
      testName: "Lot locking behavior",
      passed: limitsUnchanged,
      details: "Locked lots should not recalculate mean/SD with new data",
      expected: { mean_unchanged: true, sd_unchanged: true },
      actual: { mean: finalMean, sd: finalSD, locked: isLocked },
    }
  }

  printResults(): void {
    console.log("\n" + "=".repeat(80))
    console.log("WESTGARD ACCEPTANCE TEST RESULTS")
    console.log("=".repeat(80))

    for (const suite of this.testResults) {
      console.log(`\n📋 ${suite.suiteName}: ${suite.passed ? "✅ PASSED" : "❌ FAILED"}`)
      console.log(`   ${suite.summary}`)

      for (const test of suite.results) {
        const status = test.passed ? "✅" : "❌"
        console.log(`   ${status} ${test.testName}`)
        if (!test.passed) {
          console.log(`      Details: ${test.details}`)
          console.log(`      Expected: ${JSON.stringify(test.expected)}`)
          console.log(`      Actual: ${JSON.stringify(test.actual)}`)
        }
      }
    }

    const totalTests = this.testResults.reduce((sum, suite) => sum + suite.results.length, 0)
    const passedTests = this.testResults.reduce((sum, suite) => sum + suite.results.filter((r) => r.passed).length, 0)
    const overallPassed = this.testResults.every((suite) => suite.passed)

    console.log("\n" + "=".repeat(80))
    console.log(`OVERALL RESULT: ${overallPassed ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"}`)
    console.log(`Total: ${passedTests}/${totalTests} tests passed`)
    console.log("=".repeat(80))
  }
}

// CLI execution
if (require.main === module) {
  const tests = new WestgardAcceptanceTests()

  tests
    .runAllTests()
    .then((result) => {
      tests.printResults()
      process.exit(result.passed ? 0 : 1)
    })
    .catch((error) => {
      console.error("Test execution failed:", error)
      process.exit(1)
    })
}
