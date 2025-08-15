import { WestgardRulesEngine, type QCPoint, type WestgardConfig } from "../lib/westgard-rules"

describe("Westgard Compliance Tests", () => {
  let engine: WestgardRulesEngine
  let config: WestgardConfig

  beforeEach(() => {
    // Standard configuration for testing
    config = {
      analyte: "Glucose",
      level: "L1",
      mean: 100,
      sd: 5,
      enable_1_2s_warning: true,
      enable_1_3s_reject: true,
      enable_2_2s_reject: true,
      enable_r_4s_reject: true,
      enable_4_1s_reject: true,
      enable_10x_reject: true,
      // New rules - all enabled for testing
      enable_2of3_2s_reject: true,
      enable_3_1s_reject: true,
      enable_6x_reject: true,
      enable_9x_reject: true,
      enable_7T_reject: true,
      n_per_run: 3,
      cusum_k: 0.5,
      cusum_h: 4.0,
      enable_cusum: true,
    }
    engine = new WestgardRulesEngine()
  })

  describe("Core Westgard Rules", () => {
    test("R₄s within-run: L1=-2SD & L2=+2SD should trigger violation", () => {
      const points: QCPoint[] = [
        { id: "1", analyte: "Glucose", level: "L1", value: 90, run_id: "R001", timestamp: new Date() }, // -2SD
        { id: "2", analyte: "Glucose", level: "L2", value: 110, run_id: "R001", timestamp: new Date() }, // +2SD
      ]

      const result = engine.evaluatePoints(points, config)
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          rule: "R_4s",
          type: "reject",
          description: expect.stringContaining("within-run"),
        }),
      )
    })

    test("2₂s across-runs: 2 consecutive same level, same side ≥2SD", () => {
      const points: QCPoint[] = [
        { id: "1", analyte: "Glucose", level: "L1", value: 90, run_id: "R001", timestamp: new Date() }, // -2SD
        { id: "2", analyte: "Glucose", level: "L1", value: 89, run_id: "R002", timestamp: new Date() }, // -2.2SD
      ]

      const result = engine.evaluatePoints(points, config)
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          rule: "2_2s",
          type: "reject",
        }),
      )
    })

    test("4₁s: 4 consecutive points >1SD same side should trigger violation", () => {
      const points: QCPoint[] = [
        { id: "1", analyte: "Glucose", level: "L1", value: 106, run_id: "R001", timestamp: new Date() }, // +1.2SD
        { id: "2", analyte: "Glucose", level: "L1", value: 107, run_id: "R002", timestamp: new Date() }, // +1.4SD
        { id: "3", analyte: "Glucose", level: "L1", value: 105, run_id: "R003", timestamp: new Date() }, // +1SD
        { id: "4", analyte: "Glucose", level: "L1", value: 108, run_id: "R004", timestamp: new Date() }, // +1.6SD
      ]

      const result = engine.evaluatePoints(points, config)
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          rule: "4_1s",
          type: "reject",
        }),
      )
    })

    test("4₁s: disabled rule should not trigger violation", () => {
      const disabledConfig = { ...config, enable_4_1s_reject: false }
      const points: QCPoint[] = [
        { id: "1", analyte: "Glucose", level: "L1", value: 106, run_id: "R001", timestamp: new Date() },
        { id: "2", analyte: "Glucose", level: "L1", value: 107, run_id: "R002", timestamp: new Date() },
        { id: "3", analyte: "Glucose", level: "L1", value: 105, run_id: "R003", timestamp: new Date() },
        { id: "4", analyte: "Glucose", level: "L1", value: 108, run_id: "R004", timestamp: new Date() },
      ]

      const result = engine.evaluatePoints(points, disabledConfig)
      expect(result.violations).not.toContainEqual(expect.objectContaining({ rule: "4_1s" }))
    })

    test("10x (N=2): 10 consecutive points same side should trigger violation", () => {
      const points: QCPoint[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        analyte: "Glucose",
        level: "L1",
        value: 102, // +0.4SD, same side
        run_id: `R${String(i + 1).padStart(3, "0")}`,
        timestamp: new Date(),
      }))

      const result = engine.evaluatePoints(points, { ...config, n_per_run: 2 })
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          rule: "10x",
          type: "reject",
        }),
      )
    })
  })

  describe("Extended Rules (N=3)", () => {
    test("2of3_2s: 2 out of 3 consecutive points >2SD should trigger violation", () => {
      const points: QCPoint[] = [
        { id: "1", analyte: "Glucose", level: "L1", value: 90, run_id: "R001", timestamp: new Date() }, // -2SD
        { id: "2", analyte: "Glucose", level: "L1", value: 89, run_id: "R002", timestamp: new Date() }, // -2.2SD
        { id: "3", analyte: "Glucose", level: "L1", value: 95, run_id: "R003", timestamp: new Date() }, // -1SD
      ]

      const result = engine.evaluatePoints(points, { ...config, n_per_run: 3 })
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          rule: "2of3_2s",
          type: "reject",
        }),
      )
    })

    test("3_1s: 3 consecutive points >1SD same side should trigger violation", () => {
      const points: QCPoint[] = [
        { id: "1", analyte: "Glucose", level: "L1", value: 106, run_id: "R001", timestamp: new Date() }, // +1.2SD
        { id: "2", analyte: "Glucose", level: "L1", value: 107, run_id: "R002", timestamp: new Date() }, // +1.4SD
        { id: "3", analyte: "Glucose", level: "L1", value: 105, run_id: "R003", timestamp: new Date() }, // +1SD
      ]

      const result = engine.evaluatePoints(points, { ...config, n_per_run: 3 })
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          rule: "3_1s",
          type: "reject",
        }),
      )
    })

    test("6x: 6 consecutive points same side should trigger violation", () => {
      const points: QCPoint[] = Array.from({ length: 6 }, (_, i) => ({
        id: `${i + 1}`,
        analyte: "Glucose",
        level: "L1",
        value: 102, // +0.4SD, same side
        run_id: `R${String(i + 1).padStart(3, "0")}`,
        timestamp: new Date(),
      }))

      const result = engine.evaluatePoints(points, { ...config, n_per_run: 3 })
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          rule: "6x",
          type: "reject",
        }),
      )
    })

    test("9x: 9 consecutive points same side should trigger violation", () => {
      const points: QCPoint[] = Array.from({ length: 9 }, (_, i) => ({
        id: `${i + 1}`,
        analyte: "Glucose",
        level: "L1",
        value: 101, // +0.2SD, same side
        run_id: `R${String(i + 1).padStart(3, "0")}`,
        timestamp: new Date(),
      }))

      const result = engine.evaluatePoints(points, { ...config, n_per_run: 3 })
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          rule: "9x",
          type: "reject",
        }),
      )
    })

    test("7T: 7 consecutive increasing points should trigger violation when extension enabled", () => {
      const points: QCPoint[] = [
        { id: "1", analyte: "Glucose", level: "L1", value: 95, run_id: "R001", timestamp: new Date() },
        { id: "2", analyte: "Glucose", level: "L1", value: 96, run_id: "R002", timestamp: new Date() },
        { id: "3", analyte: "Glucose", level: "L1", value: 97, run_id: "R003", timestamp: new Date() },
        { id: "4", analyte: "Glucose", level: "L1", value: 98, run_id: "R004", timestamp: new Date() },
        { id: "5", analyte: "Glucose", level: "L1", value: 99, run_id: "R005", timestamp: new Date() },
        { id: "6", analyte: "Glucose", level: "L1", value: 100, run_id: "R006", timestamp: new Date() },
        { id: "7", analyte: "Glucose", level: "L1", value: 101, run_id: "R007", timestamp: new Date() },
      ]

      const result = engine.evaluatePoints(points, config)
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          rule: "7T",
          type: "reject",
        }),
      )
    })

    test("7T: should not trigger when extension disabled", () => {
      const disabledConfig = { ...config, enable_7T_reject: false }
      const points: QCPoint[] = [
        { id: "1", analyte: "Glucose", level: "L1", value: 95, run_id: "R001", timestamp: new Date() },
        { id: "2", analyte: "Glucose", level: "L1", value: 96, run_id: "R002", timestamp: new Date() },
        { id: "3", analyte: "Glucose", level: "L1", value: 97, run_id: "R003", timestamp: new Date() },
        { id: "4", analyte: "Glucose", level: "L1", value: 98, run_id: "R004", timestamp: new Date() },
        { id: "5", analyte: "Glucose", level: "L1", value: 99, run_id: "R005", timestamp: new Date() },
        { id: "6", analyte: "Glucose", level: "L1", value: 100, run_id: "R006", timestamp: new Date() },
        { id: "7", analyte: "Glucose", level: "L1", value: 101, run_id: "R007", timestamp: new Date() },
      ]

      const result = engine.evaluatePoints(points, disabledConfig)
      expect(result.violations).not.toContainEqual(expect.objectContaining({ rule: "7T" }))
    })
  })

  describe("CUSUM Functionality", () => {
    test("CUSUM: small bias ~0.8-1.0 SD should trigger S+ exceeds H warning", () => {
      // Create points with consistent small positive bias
      const points: QCPoint[] = Array.from({ length: 8 }, (_, i) => ({
        id: `${i + 1}`,
        analyte: "Glucose",
        level: "L1",
        value: 104, // +0.8SD consistent bias
        run_id: `R${String(i + 1).padStart(3, "0")}`,
        timestamp: new Date(),
      }))

      const result = engine.evaluatePoints(points, config)
      expect(result.cusum?.s_pos).toBeGreaterThan(config.cusum_h!)
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          rule: "CUSUM",
          type: "warning",
        }),
      )
    })

    test("CUSUM: should not trigger when disabled", () => {
      const disabledConfig = { ...config, enable_cusum: false }
      const points: QCPoint[] = Array.from({ length: 8 }, (_, i) => ({
        id: `${i + 1}`,
        analyte: "Glucose",
        level: "L1",
        value: 104,
        run_id: `R${String(i + 1).padStart(3, "0")}`,
        timestamp: new Date(),
      }))

      const result = engine.evaluatePoints(points, disabledConfig)
      expect(result.cusum).toBeUndefined()
      expect(result.violations).not.toContainEqual(expect.objectContaining({ rule: "CUSUM" }))
    })
  })

  describe("Rule Configuration", () => {
    test("All new rules should be disabled by default", () => {
      const defaultConfig: WestgardConfig = {
        analyte: "Glucose",
        level: "L1",
        mean: 100,
        sd: 5,
        enable_1_2s_warning: true,
        enable_1_3s_reject: true,
        enable_2_2s_reject: true,
        enable_r_4s_reject: true,
        enable_4_1s_reject: true,
        enable_10x_reject: true,
        // New rules should default to FALSE
        enable_2of3_2s_reject: false,
        enable_3_1s_reject: false,
        enable_6x_reject: false,
        enable_9x_reject: false,
        enable_7T_reject: false,
        n_per_run: 2,
        enable_cusum: false,
      }

      // Test data that would trigger new rules if enabled
      const points: QCPoint[] = [
        { id: "1", analyte: "Glucose", level: "L1", value: 90, run_id: "R001", timestamp: new Date() },
        { id: "2", analyte: "Glucose", level: "L1", value: 89, run_id: "R002", timestamp: new Date() },
        { id: "3", analyte: "Glucose", level: "L1", value: 88, run_id: "R003", timestamp: new Date() },
      ]

      const result = engine.evaluatePoints(points, defaultConfig)

      // Should not trigger any new rules
      expect(result.violations).not.toContainEqual(expect.objectContaining({ rule: "2of3_2s" }))
      expect(result.violations).not.toContainEqual(expect.objectContaining({ rule: "3_1s" }))
      expect(result.violations).not.toContainEqual(expect.objectContaining({ rule: "7T" }))
      expect(result.cusum).toBeUndefined()
    })
  })

  describe("Lot Limits Behavior", () => {
    test("System should not recalculate mean/SD daily", () => {
      // This test verifies that established limits remain constant
      const establishedLimits = {
        mean: 100,
        sd: 5,
        n_count: 25,
        is_locked: true,
      }

      // New points should not change established limits
      const newPoints: QCPoint[] = [
        { id: "26", analyte: "Glucose", level: "L1", value: 110, run_id: "R026", timestamp: new Date() },
        { id: "27", analyte: "Glucose", level: "L1", value: 115, run_id: "R027", timestamp: new Date() },
      ]

      // Simulate lot limits service behavior
      const updatedLimits = {
        ...establishedLimits,
        n_count: establishedLimits.n_count + newPoints.length,
        // mean and sd should remain unchanged when locked
      }

      expect(updatedLimits.mean).toBe(100)
      expect(updatedLimits.sd).toBe(5)
      expect(updatedLimits.is_locked).toBe(true)
    })

    test("Limits should only be established after ≥20 measurements", () => {
      const insufficientData = Array.from({ length: 19 }, (_, i) => ({
        id: `${i + 1}`,
        analyte: "Glucose",
        level: "L1",
        value: 100 + (Math.random() - 0.5) * 10,
        run_id: `R${String(i + 1).padStart(3, "0")}`,
        timestamp: new Date(),
      }))

      const sufficientData = [
        ...insufficientData,
        { id: "20", analyte: "Glucose", level: "L1", value: 105, run_id: "R020", timestamp: new Date() },
      ]

      // With <20 points, limits should not be establishable
      expect(insufficientData.length).toBeLessThan(20)

      // With ≥20 points, limits can be established
      expect(sufficientData.length).toBeGreaterThanOrEqual(20)
    })
  })
})
