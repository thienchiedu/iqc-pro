import { type NextRequest, NextResponse } from "next/server"
import { initializeDatabase } from "../../../../scripts/init-database"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Database initialization requested via API")
    const result = await initializeDatabase()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Database initialized successfully",
        timestamp: new Date().toISOString(),
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] API database initialization error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
