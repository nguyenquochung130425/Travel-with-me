# Travel With Me - Nền Tảng Đặt Tour Du Lịch Trực Tuyến

> Dự án website đặt tour du lịch trực tuyến hiện đại, kết nối du khách với những hành trình độc bản trên khắp Việt Nam. Tích hợp thanh toán đa kênh, vé điện tử QR Code, quản lý giữ chỗ chống Overbooking và cổng quản trị doanh nghiệp chuyên nghiệp.

---

## 🌟 Tính Năng Nổi Bật

### 1. Phân hệ Du khách (Client Portal)
- **Tìm kiếm & Bộ lọc nâng cao:** Lọc theo điểm khởi hành, điểm đến, ngày đi, mức giá và loại hình tour (Nghỉ dưỡng, Trekking, Văn hóa, Biển đảo).
- **Trang chi tiết tour hoàn chỉnh:**
  - Lịch trình Itinerary từng ngày kèm hoạt động, ẩm thực và khách sạn.
  - Bảng dịch vụ bao gồm & chưa bao gồm.
  - Mô phỏng lộ trình bản đồ (Route Map).
  - Đánh giá sao từ du khách đã hoàn thành chuyến đi.
- **Giữ chỗ & Chống Overbooking:** Đếm lùi giữ chỗ tạm thời trong 15 phút, cập nhật số suất khả dụng theo thời gian thực.
- **Mã giảm giá (Coupons):** Áp dụng mã `TRAVEL2026` (giảm 10%) hoặc `WELCOME500K` (giảm 500k) với kiểm tra điều kiện tự động.
- **Thanh toán đa kênh:** Hỗ trợ mô phỏng VNPay, MoMo, quét mã VietQR tự động, Thẻ quốc tế Visa/Mastercard (Stripe) và Tiền mặt.
- **Vé điện tử (E-Ticket):** Tạo vé điện tử chuẩn hàng không kèm mã QR định danh đơn hàng để check-in trực tiếp.
- **Lịch sử chuyến đi & Hoàn hủy:** Xem lại vé, hủy tour theo chính sách phạt minh bạch (hoàn 100%, 70%, 50%, 0%) và tự động hoàn trả số chỗ vào kho.
- **Đánh giá & Nhận xét:** Cho phép khách hàng đã đi tour chấm điểm 1–5 sao và chia sẻ cảm nghĩ.
- **Trợ lý du lịch AI:** Chatbot tư vấn giá tour, thời tiết và chính sách hỗ trợ 24/7.

### 2. Phân hệ Quản trị viên (Admin Portal)
- **Thống kê Doanh thu (Analytics Dashboard):** Biểu đồ cột trực quan tăng trưởng 6 tháng, tổng doanh thu thực nhận, tỷ lệ hủy đơn.
- **Quản lý Đơn đặt tour (Bookings):** Tra cứu, lọc theo trạng thái (`Chờ thanh toán`, `Đã thanh toán`, `Đã xác nhận`, `Đang đi tour`, `Hoàn thành`, `Đã hủy`).
- **Xuất dữ liệu:** Hỗ trợ xuất file Excel/CSV danh sách toàn bộ hành khách cho Hướng dẫn viên và Điều hành tour.
- **Kiểm soát Suất đặt (Inventory Slots):** Theo dõi thanh tiến độ tỷ lệ lấp đầy chỗ của từng đợt khởi hành.
- **Quản lý Khuyến mãi:** Danh sách mã giảm giá và hạn mức áp dụng.

---

## 🛠️ Kiến Trúc Công Nghệ

- **Frontend:** React 19, Vite, Vanilla CSS (Design system, Glassmorphism, Responsive 100%), Lucide Icons, Canvas Confetti.
- **Backend API:** Node.js, Express.js, RESTful API endpoints, CORS.
- **Database Schema:** Prisma ORM Schema (11 bảng dữ liệu: Users, Categories, Tours, TourSchedules, Bookings, BookingPassengers, Payments, Reviews, Coupons, ItineraryDays, Wishlists).
- **Tài liệu đặc tả (SRS):** [docs/SPECIFICATION.md](file:///d:/Travel-with-me/docs/SPECIFICATION.md).

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### Yêu cầu hệ thống:
- Node.js >= 18.x
- npm >= 9.x

### 1. Khởi chạy Backend Server:
```bash
cd server
npm install
npm run dev
# Server lắng nghe tại: http://localhost:5000
```

### 2. Khởi chạy Frontend Client:
```bash
cd client
npm install
npm run dev
# Ứng dụng chạy tại: http://localhost:5173
```

---

## 📄 Bản quyền
Dự án được phát hành theo giấy phép MIT License - Xem chi tiết tại [LICENSE](file:///d:/Travel-with-me/LICENSE).