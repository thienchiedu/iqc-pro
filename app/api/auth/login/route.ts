import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    const authUser = await AuthService.authenticateUser(username, password)

    if (!authUser) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const { token, ...user } = authUser

    return NextResponse.json({
      user,
      token,
      message: "Login successful",
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
