import { LotSetupForm } from "@/components/qc/lot-setup-form"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Header } from "@/components/layout/header"

export default function LotSetupPage() {
  return (
    <ProtectedRoute requiredRole="manager">
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Thiết Lập Lô QC</h1>
            <p className="text-muted-foreground">
              Cấu hình lô kiểm soát chất lượng và thiết lập giới hạn kiểm soát thống kê
            </p>
          </div>

          <div className="max-w-4xl">
            <LotSetupForm />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
