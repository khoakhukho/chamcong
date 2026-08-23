# HƯỚNG DẪN TRIỂN KHAI WEBAPP CHẤM CÔNG TRÊN SYNOLOGY NAS
**(Sử dụng Container Manager + Synology DDNS Miễn Phí + HTTPS)**

---

## 1. Chuẩn Bị Thư Mục Trên Synology NAS (File Station)

1. Mở **File Station** trên giao diện DSM của Synology NAS.
2. Truy cập vào thư mục chia sẻ `docker` (thường là `/volume1/docker`).
3. Tạo cây thư mục như sau:
   ```
   /docker
     └── /chamcong
           ├── /data          <-- Nơi lưu trữ file CSDL SQLite chamcong.db
           └── /uploads       <-- Nơi lưu trữ toàn bộ ảnh chấm công .webp
   ```
4. **Phân quyền:** Nhấp chuột phải vào thư mục `chamcong` $\rightarrow$ **Properties** $\rightarrow$ **Permission** $\rightarrow$ Cấp quyền **Read & Write** cho nhóm `Everyone` hoặc user `docker`.

---

## 2. Triển Khai Bằng Synology Container Manager (Docker)

### Cách 1: Sử dụng tính năng "Project" (Khuyên dùng)
1. Mở ứng dụng **Container Manager** trên Synology NAS.
2. Chọn mục **Project** $\rightarrow$ bấm **Create**.
3. Điền thông tin:
   * **Project Name:** `chamcong-caritas`
   * **Path:** Chọn thư mục `/volume1/docker/chamcong`
   * **Source:** Chọn *Create docker-compose.yml* và dán nội dung từ file [`docker-compose.yml`](file:///c:/Users/TRUYENTHONGCARITAS/Desktop/SOFT/DỰ ÁN CARITAS DALAT/PROJECT/CHAMCONG/docker-compose.yml) của dự án.
4. Bấm **Next** $\rightarrow$ **Done** để Synology tự động tải image/build và khởi chạy container.

---

## 3. Cấu Hình Tên Miền Miễn Phí Synology DDNS & Chứng Chỉ SSL (HTTPS)

> ⚠️ **LƯU Ý QUAN TRỌNG:** Trình duyệt trên điện thoại (iOS Safari, Android Chrome) **bắt buộc phải có kết nối HTTPS** mới cho phép mở Camera và lấy tọa độ GPS.

### Bước 3.1: Đăng ký tên miền DDNS miễn phí của Synology
1. Trên Synology DSM, vào **Control Panel** $\rightarrow$ **External Access** $\rightarrow$ tab **DDNS**.
2. Bấm **Add**:
   * **Service Provider:** Chọn `Synology`
   * **Hostname:** Đặt tên tùy chọn (Ví dụ: `chamcong-caritas.synology.me`)
   * Tích chọn: *Get a certificate from Let's Encrypt and set it as default* (Tự động cấp SSL miễn phí).
3. Bấm **OK**.

### Bước 3.2: Cấu hình Synology Reverse Proxy (Định tuyến HTTPS)
1. Vào **Control Panel** $\rightarrow$ **Login Portal** $\rightarrow$ tab **Advanced** $\rightarrow$ **Reverse Proxy**.
2. Bấm **Create**:
   * **Reverse Proxy Name:** `Cham Cong Caritas`
   * **Source (Nguồn truy cập từ ngoài):**
     * Protocol: `HTTPS`
     * Hostname: `chamcong-caritas.synology.me` (hoặc tên miền DDNS bạn vừa tạo)
     * Port: `443`
     * Tích chọn: *Enable HSTS*
   * **Destination (Đích đến Container Docker):**
     * Protocol: `HTTP`
     * Hostname: `localhost` (hoặc `127.0.0.1`)
     * Port: `3000`
3. Sang tab **Custom Header** $\rightarrow$ bấm **Create** $\rightarrow$ chọn **WebSocket** (để giữ kết nối realtime).
4. Bấm **Save**.

---

## 4. Kiểm Thử & Đăng Nhập Hệ Thống

1. Mở trình duyệt trên điện thoại hoặc máy tính, truy cập:
   `https://chamcong-caritas.synology.me` (hoặc tên miền DDNS của bạn).
2. Trình duyệt sẽ hiển thị biểu tượng ổ khóa bảo mật **HTTPS** an toàn.
3. Đăng nhập bằng tài khoản mẫu:
   * 👑 **Tài khoản Quản trị (Admin):**
     * Mã NV: `ADMIN`
     * Mật khẩu: `admin123`
   * 👤 **Tài khoản Nhân viên (Test Chấm Công):**
     * Mã NV: `NV001`
     * Mật khẩu: `123456`
4. Cấp quyền Camera & Vị trí khi được trình duyệt hỏi $\rightarrow$ Chụp ảnh chấm công $\rightarrow$ Hệ thống tự động đóng dấu Watermark và kiểm tra khoảng cách GPS.
5. Đăng nhập tài khoản `ADMIN` để xem nhật ký chấm công realtime và tải Báo cáo Excel 31 ngày.
