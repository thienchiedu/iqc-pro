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
