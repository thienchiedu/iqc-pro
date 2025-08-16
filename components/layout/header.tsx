"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Activity, User, LogOut, Settings } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

export function Header() {
  const { user, logout, hasRole } = useAuth()

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-primary" />
            <Link href="/" className="text-2xl font-bold hover:text-primary">
              C-Lab IQC Pro
            </Link>
          </div>

          <nav className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/qc-monitor">Giám Sát QC</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/qc-entry">Nhập Dữ Liệu QC</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/violations">Vi Phạm</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/westgard-rules">Quy Tắc Westgard</Link>
            </Button>
            {hasRole("manager") && (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/configuration">Cấu Hình</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/lot-setup">Thiết Lập Lô</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/users">Người Dùng</Link>
                </Button>
              </>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  {user?.full_name || user?.username}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>
                  <div className="flex flex-col">
                    <span className="font-medium">{user?.full_name}</span>
                    <span className="text-sm text-muted-foreground capitalize">{user?.role}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <Settings className="h-4 w-4 mr-2" />
                    Cài Đặt Hồ Sơ
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Đăng Xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </header>
  )
}
