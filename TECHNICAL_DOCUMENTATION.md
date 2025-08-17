# C-Lab IQC Pro - Tài liệu Kỹ thuật Chi tiết

## Kiến trúc Hệ thống

### Tổng quan Kiến trúc
C-Lab IQC Pro được xây dựng theo kiến trúc **Full-Stack Next.js** với các thành phần chính:

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │  Google Sheets  │
│   (Next.js)     │◄──►│   (Next.js)     │◄──►│   (Database)    │
│                 │    │                 │    │                 │
│ - React UI      │    │ - Route Handlers│    │ - QC_Points     │
│ - Recharts      │    │ - Middleware    │    │ - QC_Limits     │
│ - shadcn/ui     │    │ - Auth Logic    │    │ - Users         │
│ - Tailwind CSS  │    │ - Westgard Eng. │    │ - Violations    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
\`\`\`

### Tech Stack Chi tiết

#### Frontend
- **Next.js 14**: App Router với Server/Client Components
- **React 18**: Hooks, Context API, Suspense
- **TypeScript**: Full type safety
- **Tailwind CSS v4**: Utility-first styling
- **shadcn/ui**: Component library
- **Recharts**: Data visualization
- **Lucide React**: Icon system
- **date-fns**: Date manipulation

#### Backend
- **Next.js API Routes**: RESTful endpoints
- **JWT**: Authentication tokens
- **bcrypt**: Password hashing
- **Google Sheets API**: Database operations
- **Middleware**: Route protection

## Cấu trúc Thư mục

\`\`\`
c-lab-iqc-pro/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── qc/                   # QC management endpoints
│   │   ├── config/               # Configuration endpoints
│   │   └── violations/           # Violation management
│   ├── qc-entry/                 # QC data entry page
│   ├── qc-monitor/               # QC monitoring dashboard
│   ├── lot-setup/                # Lot setup page
│   ├── westgard-rules/           # Rules testing page
│   ├── configuration/            # System configuration
│   ├── violations/               # Violation management
│   ├── users/                    # User management
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Dashboard
│   └── globals.css               # Global styles
├── components/                   # React Components
│   ├── auth/                     # Authentication components
│   ├── charts/                   # Chart components
│   ├── config/                   # Configuration components
│   ├── layout/                   # Layout components
│   ├── qc/                       # QC-specific components
│   ├── ui/                       # shadcn/ui components
│   ├── violations/               # Violation components
│   └── westgard/                 # Westgard rules components
├── contexts/                     # React Contexts
│   └── auth-context.tsx          # Authentication context
├── hooks/                        # Custom React Hooks
├── lib/                          # Utility libraries
│   ├── auth.ts                   # Authentication utilities
│   ├── google-sheets.ts          # Google Sheets service
│   ├── statistical-engine.ts    # Statistical calculations
│   ├── westgard-rules.ts         # Westgard rules engine
│   └── utils.ts                  # General utilities
└── types/                        # TypeScript type definitions
\`\`\`

## Thành phần Chính

### 1. Authentication System

#### AuthContext (`contexts/auth-context.tsx`)
\`\`\`typescript
interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}
\`\`\`

**Tính năng:**
- JWT token management với httpOnly cookies
- Automatic token refresh
- Role-based access control (technician/manager)
- Protected route wrapper

#### Authentication Flow
1. User submits credentials
2. Server validates against Google Sheets Users table
3. JWT token generated và stored in httpOnly cookie
4. Client receives user data và authentication state
5. Subsequent requests include token in cookie header

### 2. Google Sheets Integration

#### GoogleSheetsService (`lib/google-sheets.ts`)
\`\`\`typescript
class GoogleSheetsService {
  private sheets: sheets_v4.Sheets
  private spreadsheetId: string

  async readSheet(sheetName: string): Promise<any[][]>
  async writeSheet(sheetName: string, data: any[][]): Promise<void>
  async appendRow(sheetName: string, row: any[]): Promise<void>
  async updateRow(sheetName: string, rowIndex: number, data: any[]): Promise<void>
}
\`\`\`

**Database Schema:**
- **QC_Points**: Lưu trữ tất cả điểm dữ liệu QC
- **QC_Limits**: Control limits cho từng analyte/level/instrument/lot
- **Users**: Thông tin người dùng và authentication
- **Analytes**: Cấu hình analytes và reference ranges
- **Instruments**: Thông tin thiết bị và maintenance
- **Violations**: Tracking vi phạm Westgard rules
- **Corrective_Actions**: Hành động khắc phục cho violations

### 3. Statistical Engine

#### StatisticalEngine (`lib/statistical-engine.ts`)
\`\`\`typescript
class StatisticalEngine {
  // Basic Statistics
  static calculateMean(values: number[]): number
  static calculateSD(values: number[]): number
  static calculateCV(mean: number, sd: number): number
  
  // Control Limits
  static calculateControlLimits(mean: number, sd: number): ControlLimits
  
  // Advanced Statistics
  static calculateZScore(value: number, mean: number, sd: number): number
  static detectTrend(values: number[]): TrendResult
  static calculateCapabilityIndices(values: number[], limits: ControlLimits): CapabilityIndices
}
\`\`\`

**Tính năng thống kê:**
- Descriptive statistics (Mean, SD, CV, Range)
- Control limits calculation (±1SD, ±2SD, ±3SD)
- Z-score normalization
- Trend detection (Nelson rules)
- Process capability indices (Cp, Cpk)
- Outlier detection

### 3.1. Coefficient of Variation (CV)

The Coefficient of Variation (CV) is a standardized measure of dispersion of a probability distribution or frequency distribution. It is often expressed as a percentage, and is defined as the ratio of the standard deviation to the mean.

**Formula:**

`CV = (Standard Deviation / Mean) * 100%`

**Use in QC:**

*   **Comparing Precision:** CV is used to compare the precision of different analytes, methods, or instruments, especially when their means are different. A lower CV indicates higher precision.
*   **Quality Control Rules:** It helps in setting up QC rules. For instance, a process with a consistently low CV might require less stringent QC rules.
*   **Sigma Metrics:** CV is a critical component in the calculation of Sigma metrics, which provides a long-term measure of process performance. The formula is: `Sigma = (TEa - Bias) / CV`, where TEa is the Total Allowable Error.

### 4. Westgard Rules Engine

#### WestgardRulesEngine (`lib/westgard-rules.ts`)
\`\`\`typescript
interface WestgardRule {
  name: string
  code: string
  description: string
  checkFunction: (points: QCPoint[], limits: ControlLimits) => RuleViolation[]
  falseRejectionRate: number
}

class WestgardRulesEngine {
  private rules: WestgardRule[]
  
  checkAllRules(points: QCPoint[], limits: ControlLimits): RuleViolation[]
  checkSpecificRule(ruleName: string, points: QCPoint[], limits: ControlLimits): RuleViolation[]
}
\`\`\`

**Implemented Rules:**
1. **1-3s**: 1 điểm > 3SD
2. **2-2s**: 2 điểm liên tiếp > 2SD (cùng phía)
3. **R-4s**: 2 điểm liên tiếp cách nhau > 4SD
4. **4-1s**: 4 điểm liên tiếp > 1SD (cùng phía)
5. **10-x**: 10 điểm liên tiếp cùng phía mean
6. **7-T**: 7 điểm liên tiếp tăng/giảm
7. **2-2s (across)**: 2 điểm > 2SD (khác phía)
8. **3-1s**: 3 điểm liên tiếp > 1SD (cùng phía)

### 5. Levey-Jennings Charts

#### LeveyJenningsChart (`components/charts/levey-jennings-chart.tsx`)
\`\`\`typescript
interface LeveyJenningsChartProps {
  data: QCPoint[]
  limits: ControlLimits
  violations: RuleViolation[]
  onPointClick?: (point: QCPoint) => void
}
\`\`\`

**Tính năng:**
- Interactive scatter plot với Recharts
- Control limits visualization (±1SD, ±2SD, ±3SD)
- Color-coded points (in-control/warning/reject)
- Violation highlighting và tooltips
- Zoom và pan functionality
- Export to PNG/SVG

### 6. QC Data Management

#### QC Entry Flow
1. **Form Validation**: Analyte, level, instrument, lot selection
2. **Data Ingestion**: Store in QC_Points sheet
3. **Statistical Analysis**: Calculate statistics if enough data
4. **Rule Checking**: Run Westgard rules engine
5. **Violation Handling**: Create violation records if rules violated
6. **Notification**: Alert users of violations

#### Lot Management
- **Setup Phase**: Create new lot, collect initial data
- **Establishment Phase**: Collect 20+ points, calculate limits
- **Lock Phase**: Finalize limits, enable rule checking
- **Active Phase**: Ongoing QC monitoring

### 7. Configuration Management

#### System Configuration
\`\`\`typescript
interface SystemConfig {
  timezone: string
  notifications: {
    email: boolean
    inApp: boolean
    violations: boolean
  }
  westgardDefaults: {
    rules: string[]
    nValue: number
    sigmaLevel: number
  }
  qcDefaults: {
    controlLimits: number
    minimumN: number
  }
}
\`\`\`

#### Analyte Configuration
- Name, unit, category
- Reference ranges (low/high)
- QC levels và expected ranges
- Westgard rule preferences

#### Instrument Configuration
- Name, model, serial number
- Location và responsible person
- Maintenance schedule
- Calibration history

### 8. Violation Tracking System

#### Violation Management
\`\`\`typescript
interface Violation {
  id: string
  qcPointId: string
  ruleViolated: string
  severity: 'warning' | 'reject'
  status: 'open' | 'investigating' | 'resolved'
  createdDate: Date
  resolvedDate?: Date
  correctiveActions: CorrectiveAction[]
}
\`\`\`

#### Corrective Action Workflow
1. **Detection**: Westgard rule violation detected
2. **Assignment**: Assign to responsible person
3. **Investigation**: Root cause analysis
4. **Action**: Implement corrective measures
5. **Verification**: Verify effectiveness
6. **Closure**: Close violation record

## API Design

### RESTful Endpoints

#### Authentication
\`\`\`
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/verify
POST /api/auth/logout
\`\`\`

#### QC Management
\`\`\`
POST /api/qc/ingest              # Nhập dữ liệu QC
GET  /api/qc/points              # Lấy QC points
POST /api/qc/limits/establish    # Thiết lập limits
POST /api/qc/limits/lock         # Khóa limits
GET  /api/qc/config              # Lấy cấu hình QC
\`\`\`

#### Configuration
\`\`\`
GET  /api/config/analytes        # Lấy danh sách analytes
POST /api/config/analytes        # Thêm/sửa analyte
GET  /api/config/instruments     # Lấy danh sách instruments
POST /api/config/instruments     # Thêm/sửa instrument
GET  /api/config/system          # System settings
POST /api/config/system          # Update settings
\`\`\`

#### Violations
\`\`\`
GET  /api/violations             # Lấy danh sách violations
POST /api/violations             # Tạo violation mới
GET  /api/violations/stats       # Violation statistics
POST /api/violations/corrective-actions  # Thêm corrective action
\`\`\`

### Error Handling
\`\`\`typescript
interface APIResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
}
\`\`\`

## Security Implementation

### Authentication Security
- **JWT Tokens**: Signed với secret key
- **HttpOnly Cookies**: Prevent XSS attacks
- **Token Expiration**: 24 hour expiry
- **Refresh Mechanism**: Automatic token refresh

### Authorization
- **Role-based Access**: Technician vs Manager permissions
- **Route Protection**: Middleware validates tokens
- **API Security**: Protected endpoints require authentication

### Data Security
- **Input Validation**: Zod schemas for type safety
- **SQL Injection Prevention**: Parameterized queries
- **XSS Prevention**: Input sanitization
- **CSRF Protection**: SameSite cookies

## Performance Optimization

### Frontend Optimization
- **Code Splitting**: Dynamic imports cho heavy components
- **Lazy Loading**: Suspense boundaries
- **Memoization**: React.memo cho expensive components
- **Virtual Scrolling**: Large data tables

### Backend Optimization
- **Caching**: In-memory cache cho frequently accessed data
- **Batch Operations**: Bulk Google Sheets operations
- **Connection Pooling**: Reuse Google API connections
- **Rate Limiting**: Prevent API abuse

### Database Optimization
- **Indexing**: Proper sheet structure for fast lookups
- **Data Pagination**: Limit large data transfers
- **Incremental Updates**: Only sync changed data
- **Compression**: Minimize payload sizes

## Testing Strategy

### Unit Testing
- **Components**: React Testing Library
- **Utilities**: Jest test suites
- **API Routes**: Supertest integration
- **Statistical Functions**: Mathematical accuracy tests

### Integration Testing
- **Authentication Flow**: End-to-end login/logout
- **QC Workflow**: Complete data entry to violation
- **Google Sheets**: API integration tests
- **Westgard Rules**: Rule accuracy validation

### Performance Testing
- **Load Testing**: Concurrent user simulation
- **Stress Testing**: High data volume scenarios
- **Memory Profiling**: Memory leak detection
- **API Response Times**: Latency measurements

## Deployment Architecture

### Production Environment
\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel CDN    │    │   Vercel Edge   │    │  Google Cloud   │
│   (Static)      │◄──►│   (Serverless)  │◄──►│   (Sheets API)  │
│                 │    │                 │    │                 │
│ - Next.js Build │    │ - API Routes    │    │ - Service Acc.  │
│ - Static Assets │    │ - Middleware    │    │ - Spreadsheets  │
│ - Edge Caching  │    │ - JWT Handling  │    │ - IAM Security  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
\`\`\`

### Environment Configuration
\`\`\`env
# Production
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
JWT_SECRET=production-secret-key

# Google Cloud
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=/path/to/prod-key.json
GOOGLE_SHEETS_SPREADSHEET_ID=prod-spreadsheet-id

# Monitoring
SENTRY_DSN=your-sentry-dsn
ANALYTICS_ID=your-analytics-id
\`\`\`

## Monitoring & Logging

### Application Monitoring
- **Error Tracking**: Sentry integration
- **Performance Monitoring**: Web Vitals tracking
- **User Analytics**: Usage patterns analysis
- **API Monitoring**: Response times và error rates

### Logging Strategy
\`\`\`typescript
// Structured logging
logger.info('QC data ingested', {
  userId: user.id,
  analyte: data.analyte,
  value: data.value,
  violations: violations.length
})

logger.error('Westgard rule check failed', {
  error: error.message,
  qcPointId: point.id,
  rule: rule.name
})
\`\`\`

### Health Checks
- **API Health**: `/api/health` endpoint
- **Database Connectivity**: Google Sheets API status
- **Authentication Service**: JWT validation
- **Statistical Engine**: Calculation accuracy

## Maintenance & Updates

### Regular Maintenance
- **Security Updates**: Monthly dependency updates
- **Performance Review**: Quarterly performance analysis
- **Data Cleanup**: Archive old QC data
- **Backup Verification**: Monthly backup tests

### Feature Updates
- **Version Control**: Semantic versioning
- **Database Migrations**: Schema update procedures
- **Rollback Strategy**: Quick revert capabilities
- **User Communication**: Change notifications

### Troubleshooting Guide
1. **Authentication Issues**: Check JWT secret và cookie settings
2. **Google Sheets Errors**: Verify service account permissions
3. **Statistical Calculations**: Validate input data ranges
4. **Performance Issues**: Check API response times
5. **UI Bugs**: Browser console logs analysis

## Future Enhancements

### Planned Features
- **Mobile App**: React Native companion
- **Advanced Analytics**: Machine learning predictions
- **Multi-lab Support**: Tenant isolation
- **Real-time Notifications**: WebSocket integration
- **Audit Trail**: Complete change tracking
- **Data Export**: PDF reports generation

### Scalability Considerations
- **Database Migration**: Move to PostgreSQL for larger datasets
- **Microservices**: Split into domain-specific services
- **Caching Layer**: Redis for session management
- **Load Balancing**: Multiple server instances
- **CDN Integration**: Global content delivery

---

*Tài liệu này được cập nhật thường xuyên. Phiên bản hiện tại: v1.0.0*
Dưới đây là bản thiết kế phần mềm IQC & Quality Control hoàn chỉnh (end-to-end) cho phòng xét nghiệm của bạn. Tài liệu đã hợp nhất các yêu cầu trước đó, bám sát chuẩn Levey–Jennings + Westgard Rules (định nghĩa quy tắc, cách thiết lập giới hạn, vai trò của 1₍2s₎, phạm vi R₍4s₎) và khuyến nghị CLSI C24 về lập kế hoạch QC. Những chỗ quan trọng được gắn nguồn tham khảo tin cậy.

1) Mục tiêu & phạm vi

Mục tiêu: Giám sát IQC theo đồ thị Levey–Jennings với multirule Westgard; cảnh báo vi phạm; ghi nhận nguyên nhân/khắc phục; báo cáo hiệu năng theo ngày/tháng/máy/xét nghiệm.

Phạm vi: Hóa sinh (N=2 phổ biến), huyết học/đông máu/miễn dịch (N=3 hoặc 4); cấu hình quy tắc theo từng thông số (per-analyte), theo mức QC (L1/L2/L3), theo máy và theo lô.

Nguyên tắc cốt lõi:

Thiết lập giới hạn theo từng lô từ ≥20 kết quả nội bộ qua ≥10 ngày, tính mean/SD → khóa (lock) và dùng ổn định cho đến khi đổi lô. 
Westgard QC

Áp dụng Westgard multirule đúng định nghĩa: 1₍3s₎, 2₍2s₎, R₍4s₎ chỉ within-run, 4₍1s₎, 10x (và biến thể 8x/12x). 1₍2s₎ là cảnh báo (warning), có thể bật/tắt. 
Westgard QC
+1

Chọn bộ quy tắc theo chất lượng Sigma: 6σ → 1₍3s₎; 5σ → 1₍3s₎/2₍2s₎/R₍4s₎; 4σ → +4₍1s₎ (N=4 ưu tiên). 
Westgard QC

2) Vai trò người dùng & quyền

data_entry (KTV nhập liệu): nhập điểm QC, ghi chú, RCA; xem cảnh báo.

lead_tech (KTV trưởng): duyệt/chốt vi phạm, cập nhật RCA.

qa_manager (QL chất lượng): cấu hình quy tắc per-analyte/lot, phê duyệt “establish & lock” limits.

unit_manager (QL đơn vị): xem báo cáo tổng hợp, KPI.

admin/sadmin: quản trị hệ thống, phân quyền, nhật ký/audit.

3) Kiến trúc & công nghệ

Frontend: Next.js (App Router), Tailwind + shadcn/ui, Recharts (LJ chart).

Backend: Node.js/Express (REST); xác thực JWT; rule-engine Westgard; xuất PDF.

Dữ liệu: Google Sheets (qua Service Account) làm kho chính; có thể thêm BigQuery/KV cache nếu cần.

Caching client: TanStack Query v5 với TTL theo loại dữ liệu, prefetch + SSR/hydration, persistence 24h. (v5 bỏ keepPreviousData cũ; dùng placeholderData/keepPreviousData helper; cấu hình gcTime ≥ maxAge khi bật persist). 
TanStack
+1

4) Luồng nghiệp vụ chính

Rollover lô mới → nhập thông tin QC lot; thu thập ≥20 điểm “in-control” → Establish mean/SD nội bộ → Lock giới hạn theo lô (không cập nhật hàng ngày). 
Westgard QC

Vận hành hằng ngày → nhập điểm (L1/L2/…); rule-engine tính z, đánh giá within-run & across-runs, ghi vi phạm (kèm mức/cặp).

Cảnh báo & xử trí → gợi ý nguyên nhân (random/ systematic), RCA, hành động khắc phục, chặn báo cáo bệnh nhân nếu “reject”.

Báo cáo → theo ngày/tháng/máy/xét nghiệm: số vi phạm theo từng rule; phân loại RE/SE; biểu đồ LJ + danh sách vi phạm.

5) Định nghĩa quy tắc Westgard áp dụng

1₍3s₎: 1 điểm vượt ±3SD → reject.

1₍2s₎: 1 điểm vượt ±2SD → warning (tùy chọn).

2₍2s₎ (across-runs): 2 điểm liên tiếp cùng mức, cùng phía, ≥2SD → reject.

2₍2s₎ (within-run): L1 & L2 cùng phía, ≥2SD trong cùng run → reject.

R₍4s₎ (within-run): L1 & L2 trái dấu, chênh tổng ≥4SD trong cùng run → reject (chỉ within-run).

4₍1s₎: 4 điểm liên tiếp cùng phía, >1SD → reject.

10x (hoặc 8x/12x): 10 (8/12) điểm liên tiếp cùng phía mean → reject. 
Westgard QC

Mở rộng cho N=3 (nếu bật): 2of3_2s, 3_1s, 6x/9x; 7T (trend 7 điểm) gắn nhãn extension (không thuộc bộ cổ điển).

Khuyến nghị theo Sigma: 6σ chỉ 1₍3s₎; 5σ thêm 2₍2s₎/R₍4s₎; 4σ thêm 4₍1s₎ (N=4 hoặc 2×2). 
Westgard QC

6) Rule-engine & phát hiện

Z-score: z = (value − mean_lab)/sd_lab (tham chiếu từ giới hạn đã lock theo lô).

Cửa sổ đếm:

Across-runs: theo chuỗi điểm cùng analyte/level/device/lot (10x/8x/12x; 4₍1s₎; 2₍2s₎ across).

Within-run: theo run_id (2₍2s₎ within; R₍4s₎ within-run). 
Westgard QC

CUSUM (tùy chọn): theo dõi lệch nhỏ kéo dài (S⁺/S⁻) với tham số K (≈0.5–1.0 SD) và ngưỡng H; sinh cảnh báo khi vượt ngưỡng. (Tham khảo Westgard/CUSUM cho QC).

Phân loại lỗi: Random vs. Systematic dựa vào loại rule vi phạm (ví dụ R₍4s₎ nhạy random error; 10x/4₍1s₎ gợi ý bias/shift). 
Westgard QC

7) API (REST) – giao diện giữa FE và BE

POST /api/qc/ingest → nhập điểm QC; trả z, status (in-control/warning/reject), violations[], level_badges (mức/cặp), trend{shift,trend}, cusum{pos,neg,crossed}.

POST /api/qc/limits/establish → tính mean/SD nội bộ (lọc điểm in-control, ≥20) → cập nhật qc_limits.

POST /api/qc/limits/lock → khóa giới hạn theo lô.

GET/PUT /api/qc/config → xem/sửa cấu hình per-analyte/level/device/lot (bật/tắt quy tắc).

PUT /api/qc/points/:id/rca → cập nhật root_cause/corrective_action/conclusion.

POST /api/reports/export → xuất PDF (LJ chart + bảng vi phạm + thống kê).

8) Chiến lược caching (TanStack Query v5)

Query-keys chuẩn:
['rule_settings'], ['westgard_config'], ['qc_limits', { analyte, level, instrument, lot }],
['qc_points', { analyte, level, instrument, lot, from, to }], ['qc_points.infinite', {...}], ['reports', { scope }].

TTL: rule_settings 12h; westgard_config 6h; qc_limits 24h; qc_points 30–60s (monitor, có thể refetchInterval 60s khi màn đang mở).

Prefetch + SSR/Hydration: prefetch westgard_config, qc_limits hiện hành, trang đầu qc_points.

Placeholder khi đổi filter: dùng placeholderData/keepPreviousData helper (v5 đã thay thế keepPreviousData). 
TanStack

Persistence: persistQueryClient (localStorage) với maxAge=24h; đặt gcTime ≥ 24h để cache không bị dọn sớm. 
TanStack
+1

9) Database schema (Google Sheets)

Mỗi sheet = một bảng; giữ nguyên các sheet bạn đang có, chỉ bổ sung cho đầy đủ. Kiểu dữ liệu ở đây là “mục đích sử dụng”; trên Sheets lưu dưới dạng text/number/boolean.

9.1. Master data

tests

test_id (Text, PK) — mã xét nghiệm

test_name (Text) — tên (Glucose, GGT, …)

unit (Text) — đơn vị (mg/dL, U/L, …)

is_active (Boolean)

devices

device_id (Text, PK), device_name (Text), serial_number (Text)

qc_lots (thông tin lô QC – tham khảo hãng & theo dõi HSD)

lot_id (Text, PK), test_id (FK→tests), level (L1/L2/L3), lot_number (Text), expiry_date (Date)

mean_mfg (Number, tùy chọn), sd_mfg (Number, tùy chọn)

9.2. Cấu hình & giới hạn

westgard_config (cấu hình rule per-analyte/level/device/lot)

Khóa định danh: analyte, level, instrument_id, (tùy chọn lot_id)

Tham số chính:

qc_levels_per_run (Number)

profile (strict/relaxed/custom)

Bật/tắt rule cổ điển: enable_1_3s_reject, enable_2_2s_within_run_reject, enable_2_2s_across_runs_reject, enable_R_4s_within_run_reject, enable_4_1s_reject, enable_10x_reject, enable_1_2s_warning

Bổ sung N=3 & extension: enable_2of3_2s_reject, enable_3_1s_reject, enable_6x_reject, enable_9x_reject, enable_7T_reject

CUSUM (tùy chọn): enable_cusum, cusum_K (0.5 mặc định), cusum_H (4.0), n_per_run (2/3/4)

qc_limits (giới hạn đã lock theo lô; dùng để tính z)

Khóa: analyte, level, instrument_id, lot_id

mean_lab, sd_lab, source_mean_sd (lab/mfg/peer), date_established, is_locked, lock_date

Dải giới hạn: limit_1s_lower/upper, limit_2s_lower/upper, limit_3s_lower/upper

Thiết lập từ ≥20 kết quả nội bộ (≥10 ngày) rồi khóa, không cập nhật theo ngày. 
Westgard QC

rule_settings (từ điển quy tắc để hiển thị/seed)

rule_code (Text, PK: 1_3s, 2_2s_across, 2_2s_within, R_4s, 4_1s, 10x, 2of3_2s, 3_1s, 6x, 9x, 7T …)

rule_name (Text), description (Text), is_active (Boolean), is_extension (Boolean), default_enabled (Boolean), severity (warning/reject), category (westgard/extension)

9.3. Vận hành & sự kiện

qc_points (điểm QC để vẽ LJ & check rules)

timestamp (DateTime), run_id (Text), shift (Text), analyte (Text), level (L1/L2/L3), instrument_id (Text), lot_id (Text)

value (Number), z (Number), status (in-control/warning/reject)

violations_json (Text, mảng rule vi phạm)

Hiển thị theo mức/cặp: violations_matrix_json (JSON: {L1:[…], L2:[…], pairs:{'1-2':[...]} })

Xu hướng bổ trợ: shift_flag (Boolean), trend_flag (Boolean), cusum_pos (Number), cusum_neg (Number)

RCA: root_cause (Text), corrective_action (Text), conclusion (Text)

operator (Text), comment (Text)

violations (sự kiện vi phạm “kết dính” nhiều điểm)

violation_id (Text, PK), rule_code (Text), analyte, level, instrument_id, lot_id

detection_date (DateTime), involved_result_ids (Text, CSV id điểm), status (new/resolved)

corrective_action, action_user_id, resolved_at

users, audit_logs

users: user_id, username, password_hash, full_name, role, created_at

audit_logs: thời điểm, người thực hiện, hành động (create/update/delete), bảng/khóa, trước/sau (để truy vết)

10) Màn hình & UX chính

QC Monitor: chọn analyte/level/device/lot + khoảng ngày; overlay 1/2/3 mức; hiển thị badge vi phạm theo mức/cặp (1/2/3 và 1-2/2-3/1-3).

Cấu hình rule: preset strict/relaxed; toggle từng rule (cổ điển + N=3 + 7T); CUSUM.

Lot limits: thiết lập/lock; hiển thị mean/SD/nguồn; nút “Establish (≥20)”.

Nhập & RCA: bảng điểm trong ngày; cờ SHIFT/TREND/CUSUM; nguyên nhân/hành động/kết luận; chốt “Accept/Reject run”.

Báo cáo: PDF theo ngày/tháng/máy/xét nghiệm; thống kê rule (1₍3s₎/2₍2s₎/R₍4s₎/4₍1s₎/10x/2of3_2s/3_1s/6x/9x/7T), phân loại random vs systematic.

11) Triển khai & vận hành

Migration an toàn: chỉ thêm cột vào westgard_config, qc_points; tạo rule_settings nếu chưa có; seed 2of3_2s, 3_1s, 6x, 9x, 7T (extension=TRUE).

Kiểm thử chấp nhận:

R₍4s₎ within-run: L1=−2SD & L2=+2SD (cùng run) → reject; across-runs không xét. 
Westgard QC

2₍2s₎ across: 2 lần liên tiếp cùng mức, cùng phía ≥2SD → reject. 
Westgard QC

4₍1s₎: 4 điểm liên tiếp >1SD cùng phía → reject; 10x tương tự 10 điểm cùng phía. 
Westgard QC

1₍2s₎: chỉ warning khi bật. 
Westgard QC

Thiết lập giới hạn: xác nhận yêu cầu ≥20 kết quả/≥10 ngày trước khi lock. 
Westgard QC

Hiệu năng FE: dùng chiến lược caching mục (8) – placeholderData khi đổi filter, persist 24h, invalidate theo key sau mutation. 
TanStack
+1

Tài liệu tham khảo chính

Westgard QC – “Westgard Rules” (định nghĩa 1₍3s₎, 2₍2s₎, R₍4s₎ chỉ within-run, 4₍1s₎, 10x; biến thể 8x/12x; vai trò 1₍2s₎ là warning). 
Westgard QC

Levey–Jennings & thiết lập giới hạn: cần ≥20 phép đo nội bộ qua ≥10 ngày để tính mean/SD trước khi lập biểu đồ/áp quy tắc. 
Westgard QC

Sigma Rules: chọn bộ quy tắc theo năng lực phương pháp (4σ/5σ/6σ). 
Westgard QC

CLSI C24 Ed.4: nguyên tắc lập kế hoạch QC, thiết lập mục tiêu/SD, tần suất QC, phục hồi sau out-of-control. 
CLSI
+1

TanStack Query v5: migration (placeholderData thay keepPreviousData), persistQueryClient và yêu cầu gcTime ≥ maxAge. 
TanStack
+1