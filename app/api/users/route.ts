import { NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"

export async function GET() {
  try {
    const users = await AuthService.getAllUsers()
    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
