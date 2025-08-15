import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { username, password, full_name, role } = await request.json()

    if (!username || !password || !full_name || !role) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (!["technician", "manager"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const user = await AuthService.createUser({
      username,
      password,
      full_name,
      role,
    })

    return NextResponse.json({
      user,
      message: "User created successfully",
    })
  } catch (error) {
    console.error("Registration error:", error)

    if (error instanceof Error && error.message === "Username already exists") {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
