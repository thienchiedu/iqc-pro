"use client"

import type React from "react"

import { useState } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AnalyteConfig } from "@/components/config/analyte-config"
import { InstrumentConfig } from "@/components/config/instrument-config"
import { QCLevelConfig } from "@/components/config/qc-level-config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Settings, Download, Upload, Save, AlertTriangle } from "lucide-react"
import { BackButton } from "@/components/ui/back-button"

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

  const [westgardRules, setWestgardRules] = useState({
    enable_1_2s_warning: true,
    enable_1_3s_reject: true,
    enable_2_2s_within_run_reject: true,
    enable_2_2s_across_runs_reject: true,
    enable_R_4s_within_run_reject: true,
    enable_4_1s_reject: true,
    enable_10x_reject: true,
    // New rules - all OFF by default per specification
    enable_2of3_2s_reject: false,
    enable_3_1s_reject: false,
    enable_6x_reject: false,
    enable_9x_reject: false,
    enable_7T_reject: false,
    n_per_run: 2,
    enable_cusum: false,
    cusum_K: 0.5,
    cusum_H: 4.0,
    show_rule_extensions: false,
  })

  const { toast } = useToast()

  const handleSaveSettings = async () => {
    try {
      const response = await fetch("/api/config/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...systemSettings, westgardRules }),
      })

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Cài đặt hệ thống đã được lưu thành công",
        })
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể lưu cài đặt",
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
        <BackButton />
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Cấu hình hệ thống</h1>
            <p className="text-muted-foreground">Quản lý cài đặt hệ thống, analyte, thiết bị và thông số QC</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportConfig}>
              <Download className="h-4 w-4 mr-2" />
              Xuất cấu hình
            </Button>
            <Button variant="outline" asChild>
              <label htmlFor="import-config" className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Nhập cấu hình
                <input id="import-config" type="file" accept=".json" className="hidden" onChange={handleImportConfig} />
              </label>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="system" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="system">Cài đặt hệ thống</TabsTrigger>
            <TabsTrigger value="westgard">Quy tắc Westgard</TabsTrigger>
            <TabsTrigger value="analytes">Analyte</TabsTrigger>
            <TabsTrigger value="instruments">Thiết bị</TabsTrigger>
            <TabsTrigger value="qc-levels">Mức QC</TabsTrigger>
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

          <TabsContent value="westgard">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Cấu hình quy tắc Westgard
                </CardTitle>
                <CardDescription>Cấu hình các quy tắc Westgard và thông số kiểm soát chất lượng</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Quy tắc cơ bản</h3>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enable_1_2s_warning">1₂s (Cảnh báo)</Label>
                        <p className="text-sm text-muted-foreground">Điểm vượt ±2SD</p>
                      </div>
                      <Switch
                        id="enable_1_2s_warning"
                        checked={westgardRules.enable_1_2s_warning}
                        onCheckedChange={(checked) =>
                          setWestgardRules({ ...westgardRules, enable_1_2s_warning: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enable_1_3s_reject">1₃s (Từ chối)</Label>
                        <p className="text-sm text-muted-foreground">Điểm vượt ±3SD</p>
                      </div>
                      <Switch
                        id="enable_1_3s_reject"
                        checked={westgardRules.enable_1_3s_reject}
                        onCheckedChange={(checked) =>
                          setWestgardRules({ ...westgardRules, enable_1_3s_reject: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enable_2_2s_within_run_reject">2₂s (Trong run)</Label>
                        <p className="text-sm text-muted-foreground">2 điểm cùng phía ≥2SD trong run</p>
                      </div>
                      <Switch
                        id="enable_2_2s_within_run_reject"
                        checked={westgardRules.enable_2_2s_within_run_reject}
                        onCheckedChange={(checked) =>
                          setWestgardRules({ ...westgardRules, enable_2_2s_within_run_reject: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enable_2_2s_across_runs_reject">2₂s (Giữa run)</Label>
                        <p className="text-sm text-muted-foreground">2 điểm liên tiếp cùng phía ≥2SD</p>
                      </div>
                      <Switch
                        id="enable_2_2s_across_runs_reject"
                        checked={westgardRules.enable_2_2s_across_runs_reject}
                        onCheckedChange={(checked) =>
                          setWestgardRules({ ...westgardRules, enable_2_2s_across_runs_reject: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enable_R_4s_within_run_reject">R₄s</Label>
                        <p className="text-sm text-muted-foreground">Khoảng cách ≥4SD trong run</p>
                      </div>
                      <Switch
                        id="enable_R_4s_within_run_reject"
                        checked={westgardRules.enable_R_4s_within_run_reject}
                        onCheckedChange={(checked) =>
                          setWestgardRules({ ...westgardRules, enable_R_4s_within_run_reject: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enable_4_1s_reject">4₁s</Label>
                        <p className="text-sm text-muted-foreground">4 điểm liên tiếp &gt;1SD cùng phía</p>
                      </div>
                      <Switch
                        id="enable_4_1s_reject"
                        checked={westgardRules.enable_4_1s_reject}
                        onCheckedChange={(checked) =>
                          setWestgardRules({ ...westgardRules, enable_4_1s_reject: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enable_10x_reject">10x</Label>
                        <p className="text-sm text-muted-foreground">10 điểm liên tiếp cùng phía mean</p>
                      </div>
                      <Switch
                        id="enable_10x_reject"
                        checked={westgardRules.enable_10x_reject}
                        onCheckedChange={(checked) =>
                          setWestgardRules({ ...westgardRules, enable_10x_reject: checked })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">Quy tắc mở rộng (N=3)</h3>
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">Các quy tắc này mặc định TẮT để đảm bảo tương thích</p>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enable_2of3_2s_reject">2of3₂s</Label>
                        <p className="text-sm text-muted-foreground">2/3 điểm liên tiếp ≥2SD cùng phía</p>
                      </div>
                      <Switch
                        id="enable_2of3_2s_reject"
                        checked={westgardRules.enable_2of3_2s_reject}
                        onCheckedChange={(checked) =>
                          setWestgardRules({ ...westgardRules, enable_2of3_2s_reject: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enable_3_1s_reject">3₁s</Label>
                        <p className="text-sm text-muted-foreground">3 điểm liên tiếp &gt;1SD cùng phía</p>
                      </div>
                      <Switch
                        id="enable_3_1s_reject"
                        checked={westgardRules.enable_3_1s_reject}
                        onCheckedChange={(checked) =>
                          setWestgardRules({ ...westgardRules, enable_3_1s_reject: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enable_6x_reject">6x</Label>
                        <p className="text-sm text-muted-foreground">6 điểm liên tiếp cùng phía mean</p>
                      </div>
                      <Switch
                        id="enable_6x_reject"
                        checked={westgardRules.enable_6x_reject}
                        onCheckedChange={(checked) => setWestgardRules({ ...westgardRules, enable_6x_reject: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enable_9x_reject">9x</Label>
                        <p className="text-sm text-muted-foreground">9 điểm liên tiếp cùng phía mean</p>
                      </div>
                      <Switch
                        id="enable_9x_reject"
                        checked={westgardRules.enable_9x_reject}
                        onCheckedChange={(checked) => setWestgardRules({ ...westgardRules, enable_9x_reject: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enable_7T_reject">7T (Trend)</Label>
                        <p className="text-sm text-muted-foreground">7 điểm xu hướng tăng/giảm</p>
                      </div>
                      <Switch
                        id="enable_7T_reject"
                        checked={westgardRules.enable_7T_reject}
                        onCheckedChange={(checked) => setWestgardRules({ ...westgardRules, enable_7T_reject: checked })}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-semibold">Thông số cấu hình</h4>

                      <div>
                        <Label htmlFor="n_per_run">Số mức QC mỗi run (N)</Label>
                        <Select
                          value={westgardRules.n_per_run.toString()}
                          onValueChange={(value) =>
                            setWestgardRules({ ...westgardRules, n_per_run: Number.parseInt(value) })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">N=2</SelectItem>
                            <SelectItem value="3">N=3</SelectItem>
                            <SelectItem value="4">N=4</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="enable_cusum">CUSUM</Label>
                          <p className="text-sm text-muted-foreground">Phát hiện shift nhỏ</p>
                        </div>
                        <Switch
                          id="enable_cusum"
                          checked={westgardRules.enable_cusum}
                          onCheckedChange={(checked) => setWestgardRules({ ...westgardRules, enable_cusum: checked })}
                        />
                      </div>

                      {westgardRules.enable_cusum && (
                        <div className="grid grid-cols-2 gap-4 pl-4">
                          <div>
                            <Label htmlFor="cusum_K">K (Sensitivity)</Label>
                            <Input
                              id="cusum_K"
                              type="number"
                              step="0.1"
                              value={westgardRules.cusum_K}
                              onChange={(e) =>
                                setWestgardRules({ ...westgardRules, cusum_K: Number.parseFloat(e.target.value) })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="cusum_H">H (Decision limit)</Label>
                            <Input
                              id="cusum_H"
                              type="number"
                              step="0.1"
                              value={westgardRules.cusum_H}
                              onChange={(e) =>
                                setWestgardRules({ ...westgardRules, cusum_H: Number.parseFloat(e.target.value) })
                              }
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="show_rule_extensions">Hiển thị quy tắc mở rộng</Label>
                          <p className="text-sm text-muted-foreground">Hiển thị các quy tắc không chuẩn Westgard</p>
                        </div>
                        <Switch
                          id="show_rule_extensions"
                          checked={westgardRules.show_rule_extensions}
                          onCheckedChange={(checked) =>
                            setWestgardRules({ ...westgardRules, show_rule_extensions: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings}>
                    <Save className="h-4 w-4 mr-2" />
                    Lưu cài đặt
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
            <QCLevelConfig />
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}