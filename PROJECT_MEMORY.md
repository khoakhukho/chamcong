# Project Memory: CHAMCONG (Caritas Dalat Attendance Webapp)

## 📋 Tổng quan Dự án
Hệ thống Webapp chấm công nội bộ cho Caritas Đà Lạt với các tính năng trọng tâm:
1. **Camera Chấm công bắt buộc**: Khóa tải ảnh từ thư viện, chụp ảnh trực tiếp qua MediaDevices API.
2. **Đóng dấu thông tin (Watermark & Time-marker)**: Đóng dấu Họ tên, Mã NV, Giờ chuẩn Server (GMT+7), Tọa độ GPS và Địa chỉ thực tế lên ảnh trước khi lưu.
3. **Kiểm soát vị trí (Geofencing)**: Tính khoảng cách với địa điểm văn phòng/chi nhánh (bán kính $\le 100\text{m}$) và cảnh báo vi phạm.
4. **Quản trị & Giám sát HR**: Theo dõi trạng thái check-in realtime, duyệt đơn nghỉ phép/giải trình, quản lý ca làm việc.
5. **Xuất báo cáo Excel**: Xuất bảng chấm công tổng hợp 31 ngày chuẩn ký hiệu hành chính (`X`, `1/2`, `P`, `Ô`, `Ro`, `KP`) kèm công thức tự động và log quẹt thẻ.
6. **Môi trường vận hành**: Chạy Docker Compose trên NAS Synology, HTTPS, tích hợp hệ thống `caritasdalat.org` và Telegram Mini App / Bot nhắc việc.

## 🛠️ Công nghệ Đề xuất (Tech Stack)
- **Framework**: Next.js 15 (App Router), React 19, TypeScript.
- **Styling**: Tailwind CSS v4, Lucide Icons.
- **Database & ORM**: Prisma ORM + SQLite (hoặc PostgreSQL), lưu trữ file DB trực tiếp trên Synology NAS.
- **Xử lý đồ họa & Báo cáo**: HTML5 Canvas (Client-side Watermark), Sharp (Server-side WebP Compression), `exceljs` (Excel generation).
- **Hạ tầng & Triển khai**: Docker, Docker Compose, Synology Container Manager, Cloudflare Tunnel / Reverse Proxy HTTPS.
- **Tích hợp Mobile**: PWA (Progressive Web App) + Telegram Mini App WebApp SDK.

## 📂 Tài liệu Yêu cầu
- File đặc tả: [`Yeu_Cau_Xay_Dung_Webapp_Cham_Cong.md`](file:///c:/Users/TRUYENTHONGCARITAS/Desktop/SOFT/DỰ ÁN CARITAS DALAT/PROJECT/CHAMCONG/Yeu_Cau_Xay_Dung_Webapp_Cham_Cong.md)
