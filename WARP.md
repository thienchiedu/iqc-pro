# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

C-Lab IQC Pro is a comprehensive Statistical Quality Control System for medical laboratories, implementing Westgard Rules and Levey-Jennings charts for detecting out-of-control conditions. The system manages QC data, applies statistical analysis, and tracks violations using Google Sheets as the backend database.

## Development Commands

### Development Server
\`\`\`bash
npm run dev         # Start development server on http://localhost:3000
\`\`\`

### Build & Production
\`\`\`bash
npm run build       # Build production bundle
npm run start       # Start production server
npm run lint        # Run ESLint (currently ignored during builds)
\`\`\`

### Package Management
The project uses npm with a `pnpm-lock.yaml`, indicating pnpm may be preferred:
\`\`\`bash
npm install --legacy-peer-deps  # Install with legacy peer deps (required for React 19 compatibility)
pnpm install        # Install dependencies
pnpm dev           # Start development
\`\`\`

**Note**: Use `--legacy-peer-deps` flag with npm due to React 19 compatibility issues with some dependencies (particularly vaul@0.9.9).

**Required Dependencies**: 
- `react-is` is required to fix build issues with Recharts when using React 19

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **UI Framework**: shadcn/ui components + Tailwind CSS v4
- **Database**: Google Sheets API (unique architecture choice)
- **Authentication**: Custom JWT with httpOnly cookies
- **Charts**: Recharts for Levey-Jennings statistical charts
- **Type Safety**: Full TypeScript implementation

### Directory Structure
\`\`\`
app/                     # Next.js App Router pages & API routes
├── api/                 # Backend API endpoints
│   ├── auth/           # Authentication (login, verify)
│   ├── qc/             # QC data management
│   ├── config/         # System configuration
│   └── violations/     # Violation tracking
├── qc-entry/           # QC data entry interface
├── qc-monitor/         # Levey-Jennings monitoring
├── lot-setup/          # QC lot management
├── violations/         # Violation management
└── westgard-rules/     # Rules testing interface

components/             # React components
├── auth/              # Authentication components
├── charts/            # Statistical chart components
├── config/            # Configuration forms
├── layout/            # Layout & navigation
├── qc/                # QC-specific components
├── ui/                # shadcn/ui base components
└── violations/        # Violation management UI

lib/                   # Core business logic
├── auth.ts            # Authentication utilities
├── google-sheets.ts   # Google Sheets service layer
├── westgard-rules.ts  # Statistical QC rules engine
└── statistical-engine.ts # Statistical calculations

contexts/              # React Context providers
└── auth-context.tsx   # Authentication state management
\`\`\`

## Core Domain Logic

### Westgard Rules Engine (`lib/westgard-rules.ts`)
This is the heart of the QC system, implementing 7 statistical control rules:
- **1₃s**: Single point beyond ±3SD (rejection)
- **2₂s**: Two consecutive points beyond ±2SD same side
- **R₄s**: Range between two points ≥4SD
- **4₁s**: Four consecutive points beyond ±1SD same side  
- **10x**: Ten consecutive points same side of mean
- **1₂s**: Warning rule for points ≥±2SD

Each rule has configurable enable/disable flags and calculates false rejection rates.

### Google Sheets Integration (`lib/google-sheets.ts`)
Unique architecture using Google Sheets as primary database with dedicated sheets:
- **qc_points**: All QC measurement data
- **qc_limits**: Control limits for each analyte/level/instrument/lot combination
- **violations**: Westgard rule violations
- **westgard_config**: Rule configuration per analyte
- **users**: Authentication data

### Statistical Calculations
- Z-score normalization: `(value - mean) / sd`
- Control limits: Mean ±1SD, ±2SD, ±3SD
- Violation detection through rule evaluation
- Trend analysis for process monitoring

## Key Development Patterns

### Authentication Flow
The system uses a custom JWT authentication with mock user bypass currently enabled in `contexts/auth-context.tsx`. Production implementation expects:
1. Login with username/password
2. JWT token stored in httpOnly cookies
3. Role-based access (technician/manager)
4. Protected routes with middleware

### QC Data Flow
1. **Data Entry**: User enters QC value via form validation
2. **Statistical Analysis**: Calculate Z-scores against established limits  
3. **Rule Evaluation**: Apply enabled Westgard rules to detect violations
4. **Violation Handling**: Create violation records and notifications
5. **Chart Visualization**: Display on Levey-Jennings charts with highlighting

### Component Architecture
- Uses shadcn/ui "new-york" style with Lucide icons
- Path aliases: `@/components`, `@/lib`, `@/hooks`
- Protected routes wrap pages requiring authentication
- Context providers for global state (auth, potentially QC data)

## Configuration Requirements

### Environment Variables
\`\`\`env
# Google Sheets Integration
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=path/to/service-account-key.json
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id

# Authentication  
JWT_SECRET=your-super-secret-jwt-key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
\`\`\`

### Google Cloud Setup Required
1. Create Google Cloud Project with Sheets API enabled
2. Create Service Account with JSON key file
3. Create Google Spreadsheet with proper sheet structure
4. Share spreadsheet with service account email

## Development Notes

### Current Development State
- Authentication is mocked (see `contexts/auth-context.tsx`)
- TypeScript errors and ESLint ignored during builds
- Images are unoptimized in Next.js config
- Uses Geist font (Sans & Mono variants)

### Key Business Logic Files
- `lib/westgard-rules.ts` - Core QC rules engine
- `lib/google-sheets.ts` - Database service layer  
- `lib/statistical-engine.ts` - Statistical calculations
- `components/charts/levey-jennings-chart.tsx` - Main visualization

### Testing Strategy
The system requires accuracy in statistical calculations and rule implementations. Focus testing on:
- Westgard rules correctness with known datasets
- Statistical calculations (mean, SD, Z-scores)
- Google Sheets API integration
- QC workflow end-to-end scenarios

## Unique Aspects

This system is specialized for medical laboratory quality control with domain-specific requirements:
- Implements internationally recognized Westgard statistical control rules
- Uses Google Sheets as database for easier lab technician access
- Focuses on Levey-Jennings control charting
- Requires high accuracy in statistical calculations for regulatory compliance
- Multi-level QC (Level 1, Level 2, etc.) with instrument-specific control limits

The codebase reflects deep domain knowledge of clinical laboratory quality systems and statistical process control.
