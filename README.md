# Travel With Me - Hệ Sinh Thái Đặt Tour Du Lịch Trực Tuyến Đa Nền Tảng (Web & Mobile Expo)

> Hệ sinh thái đặt tour du lịch trực tuyến hiện đại trên cả **Web Portal (React + Vite)** và **Ứng dụng Di động (React Native + Expo Go)**, kết nối du khách với những hành trình độc bản trên khắp Việt Nam. Tích hợp thanh toán đa kênh, vé điện tử Boarding Pass QR Code, quản lý giữ chỗ chống Overbooking, không gian Cộng đồng UGC, thông báo nhắc lịch 24h đa kênh (`Zalo ZNS`, `SMS`, `Email`, `In-App`), đa ngôn ngữ (`VI`/`EN`), đa tiền tệ (`VND`, `USD`, `EUR`, `JPY`), bộ nhớ đệm hiệu năng cao (`FastCache / Redis`) và phân hệ quản trị doanh nghiệp kết nối trực tiếp với **Microsoft SQL Server**.

---

## 🌟 Tính Năng Nổi Bật

### 1. Phân hệ Du khách trên Web (Client Portal - `client/`)
- **Menu Sidebar thông minh bên trái (Collapsible Sidebar):** Thanh điều hướng dọc mượt mà, hỗ trợ thu gọn (Collapsed) và mở rộng (Expanded), hiển thị điểm Elo uy tín, vai trò và lối tắt truy cập nhanh (hỗ trợ phím tắt `Ctrl + B`).
- **Tốc độ truy cập tức thì (`0ms` Artificial Delay):** Loại bỏ màn hình chờ rườm rà, đưa người dùng vào thẳng không gian khám phá hành trình ngay khi mở trang.
- **Tìm kiếm & Bộ lọc thông minh:** Lọc theo điểm khởi hành, điểm đến, ngày đi, khoảng giá và loại hình tour (Biển đảo, Nghỉ dưỡng, Trekking, Văn hóa).
- **Trang chi tiết tour hoàn chỉnh:**
  - Lịch trình Itinerary từng ngày kèm hoạt động, khách sạn và ẩm thực.
  - Bảng dịch vụ bao gồm & chưa bao gồm minh bạch.
  - Mô phỏng lộ trình bản đồ (Route Map) và thông tin hướng dẫn viên.
  - Đánh giá sao, album ảnh thực tế từ du khách kèm phản hồi chính thức của Ban Quản Trị.
- **Đặt tour & Giữ chỗ chống Overbooking:**
  - Kiểm soát số suất khả dụng theo thời gian thực (Inventory Slots).
  - Đếm lùi giữ chỗ tạm thời trong 15 phút.
  - Lưu trữ đơn đặt tour trực tiếp vào bảng `dbo.bookings` trong CSDL SQL Server.
- **Mã giảm giá (Coupons):** Áp dụng mã `WELCOME2026`, `SUMMER500K`, `TRAVEL2026` với kiểm tra điều kiện tự động.
- **Thanh toán đa kênh:** Hỗ trợ mô phỏng VNPay, MoMo, quét mã VietQR tự động, Thẻ quốc tế Visa/Mastercard và Tiền mặt.
- **Vé điện tử (E-Ticket):** Tạo vé điện tử chuẩn hàng không kèm mã QR định danh đơn hàng để check-in trực tiếp.
- **Lịch sử chuyến đi & Cô lập dữ liệu (My Trips):**
  - Quản lý chuyến đi cá nhân hóa theo từng `userId`, hoàn toàn cô lập giữa các tài khoản.
  - Chính sách hủy tour & hoàn tiền minh bạch (hoàn 100%, 70%, 50%, 0%), tự động hoàn trả số chỗ vào kho.
- **Danh sách Yêu thích (Wishlist):** Lưu các tour quan tâm riêng biệt theo từng tài khoản.
- **Đánh giá Chuyến đi Minh bạch (Verified Completed Reviews):** Chỉ cho phép đánh giá đối với các đơn hàng đã hoàn thành (`COMPLETED`), chống spam (1 lần/đơn), hỗ trợ đính kèm hình ảnh thực tế và xem phản hồi chính thức từ Ban Quản Trị.
- **Không gian Cộng đồng & Nhật ký Hành trình (Travel Blog UGC):** Nơi du khách chia sẻ câu chuyện, mẹo du lịch, gắn thẻ địa danh, thả tim, bình luận và liên kết đặt chuyến đi tương tự chỉ với 1 cú nhấp chuột.
- **Trung tâm Thông báo Đa kênh (Multi-Channel Notification Hub):** Quản lý thông báo theo 5 phân mục (*Tất cả*, *Chuyến đi & Vé*, *Nhắc lịch 24h*, *Khuyến mãi*, *Cộng đồng*) qua các kênh `In-App`, `Email`, `SMS Brandname` và `Zalo ZNS`.
- **Đa ngôn ngữ (`VI` / `EN`) & Đa tiền tệ Thời gian thực (`VND`, `USD`, `EUR`, `JPY`):** Chuyển đổi ngôn ngữ giao diện tức thì và tự động quy đổi giá tour theo tỷ giá ngoại hối.
- **Trợ lý du lịch AI:** Chatbot thông minh tư vấn tour, hành trình, giá vé và giải đáp thắc mắc 24/7.

---

### 2. Phân hệ Quản trị viên (Admin Portal - Web & Mobile)
- **Kết nối dữ liệu thực 100% với Microsoft SQL Server:**
  - Toàn bộ chỉ số doanh thu, số lượt đặt tour, tỷ lệ lấp đầy chỗ và danh sách đơn hàng đều được truy vấn từ bảng `dbo.bookings`.
- **Thống kê Doanh thu & Tăng trưởng (Bento KPI & Analytics Dashboard):**
  - Hàng thẻ chỉ số Bento Grid KPI hiện đại kèm tỷ lệ tăng trưởng doanh thu tháng (`+% MoM`).
  - Biểu đồ cột đôi (Dual-Tone Pillars) theo dõi tăng trưởng doanh thu 6 tháng gần nhất được tính toán động từ database.
- **Quản lý Đơn đặt tour (Bookings Management):**
  - Tra cứu, tìm kiếm nhanh theo mã đơn đặt chỗ, tên khách hàng hoặc số điện thoại.
  - Lọc và thay đổi trạng thái đơn đặt chỗ trực tiếp (`PATCH /api/admin/bookings/:id/status`) với cập nhật tức thì xuống SQL Server.
- **Quản lý Tour toàn diện (Tour Lifecycle Management):**
  - Thêm mới và chỉnh sửa tour, tải ảnh bìa/bộ sưu tập ảnh, soạn thảo lịch trình từng ngày (Day-by-day Itinerary).
  - Lưu trữ và đồng bộ hóa trực tiếp vào các bảng `dbo.tours`, `dbo.tour_schedules`, `dbo.tour_images`, `dbo.tour_itineraries`.
- **Kiểm duyệt Đánh giá & Phản hồi Chính thức (Review Moderation):**
  - Kiểm duyệt ẩn/hiện các đánh giá vi phạm quy chuẩn cộng đồng (`PATCH /api/admin/reviews/:id/visibility`).
  - Gửi phản hồi chính thức từ Ban Quản Trị (`POST /api/admin/reviews/:id/reply`) hiển thị trực tiếp dưới nhận xét của khách hàng.
- **Giám sát Bộ nhớ đệm Hiệu năng cao (Redis / FastCache):**
  - Theo dõi tỷ lệ `HIT/MISS`, tốc độ phản hồi trung bình (`< 10ms`) và dọn dẹp bộ nhớ đệm (`Flush Cache`) trực tiếp trên Admin Dashboard.

---

### 3. Phân hệ Ứng dụng Di động Đa nền tảng (Mobile App - `mobile/` với Expo Go)
- **Kiến trúc Native 5 Tab dưới đáy màn hình (`Bottom Tab Bar`):**
  1. **Khám phá ([ExploreScreen.js](file:///d:/Projects/Travel-with-me/mobile/src/screens/ExploreScreen.js)):** Tìm kiếm từ khóa, lọc danh mục ngang, kéo để đồng bộ SQL Server (`Pull-to-Refresh`), chuyển đổi tiền tệ `VND/USD/EUR/JPY`, xem chi tiết lịch trình, đọc đánh giá xác thực và đặt tour.
  2. **Chuyến đi & Vé QR ([MyTripsScreen.js](file:///d:/Projects/Travel-with-me/mobile/src/screens/MyTripsScreen.js)):** Quản lý đơn đặt chỗ, hiển thị thẻ **E-Boarding Pass QR Code** trực tiếp trên màn hình điện thoại để xuất trình khi lên xe/tàu, và gửi đánh giá 1–5 sao kèm ảnh cho đơn `COMPLETED`.
  3. **Cộng đồng UGC ([CommunityScreen.js](file:///d:/Projects/Travel-with-me/mobile/src/screens/CommunityScreen.js)):** Lướt đọc nhật ký hành trình, lọc theo địa danh, thả tim, bình luận, đăng bài viết mới và bấm **"Đặt Chuyến Đi Tương Tự"**.
  4. **Thông báo 24h ([NotificationsScreen.js](file:///d:/Projects/Travel-with-me/mobile/src/screens/NotificationsScreen.js)):** Nhận thông báo đa kênh (`ZALO ZNS`, `SMS`, `EMAIL`, `IN-APP`) và kích hoạt **Test Nhắc Lịch 24h** ngay trên điện thoại.
  5. **Tài khoản & Admin Mobile ([ProfileAdminScreen.js](file:///d:/Projects/Travel-with-me/mobile/src/screens/ProfileAdminScreen.js)):** Chuyển đổi nhanh quyền RBAC Demo (`Super Admin`, `Staff`, `User`), cấu hình địa chỉ IP Server trực tiếp trên ứng dụng, xem thống kê Bento KPI, bấm **Xóa Cache (Flush)** và kiểm duyệt/phản hồi đánh giá trên di động.
- **Tự động nhận diện IP LAN & Chế độ Dự phòng Thông minh ([api.js](file:///d:/Projects/Travel-with-me/mobile/src/config/api.js)):**
  - Tự động đọc địa chỉ IPv4 LAN của máy tính chạy Backend qua `expo-constants` để điện thoại dùng **Expo Go** kết nối thẳng tới cổng `5000` mà không gặp lỗi `localhost`.
  - Tích hợp **Smart Offline Fallback** tự động kích hoạt dữ liệu mẫu chuẩn xác nếu thiết bị di động khác mạng Wi-Fi hoặc bị chặn tường lửa.

---

## 🛠️ Kiến Trúc Công Nghệ

| Thành phần | Công nghệ sử dụng |
| :--- | :--- |
| **Web Client (`client/`)** | React 19, Vite 8, Vanilla CSS (Luxury Travel Design System, Glassmorphism, Bento Grid), Lucide Icons |
| **Mobile App (`mobile/`)** | React Native 0.88, Expo SDK 58, `@react-native-async-storage/async-storage`, `expo-constants`, `@expo/vector-icons`, kiểm thử trực tiếp trên **Expo Go (iOS & Android)** |
| **Backend Server (`server/`)** | Node.js (ES Modules), Express.js (`0.0.0.0:5000`), JWT Authentication, Bcryptjs, CORS |
| **Cơ sở dữ liệu** | **Microsoft SQL Server** (kết nối qua thư viện `mssql` pool connection), 15+ bảng quan hệ |
| **Bộ nhớ đệm & Đa ngôn ngữ** | Redis / Smart In-Memory FastCache (`< 10ms` latency), Context i18n (`VI`/`EN`) & Multi-Currency (`VND`/`USD`/`EUR`/`JPY`) |
| **Tài liệu & Báo cáo** | [baocao.md](file:///d:/Projects/Travel-with-me/baocao.md), [baocao2.md](file:///d:/Projects/Travel-with-me/baocao2.md), [baocao3.md](file:///d:/Projects/Travel-with-me/baocao3.md), [baocao4.md](file:///d:/Projects/Travel-with-me/baocao4.md), [baocao5.md](file:///d:/Projects/Travel-with-me/baocao5.md), [docs/SPECIFICATION.md](file:///d:/Projects/Travel-with-me/docs/SPECIFICATION.md) |

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy Dự Án

### Yêu cầu tiên quyết:
- **Node.js** >= 18.x & **npm** >= 9.x
- **Microsoft SQL Server** (local port `1433`, database `TravelWithMe`)
- Ứng dụng **Expo Go** trên điện thoại iOS (App Store) hoặc Android (Google Play) nếu kiểm thử trên thiết bị di động thật.

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

# Chạy migration và nạp dữ liệu Giai đoạn 4 (Đánh giá, Cộng đồng UGC, Thông báo đa kênh)
node server/sql/004_run_migration.js
```

### 2. Khởi chạy Backend Server (Cổng 5000 - Hỗ trợ cả Web & Mobile LAN):
```bash
cd server
npm install
npm run dev
# Server hoạt động tại: http://localhost:5000 (và mạng LAN: http://<LAN_IP>:5000)
```

### 3. Khởi chạy Web Frontend Client (Cổng 5173):
```bash
cd client
npm install
npm run dev
# Ứng dụng Web hoạt động tại: http://localhost:5173
```

### 4. Khởi chạy & Kiểm thử Ứng dụng Di động trên Expo Go (Cổng 8081):
```bash
cd mobile
npm install

# Cách 1: Chạy qua mạng Wi-Fi nội bộ (Khuyên dùng khi điện thoại cùng Wi-Fi)
npm run start:lan

# Cách 2: Chạy qua chế độ Tunnel (Dùng khi khác mạng Wi-Fi, 4G hoặc mạng trường/công ty chặn LAN)
npm run start:tunnel
```
- **Trên iPhone (iOS):** Mở ứng dụng **Camera** → Quét mã QR trên cửa sổ Terminal → Chọn **"Mở trong Expo Go"**.
- **Trên Android:** Mở ứng dụng **Expo Go** → Chọn **"Scan QR Code"** (hoặc nhập trực tiếp địa chỉ `exp://<LAN_IP>:8081`).

---

## 👤 Tài Khoản Đăng Nhập Mẫu

| Vai trò | Email | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Super Admin)** | `admin@travelwithme.vn` | `Admin@123456` | Toàn quyền Kênh Quản Trị, cấu hình vai trò RBAC, quản lý tour, quản lý đơn đặt chỗ, kiểm duyệt đánh giá, xóa Cache |
| **Người dùng (Customer)** | `user@travelwithme.vn` | `User@123456` | Đặt tour, xem lịch sử chuyến đi cá nhân, lưu tour yêu thích, xem vé điện tử QR, đánh giá đơn `COMPLETED`, đăng bài Cộng đồng |

*(Trên cả Web và Mobile App đều tích hợp sẵn bộ chuyển đổi nhanh quyền Demo RBAC 1-chạm giúp kiểm thử thuận tiện).*

---

## 📄 Bản Quyền
Dự án được phát triển và phát hành theo giấy phép MIT License - Xem chi tiết tại [LICENSE](file:///d:/Projects/Travel-with-me/LICENSE).
