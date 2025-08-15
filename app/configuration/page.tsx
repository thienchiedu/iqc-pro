"use client"

import type React from "react"

import { useState } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AnalyteConfig } from "@/components/config/analyte-config"
import { InstrumentConfig } from "@/components/config/instrument-config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Settings, Download, Upload, Save } from "lucide-react"

export default function ConfigurationPage() {
  const [systemSettings, setSystemSettings] = useState({
    labName: "C-Lab Quality Control",
    timezone: "UTC",
    dateFormat: "YYYY-MM-DD",
    autoBackup: true,
    emailNotifications: true,
    smsNotifications: false,
    defaultWestgardRules: ["1-3s", "2-2s", "4-1s", "10-x"],
    retentionPeriod: "365",
  })
  const { toast } = useToast()

  const handleSaveSettings = async () => {
    try {
      const response = await fetch("/api/config/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(systemSettings),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "System settings saved successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    }
  }

  const handleExportConfig = async () => {
    try {
      const response = await fetch("/api/config/export")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `qc-config-${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Success",
          description: "Configuration exported successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export configuration",
        variant: "destructive",
      })
    }
  }

  const handleImportConfig = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append("config", file)

      const response = await fetch("/api/config/import", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Configuration imported successfully",
        })
        // Refresh the page to show updated configuration
        window.location.reload()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import configuration",
        variant: "destructive",
      })
    }
  }

  return (
    <ProtectedRoute requiredRole="manager">
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">System Configuration</h1>
            <p className="text-muted-foreground">Manage system settings, analytes, instruments, and QC parameters</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportConfig}>
              <Download className="h-4 w-4 mr-2" />
              Export Config
            </Button>
            <Button variant="outline" asChild>
              <label htmlFor="import-config" className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Import Config
                <input id="import-config" type="file" accept=".json" className="hidden" onChange={handleImportConfig} />
              </label>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="system" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="system">System Settings</TabsTrigger>
            <TabsTrigger value="analytes">Analytes</TabsTrigger>
            <TabsTrigger value="instruments">Instruments</TabsTrigger>
            <TabsTrigger value="qc-levels">QC Levels</TabsTrigger>
          </TabsList>

          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Settings
                </CardTitle>
                <CardDescription>Configure global system preferences and default values</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="labName">Laboratory Name</Label>
                      <Input
                        id="labName"
                        value={systemSettings.labName}
                        onChange={(e) => setSystemSettings({ ...systemSettings, labName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={systemSettings.timezone}
                        onValueChange={(value) => setSystemSettings({ ...systemSettings, timezone: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select
                        value={systemSettings.dateFormat}
                        onValueChange={(value) => setSystemSettings({ ...systemSettings, dateFormat: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="retentionPeriod">Data Retention (days)</Label>
                      <Input
                        id="retentionPeriod"
                        type="number"
                        value={systemSettings.retentionPeriod}
                        onChange={(e) => setSystemSettings({ ...systemSettings, retentionPeriod: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="autoBackup">Automatic Backup</Label>
                      <Switch
                        id="autoBackup"
                        checked={systemSettings.autoBackup}
                        onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, autoBackup: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="emailNotifications">Email Notifications</Label>
                      <Switch
                        id="emailNotifications"
                        checked={systemSettings.emailNotifications}
                        onCheckedChange={(checked) =>
                          setSystemSettings({ ...systemSettings, emailNotifications: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="smsNotifications">SMS Notifications</Label>
                      <Switch
                        id="smsNotifications"
                        checked={systemSettings.smsNotifications}
                        onCheckedChange={(checked) =>
                          setSystemSettings({ ...systemSettings, smsNotifications: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-4">Default Westgard Rules</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {["1-3s", "2-2s", "4-1s", "10-x", "R-4s", "2of3-2s", "8-x", "12-x"].map((rule) => (
                      <div key={rule} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={rule}
                          checked={systemSettings.defaultWestgardRules.includes(rule)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSystemSettings({
                                ...systemSettings,
                                defaultWestgardRules: [...systemSettings.defaultWestgardRules, rule],
                              })
                            } else {
                              setSystemSettings({
                                ...systemSettings,
                                defaultWestgardRules: systemSettings.defaultWestgardRules.filter((r) => r !== rule),
                              })
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={rule}>{rule}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytes">
            <AnalyteConfig />
          </TabsContent>

          <TabsContent value="instruments">
            <InstrumentConfig />
          </TabsContent>

          <TabsContent value="qc-levels">
            <Card>
              <CardHeader>
                <CardTitle>QC Level Configuration</CardTitle>
                <CardDescription>Manage QC levels and their target values</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">QC Level configuration will be implemented in the next phase.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
