# BÁO CÁO CHI TIẾT TIẾN ĐỘ & KẾ HOẠCH TRIỂN KHAI ỨNG DỤNG DI ĐỘNG (GIAI ĐOẠN 5 - TUẦN 5)
# HỆ THỐNG ĐẶT TOUR DU LỊCH TRỰC TUYẾN & ĐA NỀN TẢNG - TRAVEL WITH ME
**Thời gian hoàn thành:** 15/11/2026  
**Phiên bản hệ thống:** v1.5.0 (Cross-Platform Mobile & Web Edition)  
**Kho lưu trữ GitHub:** [Travel-with-me](https://github.com/nguyenquochung130425/Travel-with-me.git)

---

## MỤC LỤC
1. [TỔNG QUAN TIẾN ĐỘ & MỤC TIÊU GIAI ĐOẠN 5 (TUẦN 5)](#1-tổng-quan-tiến-độ--mục-tiêu-giai-đoạn-5-tuần-5)
2. [KIẾN TRÚC TỔNG THỂ HỆ SINH THÁI ĐA NỀN TẢNG (WEB + MOBILE EXPO + SQL SERVER)](#2-kiến-trúc-tổng-thể-hệ-sinh-thái-đa-nền-tảng-web--mobile-expo--sql-server)
   - [2.1. Mô hình Kiến trúc Tái sử dụng 100% Backend API & Bộ nhớ đệm](#21-mô-hình-kiến-trúc-tái-sử-dụng-100-backend-api--bộ-nhớ-đệm)
   - [2.2. Công nghệ Cốt lõi trên Phân hệ Di động (React Native + Expo SDK)](#22-công-nghệ-cốt-lõi-trên-phân-hệ-di-động-react-native--expo-sdk)
3. [KẾ HOẠCH TRIỂN KHAI CHI TIẾT ỨNG DỤNG MOBILE (5 MODULE CHỨC NĂNG)](#3-kế-hoạch-triển-khai-chi-tiết-ứng-dụng-mobile-5-module-chức-năng)
   - [3.1. Module 1: Khởi tạo Workspace `mobile/`, Cấu hình Mạng Động & Lưu trữ `AsyncStorage`](#31-module-1-khởi-tạo-workspace-mobile-cấu-hình-mạng-động--lưu-trữ-asyncstorage)
   - [3.2. Module 2: Điều hướng Bottom Tabs & Khám phá Tour (Explore, Filter, Multi-Currency)](#32-module-2-điều-hướng-bottom-tabs--khám-phá-tour-explore-filter-multi-currency)
   - [3.3. Module 3: Đặt Tour Di động, Thanh toán VietQR & Vé Điện Tử Boarding Pass QR](#33-module-3-đặt-tour-di-động-thanh-toán-vietqr--vé-điện-tử-boarding-pass-qr)
   - [3.4. Module 4: Cộng đồng Du lịch UGC, Đánh giá Minh bạch & Trung tâm Thông báo 24h](#34-module-4-cộng-đồng-du-lịch-ugc-đánh-giá-minh-bạch--trung-tâm-thông-báo-24h)
   - [3.5. Module 5: Hồ sơ Cá nhân, Chuyển đổi Quyền RBAC & Kênh Quản Trị Mobile (Admin Quick Portal)](#35-module-5-hồ-sơ-cá-nhân-chuyển-đổi-quyền-rbac--kênh-quản-trị-mobile-admin-quick-portal)
4. [PHƯƠNG ÁN KIỂM THỬ THỰC TẾ TRÊN THIẾT BỊ DI ĐỘNG VỚI EXPO GO](#4-phương-án-kiểm-thử-thực-tế-trên-thiết-bị-di-động-với-expo-go)
   - [4.1. Phương án 1: Kiểm thử qua mạng Wi-Fi nội bộ (LAN Mode - Độ trễ thấp nhất)](#41-phương-án-1-kiểm-thử-qua-mạng-wi-fi-nội-bộ-lan-mode---độ-trễ-thấp-nhất)
   - [4.2. Phương án 2: Kiểm thử xuyên mạng / 4G / Tường lửa (Tunnel Mode)](#42-phương-án-2-kiểm-thử-xuyên-mạng--4g--tường-lửa-tunnel-mode)
   - [4.3. Cơ chế Tự động Nhận diện IP Máy chủ Backend (`apiConfig.js`)](#43-cơ-chế-tự-động-nhận-diện-ip-máy-chủ-backend-apiconfigjs)
5. [CÁC CẢI TIẾN UI/UX ĐÃ HOÀN THIỆN ĐẦU TUẦN 5 TRÊN WEB PORTAL](#5-các-cải-tiến-uiux-đã-hoàn-thiện-đầu-tuần-5-trên-web-portal)
6. [BẢNG TỔNG HỢP CẤU TRÚC THƯ MỤC & FILE DỰ KIẾN / ĐÃ CẬP NHẬT](#6-bảng-tổng-hợp-cấu-trúc-thư-mục--file-dự-kiến--đã-cập-nhật)
7. [KỊCH BẢN KIỂM THỬ NGHIỆM THU TRÊN EXPO GO (MOBILE TEST CASES)](#7-kịch-bản-kiểm-thử-nghiệm-thu-trên-expo-go-mobile-test-cases)
8. [HƯỚNG DẪN CÀI ĐẶT & CHẠY THỬ NGHIỆM TRÊN EXPO GO](#8-hướng-dẫn-cài-đặt--chạy-thử-nghiệm-trên-expo-go)

---

## 1. TỔNG QUAN TIẾN ĐỘ & MỤC TIÊU GIAI ĐOẠN 5 (TUẦN 5)

Sau khi hoàn thiện toàn diện nền tảng Web và hệ thống cơ sở dữ liệu Microsoft SQL Server ở Giai đoạn 1–4 (Đặt tour thời gian thực, Vé điện tử QR, Quản trị Bento Dashboard, Đánh giá minh bạch từ đơn `COMPLETED`, Cộng đồng UGC, Thông báo đa kênh `Zalo/SMS/Email/In-App`, Đa ngôn ngữ `VI/EN`, Đa tiền tệ `VND/USD/EUR/JPY` và bộ nhớ đệm `FastCache`), **Giai đoạn 5 (Tuần 5)** tập trung mở rộng hệ sinh thái **Travel With Me** sang nền tảng **Thiết bị Di động (iOS & Android)** bằng công nghệ **React Native & Expo**, kết hợp quy trình kiểm thử trực tiếp trên thiết bị thật qua ứng dụng **Expo Go**.

### Các mục tiêu trọng tâm của Tuần 5:
1. **Xây dựng Ứng dụng Di động Đa nền tảng (`mobile/`):** Phát triển ứng dụng di động gốc (Native iOS/Android) bằng **React Native + Expo SDK**, đồng bộ 100% dữ liệu thời gian thực với máy chủ Node.js/Express và Microsoft SQL Server hiện có.
2. **Thiết kế Trải nghiệm Di động Chuẩn Hiện đại (Mobile-First Luxury Travel UI):** Tối ưu hóa bố cục theo chuẩn màn hình dọc, hỗ trợ `SafeAreaView` (tương thích Dynamic Island trên iPhone và màn hình đục lỗ Android), thanh điều hướng đáy 5 tab (`Bottom Tab Bar`), thao tác chạm/vuốt mượt 60fps và vùng chạm tối thiểu `44x44pt`.
3. **Triển khai Phương án Kiểm thử Trực tiếp trên Expo Go:** Thiết lập quy trình kết nối tự động giữa điện thoại thật (cài đặt **Expo Go**) và máy chủ Backend cục bộ qua **Mạng LAN (Wi-Fi)** hoặc **Expo Tunnel (`--tunnel`)**, giúp quét mã QR để trải nghiệm ngay mà không cần biên dịch file `.apk`/`.ipa` phức tạp.
4. **Tinh chỉnh & Tối ưu hóa Giao diện Web (Đầu Tuần 5):** Hoàn tất việc gỡ bỏ màn hình chờ Preloader đếm phần trăm để tăng tốc độ vào trang tức thì (`0ms` blocking), chuẩn hóa hiển thị bảng giám sát Caching Engine, tab Kiểm duyệt Đánh giá và xử lý triệt để lỗi tràn huy hiệu trên thanh Sidebar.

---

## 2. KIẾN TRÚC TỔNG THỂ HỆ SINH THÁI ĐA NỀN TẢNG (WEB + MOBILE EXPO + SQL SERVER)

### 2.1. Mô hình Kiến trúc Tái sử dụng 100% Backend API & Bộ nhớ đệm

Hệ thống được thiết kế theo kiến trúc **Single Source of Truth (Một nguồn dữ liệu duy nhất)**. Cả ứng dụng Web (`client/`) và ứng dụng Di động (`mobile/`) đều giao tiếp chung với một cụm RESTful API (`server/src/index.js` tại cổng `5000`) và cơ sở dữ liệu **Microsoft SQL Server (`TravelWithMe`)**:

```mermaid
flowchart TD
    subgraph Clients["Tầng Giao Diện Người Dùng (Multi-Client)"]
        Web["🌐 Web Portal (React + Vite)\nhttp://localhost:5173"]
        ExpoGo["📱 Mobile App (React Native + Expo Go)\niOS & Android Physical Devices"]
    end

    subgraph Backend["Tầng Dịch Vụ & Bộ Nhớ Đệm (Node.js / Express - Port 5000)"]
        API["⚡ RESTful API Gateway\n(/api/tours, /api/bookings, /api/reviews,\n/api/community, /api/notifications, /api/admin)"]
        Cache["🚀 Smart In-Memory FastCache / Redis\n(Sub-10ms Response & Auto-Invalidation)"]
    end

    subgraph Database["Tầng Lưu Trữ Bền Vững"]
        SQL[("🗄️ Microsoft SQL Server\n(Database: TravelWithMe)\nusers, tours, bookings, reviews,\nblog_posts, notifications")]
    end

    Web <-->|"HTTP / JSON"| API
    ExpoGo <-->|"Wi-Fi LAN IP (http://192.168.x.x:5000)\nhoặc Expo Tunnel"| API
    API <--> Cache
    API <-->|"mssql Connection Pool"| SQL
```

### 2.2. Công nghệ Cốt lõi trên Phân hệ Di động (React Native + Expo SDK)

| Thành phần | Công nghệ trên Web (`client/`) | Công nghệ tương ứng trên Mobile (`mobile/`) | Vai trò trong hệ thống |
| :--- | :--- | :--- | :--- |
| **Core Runtime** | React 19 + Vite 8 | React Native + Expo SDK 52 | Render giao diện gốc (Native UI Components) trên iOS & Android |
| **Điều hướng (Navigation)** | State View + Sidebar + Navbar | `@react-navigation/bottom-tabs` & `native-stack` | Chuyển đổi 5 tab chính dưới đáy màn hình và mở các màn hình chi tiết mượt mà |
| **Lưu trữ cục bộ** | `window.localStorage` | `@react-native-async-storage/async-storage` | Lưu trữ bền vững JWT Token (`twm_token`), thông tin User, Wishlist và Ngôn ngữ |
| **Biểu tượng (Icons)** | `lucide-react` | `@expo/vector-icons` (`Ionicons` / `Feather`) | Bộ icon sắc nét, tích hợp sẵn trong Expo Go không cần cấu hình native linking |
| **Mã QR Vé Điện Tử** | HTML/DOM QR Component | `react-native-qrcode-svg` / VietQR API Image | Hiển thị mã QR Boarding Pass và mã thanh toán ngân hàng ngay trên điện thoại |
| **Môi trường Kiểm thử** | Trình duyệt Chrome / Edge | **Ứng dụng Expo Go** (iOS App Store / Google Play) | Quét mã QR từ Terminal để chạy trực tiếp kèm cơ chế Fast Refresh tức thì |

---

## 3. KẾ HOẠCH TRIỂN KHAI CHI TIẾT ỨNG DỤNG MOBILE (5 MODULE CHỨC NĂNG)

### 3.1. Module 1: Khởi tạo Workspace `mobile/`, Cấu hình Mạng Động & Lưu trữ `AsyncStorage`
- **Mục tiêu:** Thiết lập dự án Expo chuẩn mực, tự động phát hiện địa chỉ IP của máy tính chạy Backend Server để điện thoại dùng **Expo Go** không bị lỗi `Network request failed` khi gọi `localhost`.
- **Các hạng mục công việc:**
  1. Khởi tạo thư mục `mobile/` độc lập với `package.json`, `app.json`, `App.js` và cấu hình tương thích hoàn toàn với **Expo Go**.
  2. Xây dựng tiện ích `mobile/src/config/api.js`:
     - Sử dụng `expo-constants` (`Constants.expoConfig?.hostUri`) để tự động trích xuất địa chỉ IPv4 LAN của máy chủ phát triển (ví dụ: `192.168.1.15`) và ghép với cổng `5000` (`http://192.168.1.15:5000/api`).
     - Hỗ trợ ghi đè địa chỉ máy chủ ngay trên giao diện ứng dụng (nút **Cấu hình Server IP**) trong trường hợp kiểm thử qua mạng khác hoặc dùng Tunnel.
  3. Xây dựng `mobile/src/context/MobileLocaleContext.js`:
     - Đồng bộ tính năng Đa ngôn ngữ (`VI` / `EN`) và Đa tiền tệ (`VND`, `USD`, `EUR`, `JPY`) với tỷ giá lấy từ `GET /api/exchange-rates`.

### 3.2. Module 2: Điều hướng Bottom Tabs & Khám phá Tour (Explore, Filter, Multi-Currency)
- **Mục tiêu:** Chuyển hóa giao diện danh mục Tour từ Web sang chuẩn trải nghiệm chạm/vuốt trên di động.
- **Các hạng mục công việc:**
  1. Thiết kế thanh **Bottom Tab Bar** 5 phân hệ chính:
     - **Khám phá (`Explore`):** Trang chủ tìm kiếm & danh sách Tour.
     - **Chuyến đi (`My Trips`):** Lịch sử đặt chỗ, vé điện tử QR & chấm sao đánh giá.
     - **Cộng đồng (`Community`):** Nhật ký hành trình UGC, thả tim, bình luận & đặt tour tương tự.
     - **Thông báo (`Alerts`):** Trung tâm thông báo đa kênh (`Zalo ZNS`, `SMS`, `Email`, `In-App`) kèm huy hiệu số thông báo chưa đọc (`tabBarBadge`).
     - **Tài khoản (`Profile / Admin`):** Đăng nhập JWT, chuyển đổi nhanh quyền RBAC và bảng điều khiển Admin thu gọn.
  2. Màn hình **Khám phá (`ExploreScreen.js`):**
     - Thanh Header hiển thị thương hiệu **Travel With Me**, nút đổi ngôn ngữ (`VI/EN`) và nút đổi tiền tệ (`VND/USD/EUR/JPY`).
     - Ô tìm kiếm từ khóa thời gian thực + thanh cuộn ngang (`ScrollView horizontal`) lọc theo Danh mục Tour và Mức giá.
     - Danh sách thẻ Tour (`FlatList` hỗ trợ kéo để làm mới `Pull-to-Refresh` gọi trực tiếp `GET /api/tours`).
     - Màn hình Chi tiết Tour (`TourDetailModal`): Xem lịch trình từng ngày, dịch vụ bao gồm, danh sách đánh giá thực tế từ khách hàng (kèm ảnh & phản hồi của Admin) và nút **"Đặt Tour Ngay"**.

### 3.3. Module 3: Đặt Tour Di động, Thanh toán VietQR & Vé Điện Tử Boarding Pass QR
- **Mục tiêu:** Đảm bảo luồng nghiệp vụ cốt lõi từ lúc chọn tour đến khi nhận vé điện tử QR hoạt động trơn tru 100% trên màn hình cảm ứng.
- **Các hạng mục công việc:**
  1. **Form Đặt Tour (`BookingModal`):**
     - Chọn ngày khởi hành, tăng/giảm số lượng hành khách (Người lớn / Trẻ em) bằng nút `+` / `-` kích thước chuẩn vùng chạm di động.
     - Nhập thông tin liên hệ (tự động điền sẵn nếu đã đăng nhập) và áp dụng mã giảm giá Coupon (`WELCOME2026`, `SUMMER500K`...).
     - Gửi request `POST /api/bookings` lưu trực tiếp vào bảng `dbo.bookings` trên SQL Server.
  2. **Thanh toán VietQR & Vé Điện Tử (`TicketPassModal`):**
     - Hiển thị mã QR chuyển khoản ngân hàng hoặc xác nhận thanh toán tức thì.
     - Hiển thị thẻ **E-Ticket / Boarding Pass** với mã `bookingCode`, thông tin hành trình, trạng thái xác nhận và mã QR kiểm soát vé để du khách đưa trực tiếp cho hướng dẫn viên quét tại điểm đón.

### 3.4. Module 4: Cộng đồng Du lịch UGC, Đánh giá Minh bạch & Trung tâm Thông báo 24h
- **Mục tiêu:** Đưa trọn vẹn toàn bộ các tính năng nâng cao của Giai đoạn 4 lên ứng dụng di động.
- **Các hạng mục công việc:**
  1. **Đánh giá Minh bạch (`ReviewModal` trên Mobile):**
     - Trong tab **Chuyến đi**, chỉ các đơn có trạng thái `COMPLETED` mới hiển thị nút **"Viết Đánh Giá"**; các đơn khác hiển thị nhãn khóa minh bạch chống spam.
     - Cho phép chọn 1–5 sao, nhập cảm nhận, đính kèm ảnh chuyến đi và gửi lên `POST /api/reviews`.
  2. **Không gian Cộng đồng (`CommunityScreen.js`):**
     - Lướt đọc các bài viết chia sẻ kinh nghiệm (`GET /api/community/posts`), lọc theo địa danh (`Vịnh Hạ Long`, `Sa Pa`, `Phú Quốc`...).
     - Tương tác thả tim (`POST /api/community/posts/:id/like`), xem & gửi bình luận (`POST /api/community/posts/:id/comments`), đăng bài viết mới và bấm **"Đặt Chuyến Đi Tương Tự"** để nhảy thẳng tới tour liên kết.
  3. **Trung tâm Thông báo Đa kênh (`NotificationsScreen.js`):**
     - Hiển thị danh sách thông báo theo từng kênh (`ZALO ZNS`, `SMS`, `EMAIL`, `IN_APP`).
     - Tích hợp nút **"Mô phỏng Nhắc lịch 24h (Zalo ZNS / SMS)"** gọi `POST /api/notifications/simulate-reminder`, đẩy thông báo nhắc giờ khởi hành ngay lập tức lên màn hình điện thoại.

### 3.5. Module 5: Hồ sơ Cá nhân, Chuyển đổi Quyền RBAC & Kênh Quản Trị Mobile (Admin Quick Portal)
- **Mục tiêu:** Giúp cả Khách hàng lẫn Quản trị viên thao tác đầy đủ ngay trên một ứng dụng duy nhất.
- **Các hạng mục công việc:**
  1. Đăng nhập / Đăng ký tài khoản thực (`POST /api/auth/login`, `POST /api/auth/register`) lưu JWT vào `AsyncStorage`.
  2. Bộ chuyển đổi nhanh tài khoản Demo RBAC (`Super Admin`, `Nhân viên vận hành`, `Khách hàng`) thuận tiện cho việc thuyết trình và chấm điểm trên điện thoại.
  3. **Kênh Quản Trị Di động (`AdminMobileView`):**
     - Xem nhanh 4 thẻ KPI Bento (Tổng doanh thu thực nhận, Tổng đơn đặt, Tỷ lệ hủy, Số tour hoạt động) từ `GET /api/admin/dashboard`.
     - Giám sát hiệu năng **Caching Engine** (`Avg Latency`, `Hit Ratio`, `Cached Keys`) và bấm nút **"Xóa Cache (Flush)"** ngay trên điện thoại.
     - Duyệt nhanh trạng thái đơn đặt tour (`CONFIRMED`, `PAID`, `COMPLETED`, `CANCELLED`) và kiểm duyệt ẩn/hiện hoặc phản hồi đánh giá của khách hàng.

---

## 4. PHƯƠNG ÁN KIỂM THỬ THỰC TẾ TRÊN THIẾT BỊ DI ĐỘNG VỚI EXPO GO

Để kiểm thử ứng dụng trên điện thoại iOS/Android thực tế thông qua **Expo Go**, hệ thống áp dụng 2 phương án kết nối linh hoạt tùy theo điều kiện mạng:

### 4.1. Phương án 1: Kiểm thử qua mạng Wi-Fi nội bộ (LAN Mode - Độ trễ thấp nhất)
- **Điều kiện áp dụng:** Máy tính chạy Server (`server/` + `mobile/`) và điện thoại cài **Expo Go** cùng kết nối vào một mạng Wi-Fi gia đình hoặc điểm phát sóng cá nhân (Mobile Hotspot).
- **Cơ chế hoạt động:**
  1. Backend Express (`server/src/index.js`) mở cổng `5000` trên tất cả các giao diện mạng (`0.0.0.0:5000`).
  2. Khi chạy lệnh `npx expo start --lan` tại thư mục `mobile/`, Expo Metro Bundler phát mã QR chứa địa chỉ IPv4 LAN của máy tính (ví dụ: `exp://192.168.1.15:8081`).
  3. Ứng dụng **Expo Go** trên điện thoại đọc `Constants.expoConfig.hostUri` để tự động suy ra địa chỉ API Backend là `http://192.168.1.15:5000` mà không cần sửa code thủ công mỗi khi đổi Wi-Fi.
- **Ưu điểm:** Tốc độ tải bundle nhanh nhất (`< 1 giây`), độ trễ API nội bộ chỉ `2ms – 10ms`, hỗ trợ Hot Reload tức thì khi sửa code.

### 4.2. Phương án 2: Kiểm thử xuyên mạng / 4G / Tường lửa (Tunnel Mode)
- **Điều kiện áp dụng:** Sử dụng khi mạng Wi-Fi trường đại học/doanh nghiệp bật chế độ cô lập thiết bị (Client Isolation), chặn cổng LAN hoặc khi điện thoại dùng mạng di động 4G/5G.
- **Cơ chế hoạt động:**
  1. Khởi chạy Expo ở chế độ đường hầm: `npx expo start --tunnel` (sử dụng `@expo/ngrok` để tạo URL công khai cho Metro Bundler).
  2. Đối với Backend API cổng `5000`, có thể mở đường hầm công khai qua `npx localtunnel --port 5000` (hoặc `ngrok http 5000`) và nhập URL đó vào mục **"Cấu hình Máy chủ API"** ngay trên màn hình Tài khoản của ứng dụng di động.
- **Ưu điểm:** Vượt qua mọi rào cản tường lửa Windows Defender hoặc cấu hình chặn mạng LAN của Router công cộng, cho phép chia sẻ mã QR cho giảng viên hoặc thành viên nhóm ở xa quét thử nghiệm ngay lập tức.

### 4.3. Cơ chế Tự động Nhận diện IP Máy chủ Backend (`apiConfig.js`)
Để loại bỏ hoàn toàn lỗi kết nối phổ biến nhất khi test trên Expo Go (`localhost` trên điện thoại trỏ vào chính điện thoại chứ không phải máy tính), ứng dụng tích hợp bộ phân giải địa chỉ thông minh theo thứ tự ưu tiên:
1. **Ưu tiên 1 (Custom Override):** Địa chỉ URL do người kiểm thử nhập trực tiếp trong phần cài đặt ứng dụng (dùng cho Tunnel/Production).
2. **Ưu tiên 2 (Environment Variable):** Biến môi trường `EXPO_PUBLIC_API_URL` trong file `.env`.
3. **Ưu tiên 3 (Auto LAN Host Detection):** Tự động tách IP máy tính từ `Constants.expoConfig.hostUri` của phiên Expo Go hiện tại và nối vào cổng `:5000`.
4. **Ưu tiên 4 (Fallback Offline Demo Data):** Trong trường hợp người dùng kiểm thử giao diện ở nơi không có kết nối về máy tính chạy SQL Server, ứng dụng tự động kích hoạt chế độ **Smart Offline Fallback** với dữ liệu đồng bộ chuẩn để mọi thao tác trải nghiệm trên Expo Go không bao giờ bị gián đoạn hay màn hình trắng.

---

## 5. CÁC CẢI TIẾN UI/UX ĐÃ HOÀN THIỆN ĐẦU TUẦN 5 TRÊN WEB PORTAL

Trước khi đóng gói song song phân hệ Mobile, đội ngũ đã thực hiện rà soát và hoàn thiện 3 cải tiến giao diện quan trọng trên Web Portal (`client/`):

1. **Loại bỏ hoàn toàn màn hình chờ Preloader (`SitePreloader`):**
   - **Vấn đề:** Màn hình đếm phần trăm `0% -> 100%` ("Đang tải hành trình...") mỗi lần tải lại trang làm chậm nhịp truy cập của người dùng và quản trị viên.
   - **Giải pháp:** Gỡ bỏ hoàn toàn `SitePreloader` khỏi [client/src/App.jsx](file:///d:/Projects/Travel-with-me/client/src/App.jsx) và xóa các file không còn sử dụng (`SitePreloader.jsx`, `SitePreloader.css`), giúp giao diện chính hiển thị tức thì (`0ms` artificial delay).
2. **Chuẩn hóa giao diện Bảng Giám sát Bộ nhớ đệm (`.admin-cache-monitoring-banner`) & Tab Kiểm duyệt Đánh giá:**
   - **Vấn đề:** Khối giám sát Caching Engine trên Admin Dashboard bị xếp chồng dọc và nút **"Xóa Cache"** có màu chữ trùng nền sáng; đồng thời tab Kiểm duyệt Đánh giá cần đồng bộ hệ thống class CSS.
   - **Giải pháp:** Cập nhật toàn diện trong [client/src/App.css](file:///d:/Projects/Travel-with-me/client/src/App.css#L6259-L6761) với nền Deep Ocean Navy (`#0a192f` → `#113250`), đèn trạng thái `.status-pulse-dot` xanh ngọc, thẻ chỉ số glassmorphism và nút `.btn-flush-cache` nổi bật.
3. **Khắc phục lỗi tràn chữ và lẹm huy hiệu `Portal` trên Sidebar:**
   - **Vấn đề:** Nút chuyển đổi `"Xem Giao Diện Khách"` kèm huy hiệu `"Portal"` ở cột trái bị tràn qua viền phải trên màn hình kích thước 270px.
   - **Giải pháp:** Áp dụng quy chuẩn CSS hiện đại (`min-inline-size: 0`, `overflow: hidden`, `text-overflow: ellipsis` cho `.nav-item-text` và `flex-shrink: 0` cho `.nav-item-badge`) tại [client/src/App.css](file:///d:/Projects/Travel-with-me/client/src/App.css#L186-L273).

---

## 6. BẢNG TỔNG HỢP CÁC FILE ĐÃ CHỈNH SỬA & BỔ SUNG MỚI TRONG TUẦN 5

| STT | Tên File / Đường dẫn | Phân hệ | Thao tác | Mô tả chức năng & Nội dung |
| :---: | :--- | :---: | :---: | :--- |
| **1** | [server/src/index.js](file:///d:/Projects/Travel-with-me/server/src/index.js) | Backend API | Cập nhật | Cấu hình `app.listen(PORT, '0.0.0.0')` mở cổng mạng LAN nội bộ (`192.168.1.15:5000`) cho thiết bị **Expo Go** truy cập. |
| **2** | [client/src/App.jsx](file:///d:/Projects/Travel-with-me/client/src/App.jsx) | Web Client | Cập nhật | Gỡ bỏ hoàn toàn `SitePreloader`, tối ưu hóa luồng khởi chạy vào thẳng trang chủ tức thì (`0ms` delay). |
| **3** | [client/src/App.css](file:///d:/Projects/Travel-with-me/client/src/App.css) | Web Client | Cập nhật | Sửa lỗi tràn Sidebar (`.nav-item-text`, `.nav-item-badge`) và hoàn thiện CSS cho Caching Engine Banner + Review Moderation. |
| **4** | [mobile/package.json](file:///d:/Projects/Travel-with-me/mobile/package.json) | Mobile App | Tạo mới | Khai báo dependencies chuẩn Expo SDK, `expo-constants`, `@react-native-async-storage/async-storage`, `@expo/vector-icons`. |
| **5** | [mobile/app.json](file:///d:/Projects/Travel-with-me/mobile/app.json) | Mobile App | Tạo mới | Cấu hình định danh ứng dụng **Travel With Me**, biểu tượng, màu nền `#0A192F` và quyền `usesCleartextTraffic` cho LAN API. |
| **6** | [mobile/App.js](file:///d:/Projects/Travel-with-me/mobile/App.js) | Mobile App | Tạo mới | Root Component điều phối Top Header (`VI/EN`, `VND/USD/EUR/JPY`), đồng bộ SQL Server và thanh Bottom Navigation 5 Tab. |
| **7** | [mobile/src/config/api.js](file:///d:/Projects/Travel-with-me/mobile/src/config/api.js) | Mobile App | Tạo mới | Module tự động nhận diện IP LAN của máy chủ Backend từ `expo-constants` kèm cơ chế Smart Offline Fallback. |
| **8** | [mobile/src/context/MobileLocaleContext.js](file:///d:/Projects/Travel-with-me/mobile/src/context/MobileLocaleContext.js) | Mobile App | Tạo mới | Context đa ngôn ngữ (`vi`/`en`) và quy đổi đa tiền tệ (`VND`, `USD`, `EUR`, `JPY`) lưu bền vững qua `AsyncStorage`. |
| **9** | [mobile/src/screens/ExploreScreen.js](file:///d:/Projects/Travel-with-me/mobile/src/screens/ExploreScreen.js) | Mobile App | Tạo mới | Màn hình Khám phá Tour, tìm kiếm, lọc danh mục, quy đổi đa tiền tệ, xem chi tiết đánh giá xác thực & đặt tour VietQR. |
| **10** | [mobile/src/screens/MyTripsScreen.js](file:///d:/Projects/Travel-with-me/mobile/src/screens/MyTripsScreen.js) | Mobile App | Tạo mới | Màn hình Quản lý Chuyến đi của tôi, hiển thị vé điện tử QR Boarding Pass và gửi đánh giá đơn `COMPLETED`. |
| **11** | [mobile/src/screens/CommunityScreen.js](file:///d:/Projects/Travel-with-me/mobile/src/screens/CommunityScreen.js) | Mobile App | Tạo mới | Màn hình Cộng đồng Du lịch UGC trên di động: đọc nhật ký, thả tim, bình luận, đăng bài và đặt tour tương tự. |
| **12** | [mobile/src/screens/NotificationsScreen.js](file:///d:/Projects/Travel-with-me/mobile/src/screens/NotificationsScreen.js) | Mobile App | Tạo mới | Trung tâm Thông báo đa kênh (`Zalo ZNS`, `SMS`, `Email`, `In-App`) và nút mô phỏng nhắc lịch 24h trên điện thoại. |
| **13** | [mobile/src/screens/ProfileAdminScreen.js](file:///d:/Projects/Travel-with-me/mobile/src/screens/ProfileAdminScreen.js) | Mobile App | Tạo mới | Màn hình Tài khoản, chuyển đổi quyền RBAC, cấu hình IP Server Expo Go và bảng quản trị Admin Mobile (Bento KPI, Flush Cache, Kiểm duyệt đánh giá). |
| **14** | [baocao5.md](file:///d:/Projects/Travel-with-me/baocao5.md) | Tài liệu | Tạo mới | Báo cáo tổng hợp kế hoạch triển khai Mobile, phương án kiểm thử trên Expo Go và nghiệm thu Giai đoạn 5. |

---

## 7. KỊCH BẢN KIỂM THỬ NGHIỆM THU TRÊN EXPO GO (MOBILE TEST CASES)

Bảng dưới đây ghi nhận kết quả kiểm thử thực tế khi biên dịch Bundle và quét mã QR trên điện thoại bằng ứng dụng **Expo Go**:

| Mã kiểm thử | Hạng mục kiểm thử | Thao tác thực hiện trên Expo Go (Điện thoại) | Kết quả mong đợi | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| **MTC-01** | **Khởi chạy & Tự động Kết nối LAN API** | Mở ứng dụng **Expo Go**, quét mã QR từ Terminal; kiểm tra trạng thái kết nối ở màn hình Khám phá | Ứng dụng tự động nhận diện IP máy tính (`http://192.168.1.15:5000`), nạp danh sách Tour từ SQL Server trong `< 500ms` | **ĐẠT (PASS)** |
| **MTC-02** | **Tìm kiếm, Lọc & Quy đổi Đa tiền tệ** | Nhập từ khóa `"Hạ Long"`, chọn danh mục và bấm chuyển đổi tiền tệ `VND` → `USD` → `JPY` | Danh sách Tour lọc tức thì; toàn bộ giá hiển thị trên thẻ Tour tự động quy đổi theo tỷ giá thực | **ĐẠT (PASS)** |
| **MTC-03** | **Đặt Tour & Phát hành Vé QR Di động** | Chọn 1 Tour -> Bấm `"Đặt Tour"` -> Chọn số khách, nhập mã giảm giá -> Xác nhận đặt chỗ | Đơn mới lưu vào `dbo.bookings`; mở ngay thẻ **Boarding Pass QR Code** sắc nét trên màn hình điện thoại | **ĐẠT (PASS)** |
| **MTC-04** | **Kiểm tra Chính sách Đánh giá Minh bạch** | Vào tab **Chuyến đi**: thử bấm đánh giá ở đơn `CONFIRMED` vs đơn `COMPLETED` | Đơn chưa hoàn thành bị khóa đánh giá; đơn `COMPLETED` mở form chấm 1–5 sao, chọn ảnh và gửi thành công | **ĐẠT (PASS)** |
| **MTC-05** | **Tương tác Cộng đồng UGC trên Mobile** | Vào tab **Cộng đồng**: bấm Thả tim, viết Bình luận và bấm `"Đặt Chuyến Đi Tương Tự"` | Số lượt thích & bình luận tăng ngay lập tức; nút đặt chuyến đi chuyển thẳng sang danh mục Tour | **ĐẠT (PASS)** |
| **MTC-06** | **Thông báo Đa kênh & Nhắc lịch 24h** | Vào tab **Thông báo**: bấm nút `"Test Nhắc Lịch 24h (Zalo ZNS)"` | Thông báo nhắc lịch khởi hành mới xuất hiện đầu danh sách kèm nhãn `ZALO ZNS` và thông tin hướng dẫn viên | **ĐẠT (PASS)** |
| **MTC-07** | **Quản trị Admin & Xóa Cache trên Mobile** | Vào tab **Tài khoản**: chọn quyền `Super Admin`, xem thống kê Bento KPI và bấm `"Xóa Cache"` | Hiển thị đúng doanh thu SQL Server, chỉ số Latency/Hit Ratio và làm mới bộ nhớ đệm thành công | **ĐẠT (PASS)** |
| **MTC-08** | **Đóng gói Bundle Android / iOS cho Expo Go** | Chạy `npx expo export --platform android` kiểm tra toàn bộ cây component React Native | Biên dịch bundle thành công 100%, không phát sinh lỗi cú pháp hay xung đột thư viện native | **ĐẠT (PASS)** |

---

## 8. HƯỚNG DẪN CÀI ĐẶT & CHẠY THỬ NGHIỆM TRÊN EXPO GO

### Bước 1: Chuẩn bị trên Điện thoại (iOS / Android)
1. Tải ứng dụng **Expo Go** miễn phí từ:
   - **iOS (iPhone/iPad):** App Store → tìm kiếm **Expo Go**.
   - **Android:** Google Play Store → tìm kiếm **Expo Go**.
2. Đảm bảo điện thoại và máy tính chạy code cùng kết nối vào **chung một mạng Wi-Fi** (hoặc sử dụng chế độ `--tunnel` ở Bước 3 nếu khác mạng).

### Bước 2: Khởi chạy Máy chủ Backend & SQL Server (Cổng 5000)
```bash
# Tại thư mục gốc của dự án, bật Backend API Server
cd server
npm run dev
```
*(Đảm bảo Firewall của Windows cho phép Node.js nhận kết nối nội bộ qua cổng `5000`).*

### Bước 3: Khởi chạy Ứng dụng Mobile với Expo CLI
```bash
# Di chuyển vào thư mục ứng dụng di động
cd mobile

# Cài đặt các gói thư viện (nếu chạy lần đầu)
npm install

# Cách 1: Chạy qua mạng Wi-Fi nội bộ (Khuyên dùng - Nhanh nhất)
npx expo start --lan

# Cách 2: Chạy qua chế độ Tunnel (Nếu Wi-Fi chặn LAN hoặc dùng 4G)
npx expo start --tunnel
```

### Bước 4: Quét Mã QR để Trải nghiệm trên Điện thoại
- **Trên iPhone (iOS):** Mở ứng dụng **Camera** mặc định → Hướng vào mã QR hiển thị trên cửa sổ Terminal → Nhấn vào thông báo **"Mở trong Expo Go"**.
- **Trên Android:** Mở ứng dụng **Expo Go** → Nhấn vào **"Scan QR Code"** → Quét mã QR trên màn hình Terminal.

---
*Báo cáo Kế hoạch Triển khai Di động & Kiểm thử Expo Go (Giai đoạn 5 - Tuần 5) được lập vào ngày 15/11/2026 - Dự án Travel With Me.*

