import { NextResponse } from "next/server"
import { getSheetsService } from "@/lib/google-sheets"

export async function GET() {
  try {
    const sheetsService = getSheetsService()
    
    // Get today's date for filtering
    const today = new Date().toISOString().split('T')[0]
    
    // Fetch QC Points for today
    const todayQCPoints = await sheetsService.getQCPoints({
      startDate: today,
      endDate: today
    })

    // Fetch all violations
    const allViolations = await sheetsService.getViolations()
    
    // Get active violations (new status)
    const activeViolations = allViolations.filter(v => v.status === 'new')

    // Get QC Limits to count locked lots
    const qcLimits = await sheetsService.getQCLimits()
    const lockedLots = qcLimits.filter(limit => limit.is_locked)

    // Get unique instruments from QC limits
    const allInstruments = [...new Set(qcLimits.map(limit => limit.instrument_id))]

    // Check Google Sheets connection
    let connectionStatus = 'Connected'
    try {
      // Try to read a small range to test connection
      await sheetsService.readSheet('qc_points', 'A1:A1')
    } catch (error) {
      connectionStatus = 'Error'
    }

    return NextResponse.json({
      activeQCPoints: todayQCPoints.length,
      activeViolations: activeViolations.length,
      lockedLots: lockedLots.length,
      instruments: allInstruments.length,
      systemStatus: {
        googleSheetsConnection: connectionStatus,
        westgardRulesEngine: 'Active',
        databaseSchema: 'Ready'
      }
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ 
      error: "Failed to fetch dashboard statistics",
      activeQCPoints: 0,
      activeViolations: 0, 
      lockedLots: 0,
      instruments: 0,
      systemStatus: {
        googleSheetsConnection: 'Error',
        westgardRulesEngine: 'Active', 
        databaseSchema: 'Error'
      }
    }, { status: 500 })
  }
}
