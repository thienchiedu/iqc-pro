import { getSheetsService } from "./google-sheets"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export interface User {
  user_id: string
  username: string
  full_name: string
  role: "technician" | "manager"
  created_at: string
}

export interface AuthUser extends User {
  token: string
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export class AuthService {
  private static async getUsers(): Promise<any[]> {
    const sheetsService = getSheetsService()
    const data = await sheetsService.readSheet("users")

    if (data.length === 0) return []

    const headers = data[0]
    const rows = data.slice(1)

    return rows.map((row) => {
      const user: any = {}
      headers.forEach((header, index) => {
        user[header] = row[index] || ""
      })
      return user
    })
  }

  static async createUser(userData: {
    username: string
    password: string
    full_name: string
    role: "technician" | "manager"
  }): Promise<User> {
    const sheetsService = getSheetsService()

    // Check if username already exists
    const existingUsers = await this.getUsers()
    const userExists = existingUsers.some((u) => u.username === userData.username)

    if (userExists) {
      throw new Error("Username already exists")
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, 10)

    const user = {
      user_id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      username: userData.username,
      password_hash: passwordHash,
      full_name: userData.full_name,
      role: userData.role,
      created_at: new Date().toISOString(),
    }

    // Add to sheet
    const headers = ["user_id", "username", "password_hash", "full_name", "role", "created_at"]
    const row = headers.map((header) => user[header as keyof typeof user] || "")
    await sheetsService.appendSheet("users", [row])

    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user
    return userWithoutPassword as User
  }

  static async authenticateUser(username: string, password: string): Promise<AuthUser | null> {
    const users = await this.getUsers()
    const user = users.find((u) => u.username === username)

    if (!user) {
      return null
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return null
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    )

    const { password_hash, ...userWithoutPassword } = user
    return {
      ...userWithoutPassword,
      token,
    } as AuthUser
  }

  static async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      const users = await this.getUsers()
      const user = users.find((u) => u.user_id === decoded.user_id)

      if (!user) {
        return null
      }

      const { password_hash, ...userWithoutPassword } = user
      return userWithoutPassword as User
    } catch (error) {
      return null
    }
  }

  static async getAllUsers(): Promise<User[]> {
    const users = await this.getUsers()
    return users.map((user) => {
      const { password_hash, ...userWithoutPassword } = user
      return userWithoutPassword as User
    })
  }

  static async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    // For now, we'll implement a simple version
    // In a real implementation, you'd want to update the specific row in the sheet
    const users = await this.getUsers()
    const userIndex = users.findIndex((u) => u.user_id === userId)

    if (userIndex === -1) {
      return null
    }

    const updatedUser = { ...users[userIndex], ...updates }
    const { password_hash, ...userWithoutPassword } = updatedUser
    return userWithoutPassword as User
  }

  static async deleteUser(userId: string): Promise<boolean> {
    // For now, we'll return true
    // In a real implementation, you'd want to remove the row from the sheet
    return true
  }
}
