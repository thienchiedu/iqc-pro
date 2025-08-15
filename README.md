# C-Lab IQC Pro

Hệ thống Kiểm soát Chất lượng Thống kê dựa trên Quy tắc Westgard cho Phòng thí nghiệm

## Tổng quan

C-Lab IQC Pro là một ứng dụng web toàn diện được thiết kế để quản lý kiểm soát chất lượng trong phòng thí nghiệm y tế. Hệ thống triển khai các quy tắc Westgard và biểu đồ Levey-Jennings để phát hiện các điều kiện ngoài kiểm soát trong quá trình phân tích.

## Tính năng chính

### 🔐 Hệ thống Xác thực & Phân quyền
- Đăng nhập/đăng xuất an toàn với JWT tokens
- Phân quyền theo vai trò: Technician và Manager
- Protected routes với middleware authentication

### 📊 Quản lý Dữ liệu QC
- Nhập dữ liệu QC với validation đầy đủ
- Thiết lập lô QC mới với theo dõi tiến độ
- Tính toán thống kê tự động (Mean, SD, CV, Z-scores)
- Thiết lập và khóa control limits

### 🎯 Westgard Rules Engine
- Triển khai đầy đủ 8 quy tắc Westgard cơ bản
- Rule tester với khả năng mô phỏng
- Giải thích chi tiết từng quy tắc
- Tính toán false rejection rates

### 📈 Biểu đồ Levey-Jennings
- Biểu đồ tương tác với control limits (±1SD, ±2SD, ±3SD)
- Highlight violations và warning conditions
- Filter theo analyte, level, instrument, lot
- Export dữ liệu CSV

### ⚙️ Quản lý Cấu hình
- Quản lý analytes với reference ranges
- Cấu hình instruments và maintenance schedules
- System settings (timezone, notifications, defaults)
- Import/Export configuration

### 🚨 Theo dõi Vi phạm & Corrective Actions
- Tracking violations theo thời gian thực
- Quản lý corrective actions với assignment
- Violation reports và analytics
- Trending analysis và statistics

## Công nghệ sử dụng

- **Frontend**: Next.js 14 với App Router
- **UI Framework**: shadcn/ui + Tailwind CSS
- **Charts**: Recharts
- **Authentication**: JWT với secure cookies
- **Database**: Google Sheets API
- **TypeScript**: Full type safety
- **Icons**: Lucide React

## Cài đặt

### Yêu cầu hệ thống
- Node.js 18+ 
- npm hoặc yarn
- Google Cloud Project với Sheets API enabled

### Bước 1: Clone repository
\`\`\`bash
git clone <repository-url>
cd c-lab-iqc-pro
npm install
\`\`\`

### Bước 2: Cấu hình Environment Variables
Tạo file `.env.local` với các biến sau:

\`\`\`env
# Google Sheets Integration
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=path/to/service-account-key.json
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
\`\`\`

### Bước 3: Thiết lập Google Sheets
1. Tạo Google Cloud Project
2. Enable Google Sheets API
3. Tạo Service Account và download key file
4. Tạo Google Spreadsheet và share với service account email
5. Copy Spreadsheet ID vào environment variable

### Bước 4: Khởi chạy ứng dụng
\`\`\`bash
npm run dev
\`\`\`

Truy cập `http://localhost:3000` để sử dụng ứng dụng.

## Cấu trúc Database (Google Sheets)

Hệ thống sử dụng Google Sheets làm database với các sheets sau:

### 1. QC_Points
- `id`, `analyte`, `level`, `instrument`, `lot`, `value`, `timestamp`, `user`, `violations`

### 2. QC_Limits  
- `id`, `analyte`, `level`, `instrument`, `lot`, `mean`, `sd`, `n`, `locked`, `created_date`

### 3. Users
- `id`, `username`, `password_hash`, `role`, `full_name`, `email`, `created_date`, `last_login`

### 4. Analytes
- `id`, `name`, `unit`, `category`, `reference_range_low`, `reference_range_high`

### 5. Instruments
- `id`, `name`, `model`, `serial_number`, `location`, `maintenance_date`

### 6. Violations
- `id`, `qc_point_id`, `rule_violated`, `severity`, `status`, `created_date`, `resolved_date`

### 7. Corrective_Actions
- `id`, `violation_id`, `action_taken`, `assigned_to`, `status`, `created_date`, `completed_date`

## Sử dụng

### Đăng nhập
1. Truy cập trang chủ
2. Đăng nhập với tài khoản được cấp
3. Hệ thống sẽ redirect đến dashboard

### Nhập dữ liệu QC
1. Vào **QC Entry** từ menu
2. Chọn analyte, level, instrument, lot
3. Nhập giá trị QC
4. Hệ thống tự động kiểm tra Westgard rules

### Thiết lập lô mới
1. Vào **Lot Setup** từ menu  
2. Tạo lô mới với thông tin cơ bản
3. Thu thập ít nhất 20 điểm dữ liệu
4. Thiết lập control limits và khóa lô

### Theo dõi QC
1. Vào **QC Monitor** để xem biểu đồ Levey-Jennings
2. Filter theo các tiêu chí mong muốn
3. Phân tích trends và violations

### Quản lý vi phạm
1. Vào **Violations** để xem danh sách vi phạm
2. Thêm corrective actions cho từng vi phạm
3. Theo dõi resolution status

## API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký (chỉ manager)
- `GET /api/auth/verify` - Verify JWT token

### QC Management
- `POST /api/qc/ingest` - Nhập dữ liệu QC
- `GET /api/qc/points` - Lấy danh sách QC points
- `POST /api/qc/limits/establish` - Thiết lập control limits
- `POST /api/qc/limits/lock` - Khóa control limits

### Configuration
- `GET/POST /api/config/analytes` - Quản lý analytes
- `GET/POST /api/config/instruments` - Quản lý instruments
- `GET/POST /api/config/system` - System settings

### Violations
- `GET/POST /api/violations` - Quản lý violations
- `GET/POST /api/violations/corrective-actions` - Corrective actions

## Deployment

### Vercel (Recommended)
1. Push code lên GitHub
2. Connect repository với Vercel
3. Cấu hình environment variables
4. Deploy tự động

### Docker
\`\`\`bash
docker build -t c-lab-iqc-pro .
docker run -p 3000:3000 c-lab-iqc-pro
\`\`\`

## Bảo mật

- JWT tokens với secure httpOnly cookies
- Password hashing với bcrypt
- Input validation và sanitization
- Protected API routes với middleware
- Role-based access control

## Hỗ trợ

Để được hỗ trợ kỹ thuật:
1. Kiểm tra logs trong browser console
2. Verify environment variables
3. Kiểm tra Google Sheets permissions
4. Contact system administrator

## License

Proprietary - All rights reserved

## Changelog

### v1.0.0 (2024)
- Initial release với đầy đủ tính năng QC
- Westgard Rules Engine
- Levey-Jennings Charts
- Google Sheets integration
- Authentication system
- Violation tracking
