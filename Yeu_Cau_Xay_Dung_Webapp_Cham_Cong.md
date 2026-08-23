# TÀI LIỆU ĐẶC TẢ YÊU CẦU XÂY DỰNG WEBAPP CHẤM CÔNG NỘI BỘ
**(Tích hợp Watermark, Định vị GPS, Báo cáo Excel & Telegram Mini App)**

---

## 1. TỔNG QUAN DỰ ÁN
* **Mục tiêu:** Xây dựng hệ thống webapp chấm công trực quan qua ảnh chụp trực tiếp có đóng dấu thông tin (Time-marker/Watermark), kiểm soát vị trí thực tế (GPS), tự động hoá tính công và xuất báo cáo Excel chuẩn quy định quản lý nhân sự.
* **Quy mô:** ~50 nhân sự (kiến trúc sẵn sàng mở rộng 100+ nhân sự).
* **Môi trường triển khai:** Host trực tiếp trên **NAS Synology** (chạy bằng Docker Compose), truy cập qua kết nối bảo mật **HTTPS** hoặc tích hợp subdomain / domain thuộc hệ thống **caritasdalat.org**.
* **Định hướng nền tảng:** Xây dựng Webapp chuẩn Responsive / PWA trước, sau đó nhúng trực tiếp thành **Telegram Mini App** kèm Bot tự động nhắc nhở.

---

## 2. YÊU CẦU CHỨC NĂNG CHI TIẾT

### 2.1. Phân hệ Nhân viên (Mobile Web / Telegram Mini App)
1. **Xác thực người dùng:**
   * Hỗ trợ đăng nhập qua Mã nhân viên / Mật khẩu.
   * Tự động nhận diện và đăng nhập qua `telegram_id` khi mở từ Telegram Bot.
2. **Camera Check-in / Check-out trực tiếp:**
   * Bắt buộc mở trực tiếp Camera trên thiết bị (`HTML5 MediaDevices API` / `capture="user"`).
   * **Chống gian lận:** Khóa hoàn toàn chức năng tải/chọn ảnh từ thư viện ảnh máy.
3. **Đóng dấu thông tin lên ảnh (Time-marker & Location Watermark):**
   * Tự động vẽ đè thông tin cố định lên góc ảnh trước khi lưu:
     * Họ tên & Mã số nhân viên.
     * Thời gian thực tế (Server Time GMT+7, chống chỉnh giờ trên điện thoại).
     * Tọa độ GPS (`Lat`, `Lng`) và Địa chỉ thực tế (Reverse Geocoding).
4. **Kiểm soát vị trí (Geofencing):**
   * Lấy tọa độ GPS thiết bị tại thời điểm bấm chụp.
   * Tính khoảng cách với tọa độ văn phòng/công trường (Bán kính cho phép ví dụ: $\le 100\text{m}$).
   * Gắn cờ cảnh báo nếu toạ độ nằm ngoài bán kính cho phép.
5. **Lịch sử cá nhân & Đơn từ:**
   * Xem lại nhật ký chấm công trong tháng kèm ảnh đã đóng dấu.
   * Gửi đơn giải trình quên chấm công, đơn xin nghỉ phép (Phép năm, Ốm đau, Việc riêng).

### 2.2. Phân hệ Quản trị & HR (Admin Dashboard)
1. **Quản lý danh mục & Nhân sự:**
   * Quản lý hồ sơ nhân viên: Mã NV, Họ tên, Phòng ban/Bộ phận, Số điện thoại, Telegram ID, Trạng thái hoạt động.
   * Quản lý ca làm việc: Giờ vào chuẩn, giờ ra chuẩn, khoảng thời gian cho phép đi muộn/về sớm, cấu hình làm thêm giờ (OT).
   * Quản lý địa điểm: Tọa độ gốc văn phòng/chi nhánh và bán kính hợp lệ (mét).
2. **Giám sát thời gian thực & Duyệt đơn:**
   * Bảng theo dõi trực quan trạng thái ngày hôm nay: Ai đã check-in, ai chưa vào ca, ai đi trễ, ai xin nghỉ.
   * Duyệt/Từ chối các đơn xin nghỉ phép, đơn điều chỉnh công.
   * Xem trực tiếp và tra cứu kho ảnh chấm công có watermark.

### 2.3. Phân hệ Xuất Báo Cáo Excel (Chuẩn hóa)
* **Bảng chấm công tổng hợp tháng:**
   * Kẻ bảng chuẩn format hành chính.
   * Hiển thị đầy đủ 31 ngày trong tháng với hệ thống ký hiệu chuẩn:
     * `X`: Làm đủ ngày công
     * `1/2`: Làm nửa ngày công
     * `P`: Nghỉ phép năm có lương
     * `Ô`: Nghỉ ốm hưởng BHXH
     * `Ro`: Nghỉ việc riêng không lương
     * `KP`: Nghỉ không phép
   * Cột tổng kết tự động tính bằng công thức Excel: Tổng công chuẩn, Tổng công thực tế, Tổng giờ làm thêm (OT 150%, 200%), Số lần & số phút đi muộn.
* **Bảng nhật ký chi tiết giờ vào / ra:**
   * Xuất toàn bộ log quẹt thẻ theo ngày để đối soát minh bạch khi cần.

---

## 3. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

```sql
-- 1. Bảng Nhân sự
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    telegram_id BIGINT UNIQUE,
    department VARCHAR(50),
    role VARCHAR(20) DEFAULT 'employee', -- 'admin', 'manager', 'employee'
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Ca làm việc
CREATE TABLE shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL,        -- '08:00:00'
    end_time TIME NOT NULL,          -- '17:30:00'
    allowed_late_minutes INT DEFAULT 15,
    is_active BOOLEAN DEFAULT 1
);

-- 3. Bảng Địa điểm chấm công
CREATE TABLE locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    radius_meters INT DEFAULT 100
);

-- 4. Bảng Nhật ký chấm công
CREATE TABLE attendances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    shift_id INTEGER REFERENCES shifts(id),
    check_type VARCHAR(10) NOT NULL, -- 'IN' hoặc 'OUT'
    server_time DATETIME NOT NULL,
    latitude REAL,
    longitude REAL,
    location_address TEXT,
    is_valid_location BOOLEAN DEFAULT 1,
    image_path TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bảng Đơn từ / Nghỉ phép
CREATE TABLE leave_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    leave_type VARCHAR(20) NOT NULL, -- 'ANNUAL', 'SICK', 'UNPAID', 'LATE_EXCUSE'
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    approved_by INTEGER REFERENCES users(id),
    updated_at DATETIME
);
```

---

## 4. KIẾN TRÚC KỸ THUẬT & TRIỂN KHAI TRÊN NAS SYNOLOGY

### 4.1. Công nghệ đề xuất
* **Frontend:** Next.js / React (Mobile-first UI, HTML5 Canvas Watermark, Geolocation API).
* **Backend:** Node.js (Express/FastAPI/Next.js API) + Thư viện `exceljs` / `sharp`.
* **Database:** SQLite (lưu file cục bộ với Prisma ORM, cực nhẹ và tối ưu cho NAS) hoặc PostgreSQL.
* **Xử lý ảnh:** Nén ảnh định dạng `.webp` (kích thước chuẩn 800x600 px) trước khi lưu vào thư mục NAS để tiết kiệm bộ nhớ.

---

## 5. LỘ TRÌNH TRIỂN KHAI 3 BƯỚC

* **Bước 1: Xây dựng Webapp Độc lập (Core App)**
  * Dựng Backend API / Next.js Server Actions & API Routes, SQLite Database với Prisma.
  * Dựng Frontend giao diện Camera bắt buộc, đóng watermark canvas và định vị GPS.
  * Viết module trích xuất báo cáo Excel tổng hợp theo tháng.
* **Bước 2: Triển khai lên Synology NAS**
  * Đóng gói Docker Compose, chạy trên Container Manager của NAS.
  * Cấu hình Synology Reverse Proxy / Cloudflare Tunnel cấp chứng chỉ SSL (HTTPS) cho domain caritasdalat.org / chamcong.caritasdalat.org.
* **Bước 3: Tích hợp Telegram Bot & Mini App**
  * Nhúng Telegram WebApp SDK vào Frontend.
  * Khởi tạo Bot qua `@BotFather`, cấu hình nút Menu mở Mini App.
  * Viết kịch bản Task Scheduler/Cronjob tự động gửi tin nhắn nhắc nhở vào ca mỗi sáng.
