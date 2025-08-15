"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ViolationTracker } from "@/components/violations/violation-tracker"
import { ViolationReports } from "@/components/violations/violation-reports"

export default function ViolationsPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Quản Lý Vi Phạm</h1>
          <p className="text-muted-foreground">Theo dõi vi phạm QC và quản lý hành động khắc phục</p>
        </div>

        <Tabs defaultValue="tracker" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tracker">Theo Dõi Vi Phạm</TabsTrigger>
            <TabsTrigger value="reports">Báo Cáo & Phân Tích</TabsTrigger>
          </TabsList>

          <TabsContent value="tracker">
            <ViolationTracker />
          </TabsContent>

          <TabsContent value="reports">
            <ViolationReports />
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
