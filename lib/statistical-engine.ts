export interface StatisticalResult {
  mean: number
  standardDeviation: number
  variance: number
  count: number
  min: number
  max: number
  range: number
  cv: number // Coefficient of Variation
}

export interface QCStatistics extends StatisticalResult {
  controlLimits: {
    limit_1s_lower: number
    limit_1s_upper: number
    limit_2s_lower: number
    limit_2s_upper: number
    limit_3s_lower: number
    limit_3s_upper: number
  }
  outliers: number[]
  inControlCount: number
  outOfControlCount: number
}

export class StatisticalEngine {
  /**
   * Calculate basic statistics for a dataset
   */
  static calculateBasicStats(values: number[]): StatisticalResult {
    if (values.length === 0) {
      throw new Error("Cannot calculate statistics for empty dataset")
    }

    const count = values.length
    const sum = values.reduce((acc, val) => acc + val, 0)
    const mean = sum / count

    // Calculate variance using sample variance (n-1)
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (count - 1)
    const standardDeviation = Math.sqrt(variance)

    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min

    // Coefficient of Variation (CV%)
    const cv = mean !== 0 ? (standardDeviation / Math.abs(mean)) * 100 : 0

    return {
      mean,
      standardDeviation,
      variance,
      count,
      min,
      max,
      range,
      cv,
    }
  }

  /**
   * Calculate QC statistics with control limits
   */
  static calculateQCStatistics(values: number[], targetMean?: number, targetSD?: number): QCStatistics {
    const basicStats = this.calculateBasicStats(values)

    // Use calculated mean/SD or provided target values
    const mean = targetMean ?? basicStats.mean
    const sd = targetSD ?? basicStats.standardDeviation

    // Calculate control limits
    const controlLimits = {
      limit_1s_lower: mean - sd,
      limit_1s_upper: mean + sd,
      limit_2s_lower: mean - 2 * sd,
      limit_2s_upper: mean + 2 * sd,
      limit_3s_lower: mean - 3 * sd,
      limit_3s_upper: mean + 3 * sd,
    }

    // Identify outliers (beyond ±3SD)
    const outliers = values.filter((val) => val < controlLimits.limit_3s_lower || val > controlLimits.limit_3s_upper)

    // Count in-control vs out-of-control points
    const inControlCount = values.filter(
      (val) => val >= controlLimits.limit_3s_lower && val <= controlLimits.limit_3s_upper,
    ).length
    const outOfControlCount = values.length - inControlCount

    return {
      ...basicStats,
      controlLimits,
      outliers,
      inControlCount,
      outOfControlCount,
    }
  }

  /**
   * Calculate Z-scores for values
   */
  static calculateZScores(values: number[], mean: number, sd: number): number[] {
    if (sd === 0) {
      return values.map(() => 0)
    }
    return values.map((val) => (val - mean) / sd)
  }

  /**
   * Determine if sufficient data exists for establishing limits
   */
  static isDataSufficientForLimits(
    values: number[],
    minPoints = 20,
    minDays?: number,
  ): {
    sufficient: boolean
    pointsCount: number
    requiredPoints: number
    daysCount?: number
    requiredDays?: number
    message: string
  } {
    const pointsCount = values.length
    const pointsSufficient = pointsCount >= minPoints

    let daysSufficient = true
    let daysCount: number | undefined
    let requiredDays: number | undefined

    if (minDays) {
      // This would require timestamp data to calculate unique days
      // For now, we'll assume days requirement is met if points requirement is met
      daysCount = Math.ceil(pointsCount / 2) // Rough estimate
      requiredDays = minDays
      daysSufficient = daysCount >= minDays
    }

    const sufficient = pointsSufficient && daysSufficient

    let message = ""
    if (!pointsSufficient) {
      message = `Need ${minPoints - pointsCount} more data points`
    } else if (!daysSufficient && minDays) {
      message = `Need data from ${minDays - (daysCount || 0)} more days`
    } else {
      message = "Sufficient data for establishing limits"
    }

    return {
      sufficient,
      pointsCount,
      requiredPoints: minPoints,
      daysCount,
      requiredDays,
      message,
    }
  }

  /**
   * Filter in-control data points for limit establishment
   */
  static filterInControlData(
    values: number[],
    zScores: number[],
    maxZScore = 2,
  ): {
    inControlValues: number[]
    filteredCount: number
    originalCount: number
  } {
    const inControlValues: number[] = []

    values.forEach((value, index) => {
      if (Math.abs(zScores[index]) <= maxZScore) {
        inControlValues.push(value)
      }
    })

    return {
      inControlValues,
      filteredCount: values.length - inControlValues.length,
      originalCount: values.length,
    }
  }

  /**
   * Calculate process capability indices
   */
  static calculateCapabilityIndices(
    values: number[],
    lsl: number,
    usl: number,
    targetValue?: number,
  ): {
    cp: number
    cpk: number
    pp: number
    ppk: number
    cpm?: number
  } {
    const stats = this.calculateBasicStats(values)
    const { mean, standardDeviation } = stats

    // Cp (Process Capability)
    const cp = (usl - lsl) / (6 * standardDeviation)

    // Cpk (Process Capability Index)
    const cpkUpper = (usl - mean) / (3 * standardDeviation)
    const cpkLower = (mean - lsl) / (3 * standardDeviation)
    const cpk = Math.min(cpkUpper, cpkLower)

    // Pp (Process Performance)
    const pp = (usl - lsl) / (6 * standardDeviation)

    // Ppk (Process Performance Index)
    const ppkUpper = (usl - mean) / (3 * standardDeviation)
    const ppkLower = (mean - lsl) / (3 * standardDeviation)
    const ppk = Math.min(ppkUpper, ppkLower)

    // Cpm (Taguchi Capability Index) - if target is provided
    let cpm: number | undefined
    if (targetValue !== undefined) {
      const msd = standardDeviation ** 2 + (mean - targetValue) ** 2
      cpm = (usl - lsl) / (6 * Math.sqrt(msd))
    }

    return { cp, cpk, pp, ppk, cpm }
  }

  /**
   * Detect trends in QC data
   */
  static detectTrends(
    values: number[],
    windowSize = 7,
  ): {
    hasUpwardTrend: boolean
    hasDownwardTrend: boolean
    trendStrength: number
    message: string
  } {
    if (values.length < windowSize) {
      return {
        hasUpwardTrend: false,
        hasDownwardTrend: false,
        trendStrength: 0,
        message: "Insufficient data for trend analysis",
      }
    }

    // Calculate moving averages
    const movingAverages: number[] = []
    for (let i = windowSize - 1; i < values.length; i++) {
      const window = values.slice(i - windowSize + 1, i + 1)
      const avg = window.reduce((sum, val) => sum + val, 0) / windowSize
      movingAverages.push(avg)
    }

    // Calculate trend slope using linear regression
    const n = movingAverages.length
    const xSum = (n * (n - 1)) / 2
    const ySum = movingAverages.reduce((sum, val) => sum + val, 0)
    const xySum = movingAverages.reduce((sum, val, index) => sum + val * index, 0)
    const x2Sum = (n * (n - 1) * (2 * n - 1)) / 6

    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum)
    const trendStrength = Math.abs(slope)

    const hasUpwardTrend = slope > 0.1 // Threshold for significant upward trend
    const hasDownwardTrend = slope < -0.1 // Threshold for significant downward trend

    let message = "No significant trend detected"
    if (hasUpwardTrend) {
      message = "Upward trend detected"
    } else if (hasDownwardTrend) {
      message = "Downward trend detected"
    }

    return {
      hasUpwardTrend,
      hasDownwardTrend,
      trendStrength,
      message,
    }
  }
}
