# BÁO CÁO CHI TIẾT TIẾN ĐỘ & TỔNG HỢP CÁC CHỨC NĂNG ĐÃ HOÀN THIỆN (GIAI ĐOẠN 3)
# HỆ THỐNG ĐẶT TOUR DU LỊCH TRỰC TUYẾN - TRAVEL WITH ME
**Thời gian hoàn thành:** 31/10/2026  
**Phiên bản hệ thống:** v1.3.0  
**Kho lưu trữ GitHub:** [Travel-with-me](https://github.com/nguyenquochung130425/Travel-with-me.git)

---

## MỤC LỤC
1. [TỔNG QUAN TIẾN ĐỘ GIAI ĐOẠN 3](#1-tổng-quan-tiến-độ-giai-đoạn-3)
2. [CHI TIẾT CÁC TÍNH NĂNG VÀ CẢI TIẾN ĐÃ THỰC HIỆN](#2-chi-tiết-các-tính-năng-và-cải-tiến-đã-thực-hiện)
   - [2.1. Thiết kế & Triển khai Menu Sidebar thông minh bên trái (Collapsible Left Sidebar)](#21-thiết-kế--triển-khai-menu-sidebar-thông-minh-bên-trái-collapsible-left-sidebar)
   - [2.2. Khóa tỷ lệ thu phóng giao diện tối đa 100% (Lock Maximum Zoom)](#22-khóa-tỷ-lệ-thu-phóng-giao-diện-tối-đa-100-lock-maximum-zoom)
   - [2.3. Tối ưu hóa hiệu ứng chào đón & Chuyển Preloader khi vào website](#23-tối-ưu-hóa-hiệu-ứng-chào-đón--chuyển-preloader-khi-vào-website)
   - [2.4. Hợp nhất nhánh & Hoàn thiện tính năng Quản Lý Tour (Admin Tour Management)](#24-hợp-nhất-nhánh--hoàn-thiện-tính-năng-quản-lý-tour-admin-tour-management)
   - [2.5. Cấu hình & Chuẩn hóa tài khoản Quản trị viên (Admin Authentication & RBAC)](#25-cấu-hình--chuẩn-hóa-tài-khoản-quản-trị-viên-admin-authentication--rbac)
   - [2.6. Đồng bộ hóa toàn bộ Dashboard & Biểu đồ tăng trưởng trực tiếp với Microsoft SQL Server](#26-đồng-bộ-hóa-toàn-bộ-dashboard--biểu-đồ-tăng-trưởng-trực-tiếp-với-microsoft-sql-server)
   - [2.7. Tái thiết kế toàn diện giao diện Kênh Quản Trị theo bộ tiêu chuẩn SKILL.md](#27-tái-thiết-kế-toàn-diện-giao-diện-kênh-quản-trị-theo-bộ-tiêu-chuẩn-skillmd)
   - [2.8. Khắc phục triệt để lỗi trùng lặp Tour và Danh mục (Deduplication Engine)](#28-khắc-phục-triệt-để-lỗi-trùng-lặp-tour-và-danh-mục-deduplication-engine)
   - [2.9. Sửa lỗi hiển thị & Cắt mép nút thao tác bảng Quản lý Đặt chỗ (Table Responsive & Actions)](#29-sửa-lỗi-hiển-thị--cắt-mép-nút-thao-tác-bảng-quản-lý-đặt-chỗ-table-responsive--actions)
   - [2.10. Tinh chỉnh Typography: Bỏ khung viền chữ Admin cạnh huy hiệu 1000 Elo](#210-tinh-chỉnh-typography-bỏ-khung-viền-chữ-admin-cạnh-huy-hiệu-1000-elo)
3. [BẢNG TỔNG HỢP CÁC FILE ĐÃ CHỈNH SỬA & BỔ SUNG MỚI](#3-bảng-tổng-hợp-các-file-đã-chỉnh-sửa--bổ-sung-mới)
4. [KẾT QUẢ KIỂM THỬ THỰC TẾ (TEST CASES)](#4-kết-quả-kiểm-thử-thực-tế-test-cases)
5. [HƯỚNG DẪN VẬN HÀNH & TÀI KHOẢN MẪU](#5-hướng-dẫn-vận-hành--tài-khoản-mẫu)

---

## 1. TỔNG QUAN TIẾN ĐỘ GIAI ĐOẠN 3

Sau khi hoàn thành Giai đoạn 2 (kết nối đặt tour người dùng vào SQL Server và phân quyền RBAC), **Giai đoạn 3** tập trung vào việc nâng cấp toàn diện phân hệ quản trị doanh nghiệp, tối ưu hóa trải nghiệm điều hướng, loại bỏ hoàn toàn dữ liệu giả lập (mock data) trên Dashboard và tinh chỉnh tính thẩm mỹ UI/UX đạt tiêu chuẩn sản phẩm thương mại cao cấp.

### Các thành tựu trọng tâm đạt được:
1. **Liên kết dữ liệu thực 100%:** Toàn bộ các chỉ số thống kê (Doanh thu, Lượt đặt chỗ, Tỷ lệ lấp đầy, Tour hoạt động), biểu đồ tăng trưởng 6 tháng và phân bổ trạng thái trên Admin Dashboard đều được truy vấn và tính toán tự động từ cơ sở dữ liệu quan hệ **Microsoft SQL Server (`dbo.bookings`)**.
2. **Quản lý Vòng đời Tour du lịch:** Hợp nhất thành công tính năng Quản Lý Tour (Thêm mới, Cập nhật, Đăng tải ảnh bìa/bộ sưu tập ảnh, Thiết lập lịch trình từng ngày Itinerary, Dịch vụ bao gồm/chưa bao gồm) đồng bộ trực tiếp vào database.
3. **Cải tiến Trải nghiệm & Điều hướng:** Bổ sung menu Sidebar bên trái có thể thu gọn mượt mà, chuyển hiệu ứng Preloader sang khi tải trang web lần đầu, khóa tỷ lệ zoom cố định ở mức 100% nhằm bảo toàn tỷ lệ hiển thị.
4. **Loại bỏ lỗi hiển thị & Trùng lặp:** Triển khai cơ chế Deduplication lọc bỏ hoàn toàn các tour trùng lặp giữa CSDL và dữ liệu mẫu; sửa lỗi bảng đặt chỗ bị tràn mép cắt cụt nút bấm "Chi tiết"; loại bỏ viền hộp tím của chữ Admin để đạt thẩm mỹ tối giản, tinh tế.

---

## 2. CHI TIẾT CÁC TÍNH NĂNG VÀ CẢI TIẾN ĐÃ THỰC HIỆN

### 2.1. Thiết kế & Triển khai Menu Sidebar thông minh bên trái (Collapsible Left Sidebar)
- **Mục tiêu:** Tạo thanh điều hướng dọc độc lập, cố định bên trái màn hình giúp người dùng và quản trị viên dễ dàng chuyển đổi các khu vực chức năng mà không phụ thuộc vào việc cuộn trang.
- **Chi tiết giải pháp:**
  - Xây dựng component [Sidebar.jsx](file:///d:/Projects/Travel-with-me/client/src/components/Sidebar.jsx):
    - Hỗ trợ 2 trạng thái: **Mở rộng (Expanded - 260px)** và **Thu gọn (Collapsed - 78px)** với nút chuyển đổi (Toggle Chevron) kèm hiệu ứng chuyển động mượt mà.
    - Nhóm các liên kết điều hướng trực quan: *Khám phá Tour*, *Chuyến đi của tôi*, *Tour yêu thích*, *Trợ lý du lịch AI*, *Kênh Quản Trị* (chỉ hiển thị với Admin/Staff).
    - Phần chân trang (Sidebar Footer) hiển thị thẻ người dùng cao cấp: Avatar đại diện, tên người dùng, huy hiệu điểm uy tín **1000 Elo** và nhãn quyền hạn (**Admin / Staff / User**), nút đăng xuất nhanh có cảnh báo.
  - Tích hợp vào [App.jsx](file:///d:/Projects/Travel-with-me/client/src/App.jsx) với biến `isSidebarOpen`, tự động co dãn nội dung trang chính (`.app-main-content`) với `transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)`.

---

### 2.2. Khóa tỷ lệ thu phóng giao diện tối đa 100% (Lock Maximum Zoom)
- **Mục tiêu:** Đảm bảo bố cục giao diện (Grid, Flexbox, Modal, Bảng thống kê) giữ nguyên tỷ lệ thẩm mỹ chuẩn mực, ngăn ngừa hiện tượng vỡ layout khi người dùng vô tình zoom trên màn hình cảm ứng hoặc tổ hợp phím thu phóng.
- **Chi tiết giải pháp:**
  - Tại [client/index.html](file:///d:/Projects/Travel-with-me/client/index.html), cập nhật thẻ meta viewport:
    ```html
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    ```
  - Trong [client/src/App.jsx](file:///d:/Projects/Travel-with-me/client/src/App.jsx), lắng nghe và chặn các sự kiện thu phóng trình duyệt ngoài ý muốn (Ctrl + Wheel, Ctrl + '+', Ctrl + '-'):
    - Ngăn chặn tổ hợp phím thu phóng bàn phím và pinch-to-zoom trên trackpad.

---

### 2.3. Tối ưu hóa hiệu ứng chào đón & Chuyển Preloader khi vào website
- **Hiện tượng cũ:** Trước đây hiệu ứng Preloader xuất hiện sau khi người dùng bấm đăng nhập, gây gián đoạn và làm chậm tiến trình chuyển đổi giao diện người dùng.
- **Cải tiến:**
  - Chuyển toàn bộ hoạt ảnh rèm kéo mở [SitePreloader.jsx](file:///d:/Projects/Travel-with-me/client/src/components/SitePreloader.jsx) thành màn hình chào đón thương hiệu xuất hiện duy nhất một lần khi người dùng truy cập trang web lần đầu.
  - Khi hoàn tất đăng nhập/đăng ký trong [AuthModal.jsx](file:///d:/Projects/Travel-with-me/client/src/components/AuthModal.jsx), modal chỉ hiển thị toast thông báo thành công và cập nhật trạng thái người dùng tức thì, không kích hoạt lại toàn bộ preloader trang.

---

### 2.4. Hợp nhất nhánh & Hoàn thiện tính năng Quản Lý Tour (Admin Tour Management)
- **Bối cảnh:** Nhánh `origin/nhanh1` chứa mã nguồn form quản trị tour nhưng gặp xung đột merge và lỗi runtime khi lưu dữ liệu.
- **Các bước xử lý:**
  1. Hợp nhất hoàn chỉnh nhánh `origin/nhanh1` vào nhánh chính `main` (commit `3784d99`).
  2. Sửa lỗi nghiêm trọng: `TypeError: Cannot read properties of undefined (reading 'split')` trong [AdminTourForm.jsx](file:///d:/Projects/Travel-with-me/client/src/components/AdminTourForm.jsx).
     - Bổ sung kiểm tra kiểu dữ liệu an toàn cho `activitiesText`:
       ```javascript
       const activities = typeof itinerary.activitiesText === 'string'
         ? itinerary.activitiesText.split(',').map((a) => a.trim()).filter(Boolean)
         : (Array.isArray(itinerary.activities) ? itinerary.activities : []);
       ```
  3. Hoàn thiện Form Quản Lý Tour:
     - Nhập thông tin tổng quan: Tên tour, điểm khởi hành, điểm đến, thời lượng, giá gốc, giá khuyến mãi, số chỗ tối đa.
     - Tải ảnh bìa & danh sách ảnh thư viện (URL / Upload).
     - Trình soạn thảo lịch trình chi tiết theo từng ngày (Day-by-day Itinerary) với hoạt động, khách sạn, điểm ăn uống.
     - Danh sách dịch vụ bao gồm & chưa bao gồm.
  4. Viết Endpoint lưu trữ tour vào SQL Server trong [server/src/index.js](file:///d:/Projects/Travel-with-me/server/src/index.js#L770-L895):
     - `POST /api/admin/tours`: Tạo mới hoặc cập nhật tour vào các bảng `dbo.tours`, `dbo.tour_schedules`, `dbo.tour_images`, `dbo.tour_itineraries`.
     - Xác thực quyền hạn Quản trị viên thông qua middleware `requireAuth` và `requireAdmin`.

---

### 2.5. Cấu hình & Chuẩn hóa tài khoản Quản trị viên (Admin Authentication & RBAC)
- **Tài khoản Quản trị viên hệ thống:**
  - **Email:** `admin@travelwithme.vn`
  - **Mật khẩu:** `Admin@123456`
  - **Vai trò (Role):** `SUPER_ADMIN` (được cấp toàn quyền truy cập Kênh Quản Trị, cấu hình vai trò RBAC, quản lý tour, quản lý đơn đặt chỗ, xem báo cáo doanh thu).
- **Cải tiến mã nguồn:**
  - Cập nhật [server/src/auth.js](file:///d:/Projects/Travel-with-me/server/src/auth.js): Đảm bảo tài khoản admin được seed cố định, tự động hash mật khẩu với `bcryptjs`, cấp JWT Token có thời hạn hợp lệ và luôn trả về quyền `role = 'SUPER_ADMIN'` cùng `elo = 1000`.

---

### 2.6. Đồng bộ hóa toàn bộ Dashboard & Biểu đồ tăng trưởng trực tiếp với Microsoft SQL Server
- **Vấn đề trước đây:** Trang Dashboard Admin sử dụng các số liệu mẫu cố định (mock state) không phản ánh thực tế các đơn đặt tour của khách hàng trong database.
- **Giải pháp triển khai:**
  1. Xây dựng Script tạo dữ liệu mẫu đặt tour phong phú [server/sql/002_seed_admin_bookings.sql](file:///d:/Projects/Travel-with-me/server/sql/002_seed_admin_bookings.sql):
     - Bổ sung 18 đơn đặt tour với đầy đủ các trạng thái (`PAID`, `CONFIRMED`, `IN_TOUR`, `COMPLETED`, `CANCELLED`, `PENDING_PAYMENT`), trải đều trên các tháng từ 05/2026 đến 10/2026.
  2. Viết lại hàm tải dữ liệu trong [client/src/components/AdminDashboard.jsx](file:///d:/Projects/Travel-with-me/client/src/components/AdminDashboard.jsx):
     - Gọi đồng thời API `GET /api/admin/bookings` và `GET /api/tours`.
     - **Thẻ thống kê tổng quan (Overview Stats):**
       - *Tổng doanh thu:* Tính tổng số tiền từ các đơn đã thanh toán (`PAID`, `CONFIRMED`, `IN_TOUR`, `COMPLETED`).
       - *Tổng lượt đặt tour:* Đếm tổng số bản ghi trong bảng `dbo.bookings`.
       - *Tỷ lệ lấp đầy:* Tính toán dựa trên số chỗ đã đặt so với tổng số chỗ khả dụng của các tour.
       - *Tour đang mở bán:* Số lượng tour có trạng thái hoạt động trong database.
     - **Biểu đồ tăng trưởng doanh thu 6 tháng (Monthly Revenue Trend):**
       - Thuật toán tự động nhóm doanh thu theo từng tháng (`5/2026`, `6/2026`, ..., `10/2026`) từ trường `created_at` trong CSDL, tính tỷ lệ phần trăm chiều cao cột biểu đồ tương đối theo giá trị lớn nhất (Max Revenue).
     - **Phân bổ trạng thái đặt tour (Status Distribution):**
       - Phân tích tỷ lệ phần trăm động của 6 trạng thái đơn hàng, hiển thị thanh tiến độ đa sắc và badge số lượng tương ứng.
     - **Cập nhật trạng thái trực tiếp xuống SQL Server:**
       - Tích hợp dropdown thay đổi trạng thái ngay trên bảng (`PATCH /api/admin/bookings/:id/status`), cập nhật tức thì vào SQL Server và tự động tính toán lại toàn bộ doanh thu cùng biểu đồ tăng trưởng mà không cần tải lại trang.

---

### 2.7. Tái thiết kế toàn diện giao diện Kênh Quản Trị theo bộ tiêu chuẩn SKILL.md
- **Nguyên tắc thẩm mỹ áp dụng:**
  - Bảng màu hiện đại: Nền Slate tinh tế (`#f8fafc`), thẻ Card kính mờ trắng ngọc trai viền mảnh (`border: 1px solid var(--slate-200)`), điểm nhấn Cyan/Blue (`#0284c7`, `#0ea5e9`) và Emerald (`#10b981`).
  - Hệ thống thẻ số liệu KPI: Thiết kế dạng card nổi khối với icon màu sắc, tỷ lệ tăng trưởng so với kỳ trước, typography số tiền lớn nổi bật.
  - Bộ lọc thông minh đa tầng: Thanh tìm kiếm mã đơn/khách hàng, chip lọc nhanh trạng thái (`Tất cả`, `Đã thanh toán`, `Chờ thanh toán`, `Đang đi tour`, `Đã hoàn thành`, `Đã hủy`).
  - Drawer chi tiết đơn đặt chỗ: Khi bấm xem chi tiết, mở modal trượt hiện đại hiển thị toàn bộ danh sách hành khách, vé điện tử QR Code, ngày khởi hành và tổng tiền.

---

### 2.8. Khắc phục triệt để lỗi trùng lặp Tour và Danh mục (Deduplication Engine)
- **Hiện tượng lỗi:** Khi người dùng xem trang chủ hoặc danh mục tour, xuất hiện 2 thẻ tour giống hệt nhau (ví dụ: *Phú Quốc Thiên Đường Đảo Ngọc* lặp lại 2 lần).
- **Nguyên nhân:** Hàm `GET /api/tours` trong `server/src/index.js` trước đây thực hiện gộp mảng dữ liệu mẫu và dữ liệu từ CSDL (`[...toursData, ...databaseTours]`). Do 4 tour mẫu đã được seed vào database, nên mỗi tour bị lặp lại 2 lần.
- **Biện pháp xử lý:**
  - Viết thuật toán Deduplication lọc tour trong [server/src/index.js](file:///d:/Projects/Travel-with-me/server/src/index.js#L526-L537):
    ```javascript
    if (databaseTours.length > 0) {
      const dbTitles = new Set(databaseTours.map((t) => (t.title || '').toLowerCase().trim()));
      const dbSlugs = new Set(databaseTours.map((t) => t.slug));
      const nonDuplicatedMock = toursData.filter(
        (m) => !dbTitles.has((m.title || '').toLowerCase().trim()) && !dbSlugs.has(m.slug)
      );
      results = [...databaseTours, ...nonDuplicatedMock];
    } else {
      results = [...toursData];
    }
    ```
  - Áp dụng tương tự cho danh mục tour `GET /api/categories` tại dòng 490–503.
  - **Kết quả:** Hệ thống hiển thị chính xác **5 tour độc bản**, không còn bất kỳ hiện tượng trùng lặp nào.

---

### 2.9. Sửa lỗi hiển thị & Cắt mép nút thao tác bảng Quản lý Đặt chỗ (Table Responsive & Actions)
- **Hiện tượng lỗi:** Tại bảng Quản lý Đặt Chỗ, cột cuối cùng "Thao tác" với các nút **"👁 Chi tiết"** bị ép sát vào lề phải và bị cắt cụt một nửa chữ do container bảng không hỗ trợ cuộn ngang trên các màn hình có độ phân giải vừa và nhỏ.
- **Biện pháp xử lý:**
  - Trong [client/src/App.css](file:///d:/Projects/Travel-with-me/client/src/App.css#L3616-L3646):
    - Cập nhật `.admin-table-container` và `.table-responsive`:
      ```css
      overflow-x: auto;
      overflow-y: visible;
      -webkit-overflow-scrolling: touch;
      ```
    - Đặt kích thước tối thiểu cho bảng `.admin-table`: `min-width: 1080px`.
    - Định dạng riêng cho cột cuối cùng:
      ```css
      .admin-table th:last-child,
      .admin-table td:last-child {
        text-align: center;
        white-space: nowrap;
        min-width: 120px;
        padding: 14px 20px;
      }
      ```
    - Thiết lập cho nút bấm `.btn-detail-action`: `white-space: nowrap; flex-shrink: 0; padding: 6px 14px;`.
  - **Kết quả:** Toàn bộ 18 nút "Chi tiết" hiển thị vuông vắn, tròn trịa, căn giữa ngay ngắn và không bao giờ bị cắt mép.

---

### 2.10. Tinh chỉnh Typography: Bỏ khung viền chữ Admin cạnh huy hiệu 1000 Elo
- **Hiện tượng lỗi:** Chữ **Admin** hiển thị bên cạnh huy hiệu `🏅 1000` ở góc dưới Sidebar và trên Navbar bị bao bọc bởi một ô vuông nền tím nhạt (`#f3e8ff`) và viền tím (`#d8b4fe`), tạo cảm giác thô ráp, không ăn nhập với nền tối của Sidebar.
- **Biện pháp xử lý:**
  - Trong [client/src/App.css](file:///d:/Projects/Travel-with-me/client/src/App.css#L4824-L4850):
    - Xóa bỏ hoàn toàn background, border, box-shadow và padding cho `.user-role-pill`:
      ```css
      .user-role-pill {
        display: inline-flex;
        align-items: center;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        border-radius: 0 !important;
      }
      ```
    - Định dạng chữ Admin trên nền Sidebar tối: Màu tím lilac thanh lịch (`#d8b4fe`), font-weight 800, không viền hộp.
    - Định dạng chữ Admin trên Navbar sáng: Màu tím đậm sang trọng (`#7e22ce`), không viền hộp.
  - **Kết quả:** Chữ "Admin" hiển thị dạng typography sắc sảo, tối giản, hài hòa tuyệt đối với giao diện.

---

## 3. BẢNG TỔNG HỢP CÁC FILE ĐÃ CHỈNH SỬA & BỔ SUNG MỚI

| STT | Tên File / Đường dẫn | Thao tác | Mô tả tóm tắt nội dung thay đổi |
| :---: | :--- | :---: | :--- |
| **1** | `client/src/components/Sidebar.jsx` | Tạo mới | Component thanh menu dọc bên trái, hỗ trợ đóng/mở thu gọn, hiển thị avatar, Elo và vai trò tài khoản. |
| **2** | `client/src/components/AdminDashboard.jsx` | Cập nhật lớn | Nối dữ liệu thực 100% từ SQL Server; tính toán doanh thu, biểu đồ 6 tháng, lọc trạng thái, Drawer chi tiết. |
| **3** | `client/src/components/AdminTourForm.jsx` | Cập nhật | Sửa lỗi `undefined.split`, hỗ trợ tạo và cập nhật tour, tải ảnh, thêm lịch trình theo ngày vào CSDL. |
| **4** | `client/src/App.jsx` | Cập nhật | Tích hợp Sidebar điều hướng, quản lý state `isSidebarOpen`, chặn thu phóng zoom tối đa 100%. |
| **5** | `client/src/App.css` | Cập nhật lớn | Bổ sung hệ thống CSS cho Sidebar, Admin Dashboard, sửa bảng cuộn ngang, bỏ khung chữ Admin, tối ưu responsive. |
| **6** | `client/index.html` | Cập nhật | Cấu hình thẻ meta viewport `maximum-scale=1.0, user-scalable=no` khóa tỷ lệ phóng to 100%. |
| **7** | `server/src/index.js` | Cập nhật lớn | Viết logic lọc trùng lặp tour/danh mục; bổ sung endpoint `POST /api/admin/tours`, `PATCH /api/admin/bookings/:id/status`. |
| **8** | `server/src/auth.js` | Cập nhật | Chuẩn hóa tài khoản admin `admin@travelwithme.vn` với mật khẩu `Admin@123456`, cấp quyền `SUPER_ADMIN`. |
| **9** | `server/sql/001_admin_tour_fields.sql` | Tạo mới | Script bổ sung cột dữ liệu mở rộng cho bảng `dbo.tours` và `dbo.tour_itineraries`. |
| **10** | `server/sql/002_seed_admin_bookings.sql` | Tạo mới | Script nạp 18 đơn đặt tour mẫu với đầy đủ trạng thái và ngày tháng vào SQL Server `dbo.bookings`. |
| **11** | `server/sql/003_seed_tours.js` | Tạo mới | Script đồng bộ và seed danh sách tour mẫu vào SQL Server với tiếng Việt chuẩn có dấu. |
| **12** | `README.md` | Cập nhật | Cập nhật hướng dẫn cài đặt mới, kiến trúc hệ thống và danh sách tính năng toàn diện v1.3.0. |

---

## 4. KẾT QUẢ KIỂM THỬ THỰC TẾ (TEST CASES)

| Mã kiểm thử | Kịch bản kiểm thử | Hành động & Dữ liệu đầu vào | Kết quả mong đợi | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| **TC-01** | **Khóa Zoom 100%** | Nhấn `Ctrl + '+'` hoặc cuộn chuột kèm phím `Ctrl` | Trình duyệt giữ nguyên tỷ lệ 100%, không bị vỡ giao diện | **ĐẠT (PASS)** |
| **TC-02** | **Đóng/Mở Sidebar** | Bấm nút chevron thu gọn trên Sidebar trái | Menu co lại còn 78px, nội dung trang dãn rộng mượt mà | **ĐẠT (PASS)** |
| **TC-03** | **Đăng nhập Admin** | Đăng nhập với `admin@travelwithme.vn` / `Admin@123456` | Đăng nhập thành công, tự động mở quyền truy cập Kênh Quản Trị | **ĐẠT (PASS)** |
| **TC-04** | **Bỏ khung chữ Admin** | Quan sát chữ "Admin" cạnh huy hiệu 1000 Elo | Chữ hiển thị màu tím lilac thanh lịch, không có ô vuông viền bao bọc | **ĐẠT (PASS)** |
| **TC-05** | **Kiểm tra trùng lặp Tour** | Truy cập trang chủ & danh mục tour | Mỗi tour hiển thị duy nhất 1 lần, tổng cộng 5 tour độc bản | **ĐẠT (PASS)** |
| **TC-06** | **Thống kê Dashboard thực tế** | Kiểm tra các chỉ số Doanh thu & Lượt đặt | Số liệu khớp 100% với các đơn hàng trong bảng `dbo.bookings` | **ĐẠT (PASS)** |
| **TC-07** | **Biểu đồ tăng trưởng 6 tháng** | Xem biểu đồ doanh thu các tháng từ 5/2026 đến 10/2026 | Biểu đồ tính toán đúng doanh thu từng tháng từ SQL Server | **ĐẠT (PASS)** |
| **TC-08** | **Đổi trạng thái đơn hàng** | Chuyển trạng thái 1 đơn từ `PENDING` sang `PAID` | SQL Server cập nhật ngay; doanh thu và biểu đồ tự động cộng thêm tiền | **ĐẠT (PASS)** |
| **TC-09** | **Hiển thị nút Chi tiết** | Kiểm tra cột cuối cùng bảng Quản lý Đặt Chỗ | Nút "👁 Chi tiết" hiển thị đầy đủ, không bị cắt mép, cuộn ngang mượt | **ĐẠT (PASS)** |
| **TC-10** | **Tạo tour mới từ Admin** | Mở form Thêm tour mới, điền lịch trình và lưu | Tour ghi nhận thành công vào SQL Server, xuất hiện trên danh mục | **ĐẠT (PASS)** |
| **TC-11** | **Đóng gói mã nguồn (Build)** | Chạy lệnh `npm run build` ở client | Biên dịch thành công 100% không cảnh báo lỗi (0 error) | **ĐẠT (PASS)** |

---

## 5. HƯỚNG DẪN VẬN HÀNH & TÀI KHOẢN MẪU

### Thông tin tài khoản thử nghiệm:
- **Tài khoản Quản trị cấp cao (Super Admin):**
  - **Email:** `admin@travelwithme.vn`
  - **Mật khẩu:** `Admin@123456`
  - **Quyền hạn:** Toàn quyền truy cập Kênh Quản Trị, cấu hình vai trò RBAC, quản lý tour, quản lý đơn đặt tour, xuất dữ liệu và đổi trạng thái.
- **Tài khoản Người dùng thông thường (Customer):**
  - **Email:** `user@travelwithme.vn` (hoặc đăng ký tài khoản mới bất kỳ)
  - **Mật khẩu:** `User@123456`
  - **Quyền hạn:** Đặt tour, quản lý lịch sử chuyến đi cá nhân, lưu tour yêu thích, xem vé điện tử.

### Khởi chạy môi trường phát triển:
```bash
# 1. Khởi chạy Backend Server (Cổng 5000)
cd server
npm install
npm run dev

# 2. Khởi chạy Frontend Client (Cổng 5173)
cd client
npm install
npm run dev
```

---
*Báo cáo được tổng hợp đầy đủ và xác thực nghiệm thu vào ngày 31/10/2026 - Dự án Travel With Me.*
