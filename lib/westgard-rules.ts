export interface WestgardRuleResult {
  rule: string
  violated: boolean
  message: string
  involvedPoints: number[]
}

export interface QCPointForRules {
  id: number
  value: number
  z: number
  level: string
  timestamp: string
  run_id: string
}

export class WestgardRulesEngine {
  // Rule 1₃s: Single point beyond ±3SD
  static check1_3s(point: QCPointForRules): WestgardRuleResult {
    const violated = Math.abs(point.z) >= 3
    return {
      rule: "1_3s",
      violated,
      message: violated ? `Point exceeds ±3SD (z=${point.z.toFixed(2)})` : "",
      involvedPoints: violated ? [point.id] : [],
    }
  }

  // Rule 2₂s (within-run): Two points in same run, same side, both ≥±2SD
  static check2_2s_within_run(currentPoint: QCPointForRules, sameRunPoints: QCPointForRules[]): WestgardRuleResult {
    if (Math.abs(currentPoint.z) < 2) {
      return { rule: "2_2s_within", violated: false, message: "", involvedPoints: [] }
    }

    // Find other points in same run with same sign and ≥2SD
    const sameSignPoints = sameRunPoints.filter(
      (p) => p.id !== currentPoint.id && Math.abs(p.z) >= 2 && Math.sign(p.z) === Math.sign(currentPoint.z),
    )

    const violated = sameSignPoints.length > 0
    return {
      rule: "2_2s_within",
      violated,
      message: violated ? `Two points in same run exceed ±2SD on same side` : "",
      involvedPoints: violated ? [currentPoint.id, sameSignPoints[0].id] : [],
    }
  }

  // Rule 2₂s (across-runs): Two consecutive points same level, same side, both ≥±2SD
  static check2_2s_across_runs(
    currentPoint: QCPointForRules,
    previousSameLevelPoints: QCPointForRules[],
  ): WestgardRuleResult {
    if (Math.abs(currentPoint.z) < 2 || previousSameLevelPoints.length === 0) {
      return { rule: "2_2s_across", violated: false, message: "", involvedPoints: [] }
    }

    const lastPoint = previousSameLevelPoints[previousSameLevelPoints.length - 1]
    const violated = Math.abs(lastPoint.z) >= 2 && Math.sign(lastPoint.z) === Math.sign(currentPoint.z)

    return {
      rule: "2_2s_across",
      violated,
      message: violated ? `Two consecutive points same level exceed ±2SD on same side` : "",
      involvedPoints: violated ? [currentPoint.id, lastPoint.id] : [],
    }
  }

  // Rule R₄s: Two points in same run with opposite signs, total range ≥4SD
  static checkR_4s_within_run(currentPoint: QCPointForRules, sameRunPoints: QCPointForRules[]): WestgardRuleResult {
    // Find points in same run with opposite sign
    const oppositeSignPoints = sameRunPoints.filter(
      (p) => p.id !== currentPoint.id && Math.sign(p.z) !== Math.sign(currentPoint.z),
    )

    for (const oppositePoint of oppositeSignPoints) {
      const range = Math.abs(currentPoint.z - oppositePoint.z)
      if (range >= 4) {
        return {
          rule: "R_4s",
          violated: true,
          message: `Range between points exceeds 4SD (${range.toFixed(2)}SD)`,
          involvedPoints: [currentPoint.id, oppositePoint.id],
        }
      }
    }

    return { rule: "R_4s", violated: false, message: "", involvedPoints: [] }
  }

  // Rule 4₁s: Four consecutive points same side, all >1SD
  static check4_1s(currentPoint: QCPointForRules, previousSameLevelPoints: QCPointForRules[]): WestgardRuleResult {
    if (Math.abs(currentPoint.z) <= 1) {
      return { rule: "4_1s", violated: false, message: "", involvedPoints: [] }
    }

    // Get last 3 points of same level
    const last3Points = previousSameLevelPoints.slice(-3)
    if (last3Points.length < 3) {
      return { rule: "4_1s", violated: false, message: "", involvedPoints: [] }
    }

    // Check if all 4 points (including current) are on same side and >1SD
    const allSameSide = last3Points.every((p) => Math.abs(p.z) > 1 && Math.sign(p.z) === Math.sign(currentPoint.z))

    const violated = allSameSide
    return {
      rule: "4_1s",
      violated,
      message: violated ? `Four consecutive points exceed 1SD on same side` : "",
      involvedPoints: violated ? [currentPoint.id, ...last3Points.map((p) => p.id)] : [],
    }
  }

  // Rule 10x: Ten consecutive points same side of mean
  static check10x(currentPoint: QCPointForRules, previousSameLevelPoints: QCPointForRules[]): WestgardRuleResult {
    // Get last 9 points of same level
    const last9Points = previousSameLevelPoints.slice(-9)
    if (last9Points.length < 9) {
      return { rule: "10x", violated: false, message: "", involvedPoints: [] }
    }

    // Check if all 10 points (including current) are on same side of mean
    const allSameSide = last9Points.every((p) => Math.sign(p.z) === Math.sign(currentPoint.z))

    const violated = allSameSide && currentPoint.z !== 0
    return {
      rule: "10x",
      violated,
      message: violated ? `Ten consecutive points on same side of mean` : "",
      involvedPoints: violated ? [currentPoint.id, ...last9Points.map((p) => p.id)] : [],
    }
  }

  // Rule 1₂s: Warning rule for single point ≥±2SD
  static check1_2s_warning(point: QCPointForRules): WestgardRuleResult {
    const violated = Math.abs(point.z) >= 2 && Math.abs(point.z) < 3
    return {
      rule: "1_2s",
      violated,
      message: violated ? `Point exceeds ±2SD (z=${point.z.toFixed(2)}) - Warning` : "",
      involvedPoints: violated ? [point.id] : [],
    }
  }

  static evaluatePoint(
    currentPoint: QCPointForRules,
    historicalPoints: QCPointForRules[],
    config: {
      enable_1_2s_warning: boolean
      enable_1_3s_reject: boolean
      enable_2_2s_within_run_reject: boolean
      enable_2_2s_across_runs_reject: boolean
      enable_R_4s_within_run_reject: boolean
      enable_4_1s_reject: boolean
      enable_10x_reject: boolean
    },
  ): WestgardRuleResult[] {
    const results: WestgardRuleResult[] = []

    try {
      // Filter historical points for same analyte, level, instrument, lot
      const sameRunPoints = historicalPoints.filter((p) => p.run_id === currentPoint.run_id)
      const sameLevelPoints = historicalPoints.filter((p) => p.level === currentPoint.level)

      // Sort by timestamp for sequential analysis
      sameLevelPoints.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

      // Apply enabled rules in order of severity
      if (config.enable_1_3s_reject) {
        const result = this.check1_3s(currentPoint)
        if (result.violated) results.push(result)
      }

      if (config.enable_2_2s_within_run_reject) {
        const result = this.check2_2s_within_run(currentPoint, sameRunPoints)
        if (result.violated) results.push(result)
      }

      if (config.enable_2_2s_across_runs_reject) {
        const result = this.check2_2s_across_runs(currentPoint, sameLevelPoints)
        if (result.violated) results.push(result)
      }

      if (config.enable_R_4s_within_run_reject) {
        const result = this.checkR_4s_within_run(currentPoint, sameRunPoints)
        if (result.violated) results.push(result)
      }

      if (config.enable_4_1s_reject) {
        const result = this.check4_1s(currentPoint, sameLevelPoints)
        if (result.violated) results.push(result)
      }

      if (config.enable_10x_reject) {
        const result = this.check10x(currentPoint, sameLevelPoints)
        if (result.violated) results.push(result)
      }

      // Warning rules (applied last, only if no reject rules triggered)
      if (config.enable_1_2s_warning && results.length === 0) {
        const result = this.check1_2s_warning(currentPoint)
        if (result.violated) results.push(result)
      }
    } catch (error) {
      console.error("Error evaluating Westgard rules:", error)
      // Return a generic error result
      results.push({
        rule: "error",
        violated: true,
        message: "Error occurred during rule evaluation",
        involvedPoints: [currentPoint.id],
      })
    }

    return results
  }

  // Calculate Z-score
  static calculateZScore(value: number, mean: number, sd: number): number {
    if (sd === 0) return 0
    return (value - mean) / sd
  }

  // Determine overall status from violations
  static determineStatus(violations: WestgardRuleResult[]): "in-control" | "warning" | "reject" {
    if (violations.length === 0) return "in-control"

    const hasRejectRule = violations.some((v) =>
      ["1_3s", "2_2s_within", "2_2s_across", "R_4s", "4_1s", "10x"].includes(v.rule),
    )

    if (hasRejectRule) return "reject"
    return "warning"
  }

  static getRecommendedRules(sigmaLevel: number): {
    rules: string[]
    description: string
    qcLevels: number
  } {
    if (sigmaLevel >= 6) {
      return {
        rules: ["1_3s"],
        description: "Excellent method - single rule sufficient",
        qcLevels: 2,
      }
    } else if (sigmaLevel >= 5) {
      return {
        rules: ["1_3s", "2_2s_within", "2_2s_across", "R_4s"],
        description: "Good method - multi-rule approach",
        qcLevels: 2,
      }
    } else if (sigmaLevel >= 4) {
      return {
        rules: ["1_3s", "2_2s_within", "2_2s_across", "R_4s", "4_1s"],
        description: "Acceptable method - enhanced monitoring",
        qcLevels: 4,
      }
    } else {
      return {
        rules: ["1_3s", "2_2s_within", "2_2s_across", "R_4s", "4_1s", "10x"],
        description: "Poor method - comprehensive rule set required",
        qcLevels: 6,
      }
    }
  }

  static calculateFalseRejectionRate(enabledRules: string[]): number {
    // Approximate false rejection rates for individual rules
    const ruleRates: Record<string, number> = {
      "1_3s": 0.0027, // 0.27%
      "1_2s": 0.0455, // 4.55% (warning only)
      "2_2s_within": 0.0002,
      "2_2s_across": 0.0002,
      R_4s: 0.0001,
      "4_1s": 0.0003,
      "10x": 0.001,
    }

    // Simple approximation - actual calculation would be more complex
    return enabledRules.reduce((total, rule) => total + (ruleRates[rule] || 0), 0)
  }
}
