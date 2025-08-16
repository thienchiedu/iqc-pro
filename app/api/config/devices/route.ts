import { NextResponse } from "next/server"
import { getSheetsService } from "@/lib/google-sheets"

export async function GET() {
  try {
    const sheetsService = getSheetsService()
    const devices = await sheetsService.getDevices()
    
    return NextResponse.json({ devices })
  } catch (error) {
    console.error("Error fetching devices:", error)
    return NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      device_name, 
      serial_number, 
      manufacturer, 
      model, 
      installation_date, 
      last_maintenance, 
      is_active = true, 
      notes 
    } = body

    // Validate required fields
    if (!device_name || !serial_number) {
      return NextResponse.json(
        { error: "Missing required fields: device_name, serial_number" },
        { status: 400 }
      )
    }

    const sheetsService = getSheetsService()
    
    await sheetsService.addDevice({
      device_name,
      serial_number,
      manufacturer,
      model,
      installation_date,
      last_maintenance,
      is_active,
      notes,
    })

    return NextResponse.json({ 
      message: "Device added successfully",
      device: { device_name, serial_number, is_active }
    })
  } catch (error) {
    console.error("Error adding device:", error)
    return NextResponse.json({ error: "Failed to add device" }, { status: 500 })
  }
}
