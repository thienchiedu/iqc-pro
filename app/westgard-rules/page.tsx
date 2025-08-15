import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RuleTester } from "@/components/westgard/rule-tester"
import { RuleExplanations } from "@/components/westgard/rule-explanations"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Header } from "@/components/layout/header"

export default function WestgardRulesPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Quy Tắc Westgard</h1>
            <p className="text-muted-foreground">
              Kiểm tra, xác thực và hiểu về việc triển khai các quy tắc kiểm soát chất lượng Westgard
            </p>
          </div>

          <Tabs defaultValue="tester" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tester">Kiểm Tra Quy Tắc</TabsTrigger>
              <TabsTrigger value="explanations">Tài Liệu Tham Khảo</TabsTrigger>
            </TabsList>

            <TabsContent value="tester" className="space-y-6">
              <RuleTester />
            </TabsContent>

            <TabsContent value="explanations" className="space-y-6">
              <RuleExplanations />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  )
}
