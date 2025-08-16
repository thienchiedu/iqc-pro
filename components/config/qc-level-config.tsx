"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export function QCLevelConfig() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cấu Hình Mức QC</CardTitle>
        <CardDescription>
          Quản lý các mức kiểm tra chất lượng (ví dụ: Level 1, Level 2) cho từng lô QC.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">Chức năng cấu hình Mức QC sắp ra mắt.</p>
        </div>
      </CardContent>
    </Card>
  )
}
