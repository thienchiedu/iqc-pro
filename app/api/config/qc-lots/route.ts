import { NextResponse } from "next/server"
import { getSheetsService } from "@/lib/google-sheets"

export async function GET() {
  try {
    const sheetsService = getSheetsService()
    const qcLots = await sheetsService.getQCLots()
    
    return NextResponse.json({ qc_lots: qcLots })
  } catch (error) {
    console.error("Error fetching QC lots:", error)
    return NextResponse.json({ error: "Failed to fetch QC lots" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      test_id, 
      level, 
      lot_number, 
      expiry_date, 
      mean_mfg, 
      sd_mfg, 
      manufacturer, 
      product_name, 
      is_active = true, 
      notes 
    } = body

    // Validate required fields
    if (!test_id || !level || !lot_number || !expiry_date) {
      return NextResponse.json(
        { error: "Missing required fields: test_id, level, lot_number, expiry_date" },
        { status: 400 }
      )
    }

    const sheetsService = getSheetsService()
    
    await sheetsService.addQCLot({
      test_id,
      level,
      lot_number,
      expiry_date,
      mean_mfg,
      sd_mfg,
      manufacturer,
      product_name,
      is_active,
      notes,
    })

    return NextResponse.json({ 
      message: "QC lot added successfully",
      qc_lot: { test_id, level, lot_number, expiry_date, is_active }
    })
  } catch (error) {
    console.error("Error adding QC lot:", error)
    return NextResponse.json({ error: "Failed to add QC lot" }, { status: 500 })
  }
}
