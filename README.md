# The Moods HRM

Hệ thống Quản lý Nhân sự, Chấm công & Phân ca làm việc (Human Resource Management).

---

## 🛠 Yêu Cầu Môi Trường (Prerequisites)

Trước khi bắt đầu, đảm bảo máy của bạn đã cài đặt các công cụ sau:

- **Node.js**: Phiên bản `>= 18.x` hoặc `20.x LTS` ([Tải Node.js](https://nodejs.org/))
- **.NET SDK**: Phiên bản `.NET 8.0 SDK` ([Tải .NET 8.0](https://dotnet.microsoft.com/download/dotnet/8.0))
- **PostgreSQL**: Phiên bản `>= 14` đang hoạt động (cổng mặc định `5432`)

---

## 🚀 Hướng Dẫn Chạy Local

Dự án gồm 2 phần độc lập: **Backend (.NET 8 Web API)** và **Frontend (Next.js 16)**. Để hệ thống hoạt động đầy đủ tính năng, bạn cần khởi chạy cả Backend và Frontend.

---

### Bước 1: Khởi Chạy Backend (.NET 8 API)

1. **Cấu hình Cơ sở dữ liệu (PostgreSQL):**
   - Mở PostgreSQL và tạo Database (mặc định tên là `themoods_tie`).
   - Kiểm tra chuỗi kết nối trong `backend/TheMoods.Api/Program.cs` hoặc cấu hình chuỗi kết nối trong `backend/TheMoods.Api/appsettings.Development.json`:
     ```json
     {
       "ConnectionStrings": {
         "DefaultConnection": "Host=localhost;Port=5432;Database=themoods_tie;Username=postgres;Password=your_password"
       }
     }
     ```
   > 💡 **Lưu ý:** Khi Backend khởi động, hệ thống sẽ tự động thực thi Migration (`Database.Migrate()`) và nạp dữ liệu mẫu (`DbInitializer`) nếu Database còn trống.

2. **Chạy Backend:**
   Mở terminal và di chuyển vào thư mục backend:
   ```bash
   cd backend/TheMoods.Api
   dotnet restore
   dotnet run
   ```

3. **Kiểm tra Backend:**
   - API Base URL: `http://localhost:5078`
   - Tài liệu Swagger UI: [http://localhost:5078/swagger](http://localhost:5078/swagger)

---

### Bước 2: Khởi Chạy Frontend (Next.js)

1. **Mở một cửa sổ Terminal mới** tại thư mục gốc của dự án (`tm`).

2. **Cài đặt dependencies:**
   ```bash
   npm install
   ```

3. **Khởi chạy Development Server:**
   ```bash
   npm run dev
   ```

4. **Truy cập ứng dụng:**
   - Mở trình duyệt và truy cập: [http://localhost:3000](http://localhost:3000)

---

## 👥 Tài Khoản Dữ Liệu Mẫu (Test Accounts)

Sau khi backend khởi động lần đầu, hệ thống đã nạp sẵn các tài khoản demo:

| Vai trò | Số điện thoại | Mã PIN / Mật khẩu | Chi nhánh |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `0900000001` | *Không yêu cầu PIN* | Toàn hệ thống |
| **Quản lý (Admin)** | `0900000002` | *Không yêu cầu PIN* | The Moods Gò Vấp |
| **Nhân viên (Staff)** | `0900000003` | `123456` | The Moods Gò Vấp |

---

## 📁 Cấu Trúc Dự Án

```text
├── backend/                  # Mã nguồn Backend (.NET 8 Web API)
│   ├── TheMoods.Api/         # Controllers, Middleware, cấu hình API
│   │   ├── Controllers/      # Các API endpoints (Auth, Attendance, Shifts,...)
│   │   └── Program.cs        # Khởi tạo DI, Swagger, CORS, Db Migration
│   └── TheMoods.Data/        # Entity Framework Core DbContext, Models, Migrations
├── src/                      # Mã nguồn Frontend (Next.js App Router)
│   ├── app/                  # Các trang (Admin, Staff, Super Admin, Kiosk,...)
│   ├── components/           # UI Components dùng chung
│   └── context/              # Quản lý State toàn cục (AppContext)
├── redeploy.sh               # Script tự động build & deploy trên server (PM2)
└── README.md                 # Tài liệu hướng dẫn dự án
```

---

## 🛠 Các Lệnh Hữu Ích

- **Chạy Lint kiểm tra lỗi code FE:**
  ```bash
  npm run lint
  ```
- **Build production Frontend:**
  ```bash
  npm run build
  ```
- **Build production Backend:**
  ```bash
  cd backend
  dotnet publish -c Release -o ./publish
  ```
