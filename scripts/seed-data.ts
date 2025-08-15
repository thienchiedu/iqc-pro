import { getSheetsService } from "../lib/google-sheets"

async function seedTestData() {
  console.log("[v0] Starting data seeding...")

  try {
    const sheetsService = getSheetsService()

    // Generate QC Points data
    console.log("[v0] Adding QC Points test data...")
    
    const qcPointsData = []
    const analytes = ['Glucose', 'Cholesterol', 'Triglyceride', 'HDL-C', 'LDL-C']
    const levels = ['Level 1', 'Level 2']
    const instruments = ['INST001', 'INST002', 'INST003']
    const lots = ['LOT001', 'LOT002', 'LOT003']
    const operators = ['Dr. Smith', 'Dr. Johnson', 'Dr. Brown', 'Dr. Wilson', 'Dr. Davis']
    const shifts = ['Morning', 'Afternoon', 'Night']

    // Generate 30 QC points with realistic data
    for (let i = 0; i < 30; i++) {
      const analyte = analytes[Math.floor(Math.random() * analytes.length)]
      const level = levels[Math.floor(Math.random() * levels.length)]
      const instrument = instruments[Math.floor(Math.random() * instruments.length)]
      const lot = lots[Math.floor(Math.random() * lots.length)]
      const operator = operators[Math.floor(Math.random() * operators.length)]
      const shift = shifts[Math.floor(Math.random() * shifts.length)]

      // Generate realistic values based on analyte and level
      let targetValue: number
      let sdValue: number
      
      switch (analyte) {
        case 'Glucose':
          targetValue = level === 'Level 1' ? 100 : 300
          sdValue = level === 'Level 1' ? 5 : 15
          break
        case 'Cholesterol':
          targetValue = level === 'Level 1' ? 150 : 250
          sdValue = level === 'Level 1' ? 7.5 : 12.5
          break
        case 'Triglyceride':
          targetValue = level === 'Level 1' ? 80 : 200
          sdValue = level === 'Level 1' ? 4 : 10
          break
        case 'HDL-C':
          targetValue = level === 'Level 1' ? 40 : 70
          sdValue = level === 'Level 1' ? 2 : 3.5
          break
        case 'LDL-C':
          targetValue = level === 'Level 1' ? 100 : 160
          sdValue = level === 'Level 1' ? 5 : 8
          break
        default:
          targetValue = 100
          sdValue = 5
      }

      // Add some random variation (within ±3SD)
      const variation = (Math.random() - 0.5) * 6 * sdValue
      const measuredValue = targetValue + variation
      
      // Calculate Z-score
      const zScore = variation / sdValue

      // Determine status based on Z-score
      let status: string
      if (Math.abs(zScore) > 3) {
        status = 'reject'
      } else if (Math.abs(zScore) > 2) {
        status = 'warning'
      } else {
        status = 'in-control'
      }

      // Generate timestamp (last 7 days)
      const daysAgo = Math.floor(Math.random() * 7)
      const hoursAgo = Math.floor(Math.random() * 24)
      const minutesAgo = Math.floor(Math.random() * 60)
      const timestamp = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000) - (minutesAgo * 60 * 1000))

      const runId = `RUN${(1000 + i).toString()}`
      const comment = status === 'reject' ? 'Out of control - requires action' : 
                     status === 'warning' ? 'Warning level - monitor closely' : ''

      qcPointsData.push([
        timestamp.toISOString(),
        runId,
        shift,
        analyte,
        level,
        instrument,
        lot,
        measuredValue.toFixed(1),
        zScore.toFixed(2),
        status === 'reject' ? '{"1_3s": true}' : status === 'warning' ? '{"1_2s": true}' : '{}',
        status,
        operator,
        comment
      ])
    }

    await sheetsService.appendSheet("qc_points", qcPointsData)
    console.log(`[v0] Added ${qcPointsData.length} QC points`)

    // Add more QC Limits for different analytes
    console.log("[v0] Adding additional QC Limits...")
    const additionalQCLimits = [
      [
        "Cholesterol",
        "Level 1",
        "INST001",
        "LOT001",
        "150.0",
        "7.5",
        "lab",
        new Date().toISOString().split("T")[0],
        "",
        "false",
        "",
        "",
        "142.5",
        "157.5",
        "135.0",
        "165.0",
        "127.5",
        "172.5",
        "Initial limits for Cholesterol Level 1"
      ],
      [
        "Cholesterol",
        "Level 2",
        "INST001",
        "LOT001",
        "250.0",
        "12.5",
        "lab",
        new Date().toISOString().split("T")[0],
        "",
        "false",
        "",
        "",
        "237.5",
        "262.5",
        "225.0",
        "275.0",
        "212.5",
        "287.5",
        "Initial limits for Cholesterol Level 2"
      ],
      [
        "Triglyceride",
        "Level 1",
        "INST001",
        "LOT001",
        "80.0",
        "4.0",
        "lab",
        new Date().toISOString().split("T")[0],
        "",
        "false",
        "",
        "",
        "76.0",
        "84.0",
        "72.0",
        "88.0",
        "68.0",
        "92.0",
        "Initial limits for Triglyceride Level 1"
      ],
      [
        "Triglyceride",
        "Level 2",
        "INST001",
        "LOT001",
        "200.0",
        "10.0",
        "lab",
        new Date().toISOString().split("T")[0],
        "",
        "false",
        "",
        "",
        "190.0",
        "210.0",
        "180.0",
        "220.0",
        "170.0",
        "230.0",
        "Initial limits for Triglyceride Level 2"
      ],
      [
        "HDL-C",
        "Level 1",
        "INST002",
        "LOT002",
        "40.0",
        "2.0",
        "lab",
        new Date().toISOString().split("T")[0],
        "",
        "false",
        "",
        "",
        "38.0",
        "42.0",
        "36.0",
        "44.0",
        "34.0",
        "46.0",
        "Initial limits for HDL-C Level 1"
      ],
      [
        "HDL-C",
        "Level 2",
        "INST002",
        "LOT002",
        "70.0",
        "3.5",
        "lab",
        new Date().toISOString().split("T")[0],
        "",
        "false",
        "",
        "",
        "66.5",
        "73.5",
        "63.0",
        "77.0",
        "59.5",
        "80.5",
        "Initial limits for HDL-C Level 2"
      ],
      [
        "LDL-C",
        "Level 1",
        "INST003",
        "LOT003",
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
        "Initial limits for LDL-C Level 1"
      ],
      [
        "LDL-C",
        "Level 2",
        "INST003",
        "LOT003",
        "160.0",
        "8.0",
        "lab",
        new Date().toISOString().split("T")[0],
        "",
        "false",
        "",
        "",
        "152.0",
        "168.0",
        "144.0",
        "176.0",
        "136.0",
        "184.0",
        "Initial limits for LDL-C Level 2"
      ]
    ]

    await sheetsService.appendSheet("qc_limits", additionalQCLimits)
    console.log(`[v0] Added ${additionalQCLimits.length} additional QC limits`)

    // Add Westgard configurations for new analytes
    console.log("[v0] Adding Westgard configurations...")
    const additionalWestgardConfig = [
      [
        "Cholesterol",
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
        "Strict profile for Cholesterol Level 1"
      ],
      [
        "Cholesterol",
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
        "Strict profile for Cholesterol Level 2"
      ],
      [
        "Triglyceride",
        "Level 1",
        "INST001",
        "2",
        "relaxed",
        "true",
        "true",
        "false",
        "true",
        "true",
        "false",
        "false",
        "warning",
        "Relaxed profile for Triglyceride Level 1"
      ],
      [
        "Triglyceride",
        "Level 2",
        "INST001",
        "2",
        "relaxed",
        "true",
        "true",
        "false",
        "true",
        "true",
        "false",
        "false",
        "warning",
        "Relaxed profile for Triglyceride Level 2"
      ],
      [
        "HDL-C",
        "Level 1",
        "INST002",
        "1",
        "strict",
        "true",
        "true",
        "true",
        "true",
        "true",
        "true",
        "false",
        "reject",
        "Strict profile for HDL-C Level 1"
      ],
      [
        "HDL-C",
        "Level 2",
        "INST002",
        "1",
        "strict",
        "true",
        "true",
        "true",
        "true",
        "true",
        "true",
        "false",
        "reject",
        "Strict profile for HDL-C Level 2"
      ],
      [
        "LDL-C",
        "Level 1",
        "INST003",
        "2",
        "custom",
        "true",
        "true",
        "true",
        "false",
        "true",
        "true",
        "true",
        "reject",
        "Custom profile for LDL-C Level 1"
      ],
      [
        "LDL-C",
        "Level 2",
        "INST003",
        "2",
        "custom",
        "true",
        "true",
        "true",
        "false",
        "true",
        "true",
        "true",
        "reject",
        "Custom profile for LDL-C Level 2"
      ]
    ]

    await sheetsService.appendSheet("westgard_config", additionalWestgardConfig)
    console.log(`[v0] Added ${additionalWestgardConfig.length} Westgard configurations`)

    // Add some violations based on the reject status QC points
    console.log("[v0] Adding sample violations...")
    const violations = []
    const violationTypes = ['1_3s', '2_2s', 'R_4s', '4_1s']
    
    let violationId = 1
    for (let i = 0; i < 5; i++) {
      const violationType = violationTypes[Math.floor(Math.random() * violationTypes.length)]
      const analyte = analytes[Math.floor(Math.random() * analytes.length)]
      const level = levels[Math.floor(Math.random() * levels.length)]
      const instrument = instruments[Math.floor(Math.random() * instruments.length)]
      const lot = lots[Math.floor(Math.random() * lots.length)]
      const operator = operators[Math.floor(Math.random() * operators.length)]
      
      const detectionDate = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      const status = Math.random() > 0.3 ? 'resolved' : 'new'
      const action = status === 'resolved' ? 'Recalibrated instrument and repeated analysis' : ''
      const resolvedAt = status === 'resolved' ? new Date(detectionDate.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString() : ''

      violations.push([
        `VIO${String(violationId).padStart(3, '0')}`,
        violationType,
        analyte,
        level,
        instrument,
        lot,
        detectionDate.toISOString().split('T')[0],
        `RUN${(1000 + Math.floor(Math.random() * 30)).toString()}`,
        status,
        action,
        status === 'resolved' ? operator : '',
        resolvedAt
      ])

      violationId++
    }

    await sheetsService.appendSheet("violations", violations)
    console.log(`[v0] Added ${violations.length} sample violations`)

    // Add sample users
    console.log("[v0] Adding sample users...")
    const users = [
      [
        "USR001",
        "admin",
        "admin@iqcpro.com",
        "$2b$10$abcdefghijklmnopqrstuvwxyz123456789", // Hashed password placeholder
        "admin",
        "System Administrator",
        new Date().toISOString(),
        new Date().toISOString(),
        "true"
      ],
      [
        "USR002",
        "dr.smith",
        "smith@hospital.com",
        "$2b$10$abcdefghijklmnopqrstuvwxyz123456789",
        "operator",
        "Dr. John Smith",
        new Date().toISOString(),
        new Date().toISOString(),
        "true"
      ],
      [
        "USR003",
        "dr.johnson",
        "johnson@hospital.com",
        "$2b$10$abcdefghijklmnopqrstuvwxyz123456789",
        "operator",
        "Dr. Mary Johnson",
        new Date().toISOString(),
        new Date().toISOString(),
        "true"
      ],
      [
        "USR004",
        "supervisor",
        "supervisor@hospital.com",
        "$2b$10$abcdefghijklmnopqrstuvwxyz123456789",
        "supervisor",
        "Lab Supervisor",
        new Date().toISOString(),
        new Date().toISOString(),
        "true"
      ],
      [
        "USR005",
        "viewer",
        "viewer@hospital.com",
        "$2b$10$abcdefghijklmnopqrstuvwxyz123456789",
        "viewer",
        "Lab Viewer",
        new Date().toISOString(),
        new Date().toISOString(),
        "true"
      ]
    ]

    await sheetsService.appendSheet("users", users)
    console.log(`[v0] Added ${users.length} sample users`)

    console.log("[v0] Data seeding completed successfully!")
    console.log(`
📊 Seeding Summary:
✅ QC Points: ${qcPointsData.length} entries
✅ QC Limits: ${additionalQCLimits.length} additional limits
✅ Westgard Config: ${additionalWestgardConfig.length} configurations  
✅ Violations: ${violations.length} sample violations
✅ Users: ${users.length} sample users

Total: ${qcPointsData.length + additionalQCLimits.length + additionalWestgardConfig.length + violations.length + users.length} records added
    `)

    return { success: true, message: "Test data seeded successfully" }
  } catch (error) {
    console.error("[v0] Data seeding failed:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, error: errorMessage }
  }
}

// Run if called directly
if (require.main === module) {
  seedTestData()
    .then((result) => {
      console.log("[v0] Result:", result)
      process.exit(result.success ? 0 : 1)
    })
    .catch((error) => {
      console.error("[v0] Fatal error:", error)
      process.exit(1)
    })
}

export { seedTestData }
