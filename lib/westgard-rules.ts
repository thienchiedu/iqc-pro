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

export interface CUSUMState {
  pos: number
  neg: number
  crossed: boolean
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

  // Rule 2of3_2s: 2 out of 3 consecutive points exceed ±2SD on same side
  static check2of3_2s(currentPoint: QCPointForRules, previousSameLevelPoints: QCPointForRules[]): WestgardRuleResult {
    if (Math.abs(currentPoint.z) < 2) {
      return { rule: "2of3_2s", violated: false, message: "", involvedPoints: [] }
    }

    // Get last 2 points of same level
    const last2Points = previousSameLevelPoints.slice(-2)
    if (last2Points.length < 2) {
      return { rule: "2of3_2s", violated: false, message: "", involvedPoints: [] }
    }

    // Check how many of the 3 points (including current) exceed ±2SD on same side
    const sameSidePoints = last2Points.filter((p) => Math.abs(p.z) >= 2 && Math.sign(p.z) === Math.sign(currentPoint.z))

    const violated = sameSidePoints.length >= 1 // 2 out of 3 (current + 1 from last2)
    return {
      rule: "2of3_2s",
      violated,
      message: violated ? `2 out of 3 consecutive points exceed ±2SD on same side` : "",
      involvedPoints: violated ? [currentPoint.id, ...sameSidePoints.map((p) => p.id)] : [],
    }
  }

  // Rule 3_1s: 3 consecutive points exceed ±1SD on same side
  static check3_1s(currentPoint: QCPointForRules, previousSameLevelPoints: QCPointForRules[]): WestgardRuleResult {
    if (Math.abs(currentPoint.z) <= 1) {
      return { rule: "3_1s", violated: false, message: "", involvedPoints: [] }
    }

    // Get last 2 points of same level
    const last2Points = previousSameLevelPoints.slice(-2)
    if (last2Points.length < 2) {
      return { rule: "3_1s", violated: false, message: "", involvedPoints: [] }
    }

    // Check if all 3 points exceed ±1SD on same side
    const allSameSide = last2Points.every((p) => Math.abs(p.z) > 1 && Math.sign(p.z) === Math.sign(currentPoint.z))

    const violated = allSameSide
    return {
      rule: "3_1s",
      violated,
      message: violated ? `3 consecutive points exceed ±1SD on same side` : "",
      involvedPoints: violated ? [currentPoint.id, ...last2Points.map((p) => p.id)] : [],
    }
  }

  // Rule 6x: 6 consecutive points same side of mean (for N=3)
  static check6x(currentPoint: QCPointForRules, previousSameLevelPoints: QCPointForRules[]): WestgardRuleResult {
    // Get last 5 points of same level
    const last5Points = previousSameLevelPoints.slice(-5)
    if (last5Points.length < 5) {
      return { rule: "6x", violated: false, message: "", involvedPoints: [] }
    }

    // Check if all 6 points are on same side of mean
    const allSameSide = last5Points.every((p) => Math.sign(p.z) === Math.sign(currentPoint.z))

    const violated = allSameSide && currentPoint.z !== 0
    return {
      rule: "6x",
      violated,
      message: violated ? `6 consecutive points on same side of mean` : "",
      involvedPoints: violated ? [currentPoint.id, ...last5Points.map((p) => p.id)] : [],
    }
  }

  // Rule 9x: 9 consecutive points same side of mean (for N=3)
  static check9x(currentPoint: QCPointForRules, previousSameLevelPoints: QCPointForRules[]): WestgardRuleResult {
    // Get last 8 points of same level
    const last8Points = previousSameLevelPoints.slice(-8)
    if (last8Points.length < 8) {
      return { rule: "9x", violated: false, message: "", involvedPoints: [] }
    }

    // Check if all 9 points are on same side of mean
    const allSameSide = last8Points.every((p) => Math.sign(p.z) === Math.sign(currentPoint.z))

    const violated = allSameSide && currentPoint.z !== 0
    return {
      rule: "9x",
      violated,
      message: violated ? `9 consecutive points on same side of mean` : "",
      involvedPoints: violated ? [currentPoint.id, ...last8Points.map((p) => p.id)] : [],
    }
  }

  // Rule 7T: 7 consecutive points trending up or down (extension rule)
  static check7T(currentPoint: QCPointForRules, previousSameLevelPoints: QCPointForRules[]): WestgardRuleResult {
    // Get last 6 points of same level
    const last6Points = previousSameLevelPoints.slice(-6)
    if (last6Points.length < 6) {
      return { rule: "7T", violated: false, message: "", involvedPoints: [] }
    }

    // Create array of all 7 points including current
    const allPoints = [...last6Points, currentPoint].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )

    // Check for consistent trend (all increasing or all decreasing)
    let isIncreasing = true
    let isDecreasing = true

    for (let i = 1; i < allPoints.length; i++) {
      if (allPoints[i].value <= allPoints[i - 1].value) isIncreasing = false
      if (allPoints[i].value >= allPoints[i - 1].value) isDecreasing = false
    }

    const violated = isIncreasing || isDecreasing
    return {
      rule: "7T",
      violated,
      message: violated ? `7 consecutive points show consistent trend` : "",
      involvedPoints: violated ? allPoints.map((p) => p.id) : [],
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
      enable_2of3_2s_reject?: boolean
      enable_3_1s_reject?: boolean
      enable_6x_reject?: boolean
      enable_9x_reject?: boolean
      enable_7T_reject?: boolean
      enable_cusum?: boolean
      n_per_run?: number
      cusum_K?: number
      cusum_H?: number
    },
    previousCUSUM?: CUSUMState,
  ): { results: WestgardRuleResult[]; cusumState?: CUSUMState } {
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

      if (config.enable_2of3_2s_reject) {
        const result = this.check2of3_2s(currentPoint, sameLevelPoints)
        if (result.violated) results.push(result)
      }

      if (config.enable_3_1s_reject) {
        const result = this.check3_1s(currentPoint, sameLevelPoints)
        if (result.violated) results.push(result)
      }

      if (config.enable_6x_reject) {
        const result = this.check6x(currentPoint, sameLevelPoints)
        if (result.violated) results.push(result)
      }

      if (config.enable_9x_reject) {
        const result = this.check9x(currentPoint, sameLevelPoints)
        if (result.violated) results.push(result)
      }

      if (config.enable_7T_reject) {
        const result = this.check7T(currentPoint, sameLevelPoints)
        if (result.violated) results.push(result)
      }

      let cusumState: CUSUMState | undefined
      if (config.enable_cusum && previousCUSUM) {
        cusumState = this.calculateCUSUM(currentPoint, previousCUSUM, config.cusum_K || 0.5, config.cusum_H || 4.0)

        const cusumResult = this.checkCUSUM(cusumState, config.cusum_H || 4.0)
        if (cusumResult.violated) results.push(cusumResult)
      }

      // Warning rules (applied last, only if no reject rules triggered)
      if (config.enable_1_2s_warning && results.length === 0) {
        const result = this.check1_2s_warning(currentPoint)
        if (result.violated) results.push(result)
      }

      return { results, cusumState }
    } catch (error) {
      console.error("Error evaluating Westgard rules:", error)
      return {
        results: [
          {
            rule: "error",
            violated: true,
            message: "Error occurred during rule evaluation",
            involvedPoints: [currentPoint.id],
          },
        ],
        cusumState: previousCUSUM,
      }
    }
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

  static getRecommendedRules(
    sigmaLevel: number,
    nPerRun = 2,
  ): {
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
      const baseRules = ["1_3s", "2_2s_within", "2_2s_across", "R_4s", "4_1s"]
      const n3Rules = nPerRun === 3 ? ["2of3_2s", "3_1s"] : []
      return {
        rules: [...baseRules, ...n3Rules],
        description: "Acceptable method - enhanced monitoring",
        qcLevels: nPerRun === 3 ? 3 : 4,
      }
    } else {
      const baseRules = ["1_3s", "2_2s_within", "2_2s_across", "R_4s", "4_1s"]
      const xRules = nPerRun === 3 ? ["6x", "9x"] : ["10x"]
      return {
        rules: [...baseRules, ...xRules],
        description: "Poor method - comprehensive rule set required",
        qcLevels: nPerRun === 3 ? 3 : 6,
      }
    }
  }

  static calculateFalseRejectionRate(enabledRules: string[]): number {
    const ruleRates: Record<string, number> = {
      "1_3s": 0.0027,
      "1_2s": 0.0455,
      "2_2s_within": 0.0002,
      "2_2s_across": 0.0002,
      R_4s: 0.0001,
      "4_1s": 0.0003,
      "10x": 0.001,
      // New rules (approximate rates)
      "2of3_2s": 0.0005,
      "3_1s": 0.0008,
      "6x": 0.0015,
      "9x": 0.0005,
      "7T": 0.001,
      CUSUM_positive: 0.002,
      CUSUM_negative: 0.002,
    }

    return enabledRules.reduce((total, rule) => total + (ruleRates[rule] || 0), 0)
  }

  static calculateCUSUM(currentPoint: QCPointForRules, previousCUSUM: CUSUMState, K = 0.5, H = 4.0): CUSUMState {
    const newPos = Math.max(0, previousCUSUM.pos + currentPoint.z - K)
    const newNeg = Math.max(0, previousCUSUM.neg - currentPoint.z - K)
    const crossed = newPos > H || newNeg > H

    return {
      pos: newPos,
      neg: newNeg,
      crossed,
    }
  }

  static checkCUSUM(cusumState: CUSUMState, H = 4.0): WestgardRuleResult {
    const violated = cusumState.crossed
    const direction = cusumState.pos > H ? "positive" : "negative"

    return {
      rule: violated ? `CUSUM_${direction}` : "CUSUM",
      violated,
      message: violated ? `CUSUM ${direction} shift detected` : "",
      involvedPoints: [], // CUSUM involves cumulative calculation
    }
  }
}
