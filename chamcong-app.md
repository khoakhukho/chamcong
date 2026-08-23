# Kế Hoạch Triển Khai Chi Tiết: Webapp Chấm Công Caritas Đà Lạt (CHAMCONG)

## 📌 Tổng Quan
- **Tên dự án:** CHAMCONG - Hệ thống chấm công nội bộ Caritas Đà Lạt
- **Mục tiêu:** Chấm công camera watermark thời gian thực, GPS Geofencing đa địa điểm, quản trị nhân sự, duyệt đơn từ, xuất báo cáo Excel chuẩn, triển khai Docker trên Synology NAS.
- **Loại dự án:** WEB (Next.js 15 App Router Fullstack)

---

## 🎯 Tiêu Chí Hoàn Thành (Success Criteria)
- [x] 1. Khởi tạo mã nguồn dự án Next.js 15 Fullstack trong `PROJECT/CHAMCONG`.
- [x] 2. Thiết kế CSDL Prisma SQLite (Users, Shifts, Locations, Attendances, LeaveRequests) & Seeding dữ liệu mẫu.
- [x] 3. Hoàn thiện Engine Camera & Client Canvas Watermark (chặn chọn ảnh album, tự động đóng dấu thời gian, tọa độ, địa chỉ).
- [x] 4. Hoàn thiện Logic Geofencing đa địa điểm (tính khoảng cách với tọa độ các văn phòng/cơ sở Caritas).
- [x] 5. Xây dựng phân hệ Quản trị (Admin Dashboard: Theo dõi realtime, Quản lý NV, Ca làm việc, Địa điểm, Duyệt đơn).
- [x] 6. Xây dựng phân hệ Xuất Báo Cáo Excel (`exceljs` - Bảng tổng hợp tháng 31 ngày kèm công thức & Bảng log quẹt thẻ).
- [x] 7. Đóng gói Dockerfile Standalone & `docker-compose.yml` tối ưu cho NAS Synology + Hướng dẫn `DEPLOY_SYNOLOGY.md`.

---

## ✅ PHASE X COMPLETE
- Database Migration & Seed: ✅ Pass
- Type Check & Lint: ✅ Pass
- Standalone Production Build: ✅ Success (19 pages / 18 routes)
- Date: 2026-08-23
