"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
  isAuthenticated: boolean
  hasRole: (role: "technician" | "manager") => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const mockUser: User = {
      user_id: "mock_user_123",
      username: "demo_user",
      full_name: "Demo User",
      role: "manager", // Give manager role for full access
      created_at: new Date().toISOString(),
    }

    // Set mock user immediately to bypass authentication
    setUser(mockUser)
    setLoading(false)

    // Comment out the original token verification logic
    /*
    const token = localStorage.getItem("auth_token")
    if (token) {
      verifyToken(token)
    } else {
      setLoading(false)
    }
    */
  }, [])

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      if (response.ok) {
        const { user } = await response.json()
        setUser(user)
      } else {
        localStorage.removeItem("auth_token")
      }
    } catch (error) {
      console.error("Token verification failed:", error)
      localStorage.removeItem("auth_token")
    } finally {
      setLoading(false)
    }
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    return true

    // Comment out original login logic
    /*
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        const { user, token } = await response.json()
        localStorage.setItem("auth_token", token)
        setUser(user)
        return true
      } else {
        return false
      }
    } catch (error) {
      console.error("Login failed:", error)
      return false
    }
    */
  }

  const logout = () => {
    const mockUser: User = {
      user_id: "mock_user_123",
      username: "demo_user",
      full_name: "Demo User",
      role: "manager",
      created_at: new Date().toISOString(),
    }
    setUser(mockUser)
    localStorage.removeItem("auth_token")
  }

  const hasRole = (role: "technician" | "manager"): boolean => {
    if (!user) return false
    if (role === "manager") return user.role === "manager"
    return user.role === "technician" || user.role === "manager"
  }

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    hasRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
