import { DatabaseInitializer } from "@/components/admin/database-init"

export default function InitDatabasePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Database Initialization</h1>
        <p className="text-muted-foreground mt-2">Set up your Google Sheets database for C-Lab IQC Pro</p>
      </div>

      <DatabaseInitializer />
    </div>
  )
}
