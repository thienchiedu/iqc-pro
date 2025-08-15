"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { BookOpen, AlertTriangle, XCircle, TrendingUp, BarChart3, Zap } from "lucide-react"

interface RuleExplanation {
  code: string
  name: string
  description: string
  interpretation: string
  action: "reject" | "warning"
  scope: "within_run" | "across_runs" | "across_levels"
  sensitivity: "high" | "medium" | "low"
  specificity: "high" | "medium" | "low"
  commonCauses: string[]
  example: string
  icon: React.ReactNode
}

const westgardRules: RuleExplanation[] = [
  {
    code: "1_3s",
    name: "Quy Tắc 1₃s",
    description: "Một quan sát kiểm soát vượt quá ±3 độ lệch chuẩn từ trung bình",
    interpretation: "Chỉ ra lỗi ngẫu nhiên hoặc lỗi hệ thống có độ lớn cao",
    action: "reject",
    scope: "within_run",
    sensitivity: "low",
    specificity: "high",
    commonCauses: ["Lỗi pipet", "Nhầm lẫn mẫu", "Trục trặc thiết bị", "Nhiễm bẩn thuốc thử", "Biến động nhiệt độ"],
    example: "Nếu trung bình = 100 và SD = 5, bất kỳ giá trị < 85 hoặc > 115 sẽ kích hoạt quy tắc này",
    icon: <XCircle className="h-4 w-4" />,
  },
  {
    code: "1_2s",
    name: "Cảnh Báo 1₂s",
    description: "Một quan sát kiểm soát vượt quá ±2 độ lệch chuẩn từ trung bình",
    interpretation: "Mức cảnh báo - có thể chỉ ra sự bắt đầu của lỗi hệ thống",
    action: "warning",
    scope: "within_run",
    sensitivity: "high",
    specificity: "low",
    commonCauses: ["Phát hiện sớm lỗi hệ thống", "Biến động ngẫu nhiên", "Thay đổi môi trường", "Lão hóa thuốc thử"],
    example: "Nếu trung bình = 100 và SD = 5, giá trị < 90 hoặc > 110 sẽ kích hoạt cảnh báo này",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  {
    code: "2_2s_within",
    name: "2₂s Trong Run",
    description: "Hai quan sát kiểm soát trong cùng một run vượt quá ±2SD cùng phía trung bình",
    interpretation: "Chỉ ra lỗi hệ thống ảnh hưởng đến run phân tích",
    action: "reject",
    scope: "within_run",
    sensitivity: "medium",
    specificity: "high",
    commonCauses: ["Trôi dạt hiệu chuẩn", "Xuống cấp thuốc thử", "Thay đổi nhiệt độ trong run", "Trôi dạt thiết bị"],
    example: "L1 = 110 và L2 = 112 (cả hai > trung bình + 2SD) trong cùng run",
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    code: "2_2s_across",
    name: "2₂s Giữa Các Run",
    description: "Hai quan sát kiểm soát liên tiếp cùng level vượt quá ±2SD cùng phía",
    interpretation: "Chỉ ra lỗi hệ thống kéo dài qua các run",
    action: "reject",
    scope: "across_runs",
    sensitivity: "medium",
    specificity: "high",
    commonCauses: ["Sai lệch hiệu chuẩn", "Lỗi pipet hệ thống", "Thay đổi lô thuốc thử", "Trôi dạt môi trường"],
    example: "L1 trong Run 1 = 110, L1 trong Run 2 = 111 (cả hai > trung bình + 2SD)",
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    code: "R_4s",
    name: "Quy Tắc R₄s",
    description: "Khoảng giữa hai level kiểm soát trong cùng run vượt quá 4 độ lệch chuẩn",
    interpretation: "Chỉ ra lỗi ngẫu nhiên ảnh hưởng đến độ chính xác trong run",
    action: "reject",
    scope: "within_run",
    sensitivity: "medium",
    specificity: "high",
    commonCauses: [
      "Không chính xác trong pipet",
      "Vấn đề trộn mẫu",
      "Không ổn định nhiệt độ",
      "Nhiễu điện",
      "Vấn đề cơ khí",
    ],
    example: "L1 = 88, L2 = 112 (khoảng = 24, > 4×SD nếu SD = 5)",
    icon: <Zap className="h-4 w-4" />,
  },
  {
    code: "4_1s",
    name: "Quy Tắc 4₁s",
    description: "Bốn quan sát kiểm soát liên tiếp vượt quá ±1SD cùng phía trung bình",
    interpretation: "Chỉ ra lỗi hệ thống hoặc trôi dạt phát triển theo thời gian",
    action: "reject",
    scope: "across_runs",
    sensitivity: "high",
    specificity: "medium",
    commonCauses: [
      "Trôi dạt hiệu chuẩn dần dần",
      "Lão hóa thuốc thử",
      "Thay đổi môi trường",
      "Trôi dạt thiết bị",
      "Sai lệch hệ thống",
    ],
    example: "Bốn giá trị L1 liên tiếp: 106, 107, 105, 108 (tất cả > trung bình + 1SD)",
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    code: "10x",
    name: "Quy Tắc 10x",
    description: "Mười quan sát kiểm soát liên tiếp rơi vào cùng phía trung bình",
    interpretation: "Chỉ ra sai lệch hệ thống hoặc dịch chuyển hiệu chuẩn",
    action: "reject",
    scope: "across_runs",
    sensitivity: "high",
    specificity: "medium",
    commonCauses: [
      "Sai lệch hiệu chuẩn",
      "Lỗi hệ thống trong chuẩn",
      "Sai lệch môi trường",
      "Sai lệch lô thuốc thử",
      "Sai lệch thiết bị",
    ],
    example: "Mười giá trị liên tiếp đều trên hoặc đều dưới trung bình",
    icon: <TrendingUp className="h-4 w-4" />,
  },
]

export function RuleExplanations() {
  const getActionColor = (action: string) => {
    return action === "reject"
      ? "bg-red-100 text-red-800 border-red-200"
      : "bg-yellow-100 text-yellow-800 border-yellow-200"
  }

  const getSensitivityColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-green-100 text-green-800 border-green-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const translateLevel = (level: string) => {
    const translations: Record<string, string> = {
      high: "cao",
      medium: "trung bình",
      low: "thấp",
    }
    return translations[level] || level
  }

  const translateAction = (action: string) => {
    return action === "reject" ? "TỪ CHỐI" : "CẢNH BÁO"
  }

  const translateScope = (scope: string) => {
    const translations: Record<string, string> = {
      within_run: "trong run",
      across_runs: "giữa các run",
      across_levels: "giữa các level",
    }
    return translations[scope] || scope
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Tài Liệu Tham Khảo Quy Tắc Westgard
          </CardTitle>
          <CardDescription>
            Hướng dẫn toàn diện về các quy tắc kiểm soát chất lượng Westgard và cách giải thích
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Quan trọng:</strong> Các quy tắc Westgard nên được áp dụng một cách có hệ thống và kết hợp. Việc
              lựa chọn quy tắc phụ thuộc vào mức sigma của phương pháp phân tích và yêu cầu chất lượng.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {westgardRules.map((rule, index) => (
        <Card key={rule.code}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {rule.icon}
                {rule.name}
              </div>
              <div className="flex gap-2">
                <Badge className={getActionColor(rule.action)}>{translateAction(rule.action)}</Badge>
                <Badge variant="outline">{translateScope(rule.scope)}</Badge>
              </div>
            </CardTitle>
            <CardDescription>{rule.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">Giải Thích</h4>
                  <p className="text-sm text-muted-foreground">{rule.interpretation}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Đặc Tính Hiệu Suất</h4>
                  <div className="flex gap-2">
                    <Badge className={getSensitivityColor(rule.sensitivity)}>
                      Độ nhạy: {translateLevel(rule.sensitivity)}
                    </Badge>
                    <Badge className={getSensitivityColor(rule.specificity)}>
                      Độ đặc hiệu: {translateLevel(rule.specificity)}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Ví Dụ</h4>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded border">{rule.example}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Nguyên Nhân Thường Gặp</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {rule.commonCauses.map((cause, causeIndex) => (
                    <li key={causeIndex} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{cause}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Sigma Rules Guidance */}
      <Card>
        <CardHeader>
          <CardTitle>Lựa Chọn Quy Tắc Dựa Trên Sigma</CardTitle>
          <CardDescription>
            Khuyến nghị kết hợp quy tắc dựa trên hiệu suất phương pháp phân tích (mức Sigma)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-green-600 mb-2">≥6 Sigma (Xuất Sắc)</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Phương pháp chất lượng cao với độ chính xác và độ đúng xuất sắc
              </p>
              <div className="space-y-1">
                <Badge variant="outline" className="mr-1">
                  1₃s
                </Badge>
                <p className="text-xs text-muted-foreground">Quy tắc đơn đủ cho hầu hết ứng dụng</p>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-blue-600 mb-2">≈5 Sigma (Tốt)</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Phương pháp chất lượng tốt với hiệu suất chấp nhận được
              </p>
              <div className="space-y-1">
                <Badge variant="outline" className="mr-1">
                  1₃s
                </Badge>
                <Badge variant="outline" className="mr-1">
                  2₂s
                </Badge>
                <Badge variant="outline" className="mr-1">
                  R₄s
                </Badge>
                <p className="text-xs text-muted-foreground">Khuyến nghị phương pháp đa quy tắc</p>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-orange-600 mb-2">≈4 Sigma (Chấp Nhận Được)</h4>
              <p className="text-sm text-muted-foreground mb-2">Phương pháp chấp nhận được cần giám sát tăng cường</p>
              <div className="space-y-1">
                <Badge variant="outline" className="mr-1">
                  1₃s
                </Badge>
                <Badge variant="outline" className="mr-1">
                  2₂s
                </Badge>
                <Badge variant="outline" className="mr-1">
                  R₄s
                </Badge>
                <Badge variant="outline" className="mr-1">
                  4₁s
                </Badge>
                <p className="text-xs text-muted-foreground">Bộ quy tắc mở rộng với N=4 hoặc N=2×2</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">Hướng Dẫn Triển Khai</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  <strong>Bắt đầu đơn giản:</strong> Bắt đầu với quy tắc 1₃s và thêm độ phức tạp khi cần
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  <strong>Xem xét tỷ lệ từ chối sai:</strong> Nhiều quy tắc hơn = tỷ lệ từ chối sai cao hơn
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  <strong>Cân bằng độ nhạy vs độ đặc hiệu:</strong> Chọn quy tắc dựa trên nhu cầu phát hiện lỗi
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  <strong>Ghi chép quyết định:</strong> Ghi lại lý do cho việc lựa chọn và cấu hình quy tắc
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
