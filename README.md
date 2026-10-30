# Travel With Me - Nền Tảng Đặt Tour Du Lịch Trực Tuyến

> Dự án website đặt tour du lịch trực tuyến hiện đại, kết nối du khách với những hành trình độc bản trên khắp Việt Nam. Tích hợp thanh toán đa kênh, vé điện tử QR Code, quản lý giữ chỗ chống Overbooking, phân hệ quản trị doanh nghiệp toàn diện kết nối trực tiếp với **Microsoft SQL Server**, và giao diện thiết kế chuẩn mực cao cấp.

---

## 🌟 Tính Năng Nổi Bật

### 1. Phân hệ Du khách (Client Portal)
- **Menu Sidebar thông minh bên trái (Collapsible Sidebar):** Thanh điều hướng dọc mượt mà, hỗ trợ thu gọn (Collapsed) và mở rộng (Expanded), hiển thị điểm Elo uy tín, vai trò và lối tắt truy cập nhanh.
- **Khóa tỷ lệ thu phóng 100%:** Ngăn ngừa tình trạng vỡ layout khi người dùng zoom ngoài ý muốn trên trình duyệt.
- **Trải nghiệm chào đón cao cấp (Site Preloader):** Hiệu ứng rèm kéo mở thương hiệu xuất hiện tinh tế khi người dùng truy cập website lần đầu.
- **Tìm kiếm & Bộ lọc thông minh:** Lọc theo điểm khởi hành, điểm đến, ngày đi, khoảng giá và loại hình tour (Biển đảo, Nghỉ dưỡng, Trekking, Văn hóa).
- **Trang chi tiết tour hoàn chỉnh:**
  - Lịch trình Itinerary từng ngày kèm hoạt động, khách sạn và ẩm thực.
  - Bảng dịch vụ bao gồm & chưa bao gồm minh bạch.
  - Mô phỏng lộ trình bản đồ (Route Map) và thông tin hướng dẫn viên.
  - Đánh giá sao & nhận xét thực tế từ du khách.
- **Đặt tour & Giữ chỗ chống Overbooking:**
  - Kiểm soát số suất khả dụng theo thời gian thực (Inventory Slots).
  - Đếm lùi giữ chỗ tạm thời trong 15 phút.
  - Lưu trữ đơn đặt tour trực tiếp vào bảng `dbo.bookings` trong CSDL SQL Server.
- **Mã giảm giá (Coupons):** Áp dụng mã `TRAVEL2026` (giảm 10%) hoặc `WELCOME500K` (giảm 500k) với kiểm tra điều kiện tự động.
- **Thanh toán đa kênh:** Hỗ trợ mô phỏng VNPay, MoMo, quét mã VietQR tự động, Thẻ quốc tế Visa/Mastercard (Stripe) và Tiền mặt.
- **Vé điện tử (E-Ticket):** Tạo vé điện tử chuẩn hàng không kèm mã QR định danh đơn hàng để check-in trực tiếp.
- **Lịch sử chuyến đi & Cô lập dữ liệu (My Trips):**
  - Quản lý chuyến đi cá nhân hóa theo từng `userId`, hoàn toàn cô lập giữa các tài khoản.
  - Giao diện Empty State thân thiện khi tài khoản chưa có chuyến đi.
  - Chính sách hủy tour & hoàn tiền minh bạch (hoàn 100%, 70%, 50%, 0%), tự động hoàn trả số chỗ vào kho.
- **Danh sách Yêu thích (Wishlist):** Lưu các tour quan tâm riêng biệt theo từng tài khoản; bảo vệ quyền truy cập đối với khách vãng lai.
- **Trợ lý du lịch AI:** Chatbot thông minh tư vấn tour, hành trình, giá vé và giải đáp thắc mắc 24/7.

---

### 2. Phân hệ Quản trị viên (Admin Portal)
- **Kết nối dữ liệu thực 100% với Microsoft SQL Server:**
  - Toàn bộ chỉ số doanh thu, số lượt đặt tour, tỷ lệ lấp đầy chỗ và danh sách đơn hàng đều được truy vấn từ bảng `dbo.bookings`.
- **Thống kê Doanh thu & Tăng trưởng (Analytics Dashboard):**
  - Biểu đồ cột trực quan theo dõi tăng trưởng doanh thu 6 tháng gần nhất được tính toán động từ database.
  - Phân tích cơ cấu và tỷ lệ phần trăm theo 6 trạng thái đặt tour.
- **Quản lý Đơn đặt tour (Bookings Management):**
  - Tra cứu, tìm kiếm nhanh theo mã đơn đặt chỗ, tên khách hàng hoặc số điện thoại.
  - Lọc theo trạng thái: `Chờ thanh toán`, `Đã thanh toán`, `Đã xác nhận`, `Đang đi tour`, `Đã hoàn thành`, `Đã hủy`.
  - Thay đổi trạng thái đơn đặt chỗ trực tiếp (`PATCH /api/admin/bookings/:id/status`) với cập nhật tức thì xuống SQL Server.
  - Drawer modal xem chi tiết đơn hàng: Xem danh sách hành khách, thông tin liên hệ và vé điện tử QR Code.
- **Quản lý Tour toàn diện (Tour Lifecycle Management):**
  - Thêm mới và chỉnh sửa tour: Điểm đi/đến, thời lượng, giá gốc, giá khuyến mãi, số chỗ tối đa.
  - Tải ảnh bìa và bộ sưu tập ảnh tour.
  - Soạn thảo lịch trình chi tiết từng ngày (Day-by-day Itinerary), hoạt động và tiện ích đi kèm.
  - Lưu trữ và đồng bộ hóa trực tiếp vào các bảng `dbo.tours`, `dbo.tour_schedules`, `dbo.tour_images`, `dbo.tour_itineraries`.
- **Cơ chế chống trùng lặp (Deduplication Engine):**
  - Tự động phát hiện và loại bỏ các tour trùng lặp giữa CSDL và dữ liệu mẫu, đảm bảo toàn bộ danh mục hiển thị các tour độc bản.
- **Xuất dữ liệu:** Hỗ trợ xuất file Excel/CSV danh sách hành khách phục vụ công tác điều hành tour và hướng dẫn viên.
- **Phân quyền người dùng & Quản lý vai trò (RBAC):**
  - Quản lý phân quyền giữa các vai trò `SUPER_ADMIN`, `STAFF` và `USER`.
  - Nhãn hiển thị chức vụ typography tinh tế, thanh lịch (bỏ khung viền rập khuôn).

---

## 🛠️ Kiến Trúc Công Nghệ

| Thành phần | Công nghệ sử dụng |
| :--- | :--- |
| **Frontend Client** | React 19, Vite 8, Vanilla CSS (Design system, Glassmorphism, Micro-interactions), Lucide Icons, Canvas Confetti |
| **Backend Server** | Node.js (ES Modules), Express.js, JWT Authentication, Bcryptjs, CORS, Express-rate-limit |
| **Cơ sở dữ liệu** | **Microsoft SQL Server** (kết nối qua thư viện `mssql` pool connection), Prisma ORM Schema |
| **Bảo mật & Phân quyền** | JSON Web Token (JWT) trong HTTP Headers, cơ chế RBAC (`SUPER_ADMIN`, `STAFF`, `USER`) |
| **Tài liệu & Báo cáo** | [baocao2.md](file:///d:/Projects/Travel-with-me/baocao2.md), [baocao3.md](file:///d:/Projects/Travel-with-me/baocao3.md), [docs/SPECIFICATION.md](file:///d:/Projects/Travel-with-me/docs/SPECIFICATION.md) |

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy Dự Án

### Yêu cầu tiên quyết:
- **Node.js** >= 18.x
- **npm** >= 9.x
- **Microsoft SQL Server** (local port 1433, database `TravelWithMe`)

### 1. Cấu hình Cơ sở dữ liệu:
Cấu hình thông tin kết nối CSDL trong file `server/.env`:
```env
PORT=5000
JWT_SECRET=your_jwt_secret_key_travelwithme_2026
DB_SERVER=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=your_password
DB_NAME=TravelWithMe
```

Nạp dữ liệu mẫu ban đầu vào SQL Server bằng các script có sẵn:
```bash
# Nạp dữ liệu tour và đơn đặt hàng mẫu vào database
node server/sql/003_seed_tours.js
```

### 2. Khởi chạy Backend Server:
```bash
cd server
npm install
npm run dev
# Server hoạt động tại: http://localhost:5000
```

### 3. Khởi chạy Frontend Client:
```bash
cd client
npm install
npm run dev
# Ứng dụng hoạt động tại: http://localhost:5173
```

---

## 👤 Tài Khoản Đăng Nhập Mẫu

| Vai trò | Email | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Super Admin)** | `admin@travelwithme.vn` | `Admin@123456` | Toàn quyền Kênh Quản Trị, cấu hình vai trò RBAC, quản lý tour, quản lý đơn đặt chỗ, xem doanh thu |
| **Người dùng (Customer)** | `user@travelwithme.vn` | `User@123456` | Đặt tour, xem lịch sử chuyến đi cá nhân, lưu tour yêu thích, xem vé điện tử |

*(Bạn cũng có thể tự do đăng ký tài khoản mới trực tiếp từ giao diện trang web).*

---

## 📄 Bản Quyền
Dự án được phát triển và phát hành theo giấy phép MIT License - Xem chi tiết tại [LICENSE](file:///d:/Projects/Travel-with-me/LICENSE).