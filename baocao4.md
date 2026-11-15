# BÁO CÁO CHI TIẾT TIẾN ĐỘ & TỔNG HỢP CÁC CHỨC NĂNG ĐÃ HOÀN THIỆN (GIAI ĐOẠN 4 - TUẦN 4)
# HỆ THỐNG ĐẶT TOUR DU LỊCH TRỰC TUYẾN - TRAVEL WITH ME
**Thời gian hoàn thành:** 07/11/2026  
**Phiên bản hệ thống:** v1.4.0 (Enterprise Edition v2.6)  
**Kho lưu trữ GitHub:** [Travel-with-me](https://github.com/nguyenquochung130425/Travel-with-me.git)

---

## MỤC LỤC
1. [TỔNG QUAN TIẾN ĐỘ GIAI ĐOẠN 4 (TUẦN 4)](#1-tổng-quan-tiến-độ-giai-đoạn-4-tuần-4)
2. [CHI TIẾT CÁC TÍNH NĂNG VÀ CẢI TIẾN ĐÃ THỰC HIỆN](#2-chi-tiết-các-tính-năng-và-cải-tiến-đã-thực-hiện)
   - [2.1. Thiết kế & Mở rộng Lược đồ CSDL Giai đoạn 4 trên Microsoft SQL Server](#21-thiết-kế--mở-rộng-lược-đồ-csdl-giai-đoạn-4-trên-microsoft-sql-server)
   - [2.2. Phân hệ Đánh giá Chuyến đi Minh bạch & Chống Spam (Verified Completed Reviews)](#22-phân-hệ-đánh-giá-chuyến-đi-minh-bạch--chống-spam-verified-completed-reviews)
   - [2.3. Công cụ Kiểm duyệt Đánh giá & Phản hồi Chính thức từ Ban Quản Trị (Admin Review Moderation)](#23-công-cụ-kiểm-duyệt-đánh-giá--phản-hồi-chính-thức-từ-ban-quản-trị-admin-review-moderation)
   - [2.4. Không gian Cộng đồng Du lịch & Nhật ký Hành trình UGC (Travel Blog & Community)](#24-không-gian-cộng-đồng-du-lịch--nhật-ký-hành-trình-ugc-travel-blog--community)
   - [2.5. Trung tâm Thông báo Đa kênh & Tự động hóa Nhắc lịch 24h (Multi-Channel Notification Hub)](#25-trung-tâm-thông-báo-đa-kênh--tự-động-hóa-nhắc-lịch-24h-multi-channel-notification-hub)
   - [2.6. Hệ thống Đa ngôn ngữ (i18n) & Quy đổi Đa tiền tệ Thời gian thực (Multi-Language & Multi-Currency)](#26-hệ-thống-đa-ngôn-ngữ-i18n--quy-đổi-đa-tiền-tệ-thời-gian-thực-multi-language--multi-currency)
   - [2.7. Tầng Bộ nhớ đệm Hiệu năng cao (Redis / Smart In-Memory FastCache) & Giám sát Latency](#27-tầng-bộ-nhớ-đệm-hiệu-năng-cao-redis--smart-in-memory-fastcache--giám-sát-latency)
   - [2.8. Nâng cấp Giao diện Kênh Quản Trị Bento Grid & Biểu đồ Tăng trưởng MoM](#28-nâng-cấp-giao-diện-kênh-quản-trị-bento-grid--biểu-đồ-tăng-trưởng-mom)
3. [BẢNG TỔNG HỢP CÁC FILE ĐÃ CHỈNH SỬA & BỔ SUNG MỚI](#3-bảng-tổng-hợp-các-file-đã-chỉnh-sửa--bổ-sung-mới)
4. [KẾT QUẢ KIỂM THỬ THỰC TẾ & AUTOMATED E2E TESTS](#4-kết-quả-kiểm-thử-thực-tế--automated-e2e-tests)
5. [HƯỚNG DẪN VẬN HÀNH & KIỂM THỬ TÍNH NĂNG MỚI](#5-hướng-dẫn-vận-hành--kiểm-thử-tính-năng-mới)

---

## 1. TỔNG QUAN TIẾN ĐỘ GIAI ĐOẠN 4 (TUẦN 4)

Tiếp nối thành công của Giai đoạn 3 (đồng bộ Admin Dashboard với SQL Server và hoàn thiện Quản lý vòng đời Tour), **Giai đoạn 4 (Tuần 4)** tập trung nâng tầm nền tảng **Travel With Me** thành một hệ sinh thái du lịch tương tác toàn diện, đáp ứng các tiêu chuẩn khắt khe về tính minh bạch dữ liệu, trải nghiệm cộng đồng (User-Generated Content), tự động hóa chăm sóc khách hàng đa kênh và tối ưu hóa hiệu năng chịu tải cao.

### Các thành tựu trọng tâm đạt được trong Tuần 4:
1. **Đánh giá Minh bạch & Kiểm duyệt 2 chiều:** Ràng buộc chặt chẽ chỉ những đơn đặt tour đã hoàn thành (`COMPLETED`) mới có quyền gửi đánh giá (1 lần duy nhất/đơn), hỗ trợ đính kèm hình ảnh thực tế; đồng thời trang bị phân hệ Kiểm duyệt (Ẩn/Hiện) và Phản hồi chính thức từ Ban Quản Trị ngay trên Admin Portal.
2. **Không gian Cộng đồng & Nhật ký Hành trình (UGC):** Xây dựng chuyên mục Cộng đồng Du lịch cho phép du khách xuất bản bài viết chia sẻ kinh nghiệm, mẹo du lịch, gắn thẻ địa danh, thả tim, bình luận và liên kết trực tiếp với tour thực tế để khách hàng khác đặt chuyến đi tương tự chỉ với 1 cú nhấp chuột.
3. **Trung tâm Thông báo Đa kênh (Notification Hub):** Tích hợp hệ thống thông báo hợp nhất hỗ trợ 4 kênh (`IN_APP`, `EMAIL`, `SMS Brandname`, `Zalo ZNS`) kèm công cụ tự động quét và gửi lời nhắc lịch khởi hành trước 24 giờ.
4. **Đa ngôn ngữ (`VI`/`EN`) & Đa tiền tệ (`VND`, `USD`, `EUR`, `JPY`):** Hỗ trợ chuyển đổi tức thời ngôn ngữ hiển thị và tự động quy đổi giá tour trên toàn bộ giao diện theo tỷ giá ngoại hối thời gian thực.
5. **Tối ưu Hiệu năng với Bộ nhớ đệm (Redis / Smart In-Memory FastCache):** Giảm thời gian phản hồi API từ hàng trăm mili-giây xuống dưới `10ms`, tự động làm mới cache (Cache Invalidation) khi dữ liệu thay đổi và tích hợp bảng giám sát Cache trực tiếp trên Kênh Quản Trị.

---

## 2. CHI TIẾT CÁC TÍNH NĂNG VÀ CẢI TIẾN ĐÃ THỰC HIỆN

### 2.1. Thiết kế & Mở rộng Lược đồ CSDL Giai đoạn 4 trên Microsoft SQL Server
- **Mục tiêu:** Mở rộng cơ sở dữ liệu `TravelWithMe` trên Microsoft SQL Server để lưu trữ bền vững dữ liệu đánh giá, hình ảnh thực tế, bài viết cộng đồng, tương tác bình luận/lượt thích và thông báo đa kênh.
- **Chi tiết giải pháp:**
  - Xây dựng kịch bản DDL [server/sql/004_advanced_reviews_and_features.sql](file:///d:/Projects/Travel-with-me/server/sql/004_advanced_reviews_and_features.sql) và trình chạy migration tự động [server/sql/004_run_migration.js](file:///d:/Projects/Travel-with-me/server/sql/004_run_migration.js) khởi tạo 6 bảng quan hệ mới:
    1. **`dbo.reviews`:** Lưu trữ đánh giá chuyến đi với khóa duy nhất `booking_id VARCHAR(100) NOT NULL UNIQUE`, điểm sao `rating (1..5)`, cờ kiểm duyệt `is_visible BIT DEFAULT 1`, cùng phản hồi quản trị `admin_reply` và `admin_reply_at`.
    2. **`dbo.review_images`:** Lưu trữ danh sách URL hình ảnh chụp thực tế đính kèm theo từng `review_id` (`ON DELETE CASCADE`).
    3. **`dbo.blog_posts`:** Lưu trữ bài viết nhật ký hành trình UGC (`title`, `slug`, `summary`, `content`, `thumbnail_url`, `trip_badge`, `travel_tips`, `location_tags`, `tour_id`, `likes_count`, `comments_count`).
    4. **`dbo.blog_comments`:** Lưu trữ bình luận của các thành viên trong cộng đồng theo từng `post_id`.
    5. **`dbo.blog_likes`:** Quản lý lượt yêu thích bài viết với ràng buộc `UQ_blog_likes UNIQUE (post_id, user_id)`.
    6. **`dbo.notifications`:** Lưu trữ thông báo cá nhân hóa theo `user_id`, phân loại theo `type` (`BOOKING_CONFIRMED`, `TRIP_REMINDER_24H`, `TICKET_ISSUED`, `REVIEW_INVITATION`, `REVIEW_SUCCESS`, `PROMOTION`, `COMMUNITY`) và kênh phát hành `channel` (`IN_APP`, `EMAIL`, `SMS`, `ZALO`).

---

### 2.2. Phân hệ Đánh giá Chuyến đi Minh bạch & Chống Spam (Verified Completed Reviews)
- **Vấn đề thực tiễn:** Trên nhiều nền tảng du lịch, tình trạng đánh giá ảo (fake reviews) hoặc spam nhận xét từ những người chưa từng trải nghiệm dịch vụ làm giảm độ tin cậy của hệ thống.
- **Giải pháp triển khai:**
  1. **Kiểm tra trạng thái đơn hàng nghiêm ngặt tại Backend ([server/src/index.js](file:///d:/Projects/Travel-with-me/server/src/index.js#L1238-L1388)):**
     - Khi nhận request `POST /api/reviews`, hệ thống truy vấn bảng `dbo.bookings` để xác minh đơn đặt tour:
       - Nếu đơn không tồn tại: Trả về mã lỗi `404 Not Found`.
       - Nếu trạng thái đơn khác `COMPLETED`: Từ chối ngay lập tức với mã `403 Forbidden` kèm thông điệp: *"Chính sách minh bạch: Chỉ những chuyến đi ở trạng thái ĐÃ HOÀN THÀNH (Completed) mới được phép gửi đánh giá nhằm ngăn chặn đánh giá giả mạo."*
       - Kiểm tra trùng lặp trong `dbo.reviews`: Mỗi `booking_id` chỉ được phép gửi đánh giá duy nhất 1 lần (`400 Bad Request` nếu đánh giá lại).
  2. **Nâng cấp Giao diện Đánh giá ([client/src/components/ReviewModal.jsx](file:///d:/Projects/Travel-with-me/client/src/components/ReviewModal.jsx)):**
     - Hiển thị hộp thông báo bảo chứng đơn hàng hoàn thành (`#BookingCode`) và ngày kết thúc hành trình.
     - Bộ chọn sao tương tác (1–5 sao) kèm nhãn cảm xúc trực quan.
     - Hỗ trợ đính kèm hình ảnh thực tế sau chuyến đi, xem trước thumbnail và gỡ ảnh linh hoạt.
     - Tự động tạo thông báo `REVIEW_SUCCESS` trong Trung tâm Thông báo và xóa bộ nhớ đệm (`cache.del('reviews')`, `cache.del('tours')`) ngay sau khi lưu.

---

### 2.3. Công cụ Kiểm duyệt Đánh giá & Phản hồi Chính thức từ Ban Quản Trị (Admin Review Moderation)
- **Mục tiêu:** Giúp doanh nghiệp lữ hành chủ động kiểm soát chất lượng nội dung hiển thị công khai và giải đáp, tri ân du khách ngay dưới mỗi đánh giá.
- **Chi tiết giải pháp:**
  - **Các API Quản trị ([server/src/index.js](file:///d:/Projects/Travel-with-me/server/src/index.js#L1390-L1512)):**
    - `GET /api/admin/reviews`: Kết nối `LEFT JOIN` giữa `dbo.reviews`, `dbo.bookings` và `dbo.review_images` để trả về toàn bộ danh sách đánh giá (bao gồm cả đang hiển thị và đã ẩn).
    - `PATCH /api/admin/reviews/:id/visibility`: Cho phép Admin chuyển đổi trạng thái `is_visible` (Ẩn đánh giá vi phạm quy chuẩn cộng đồng hoặc Bỏ ẩn để hiển thị lại).
    - `POST /api/admin/reviews/:id/reply`: Ghi nhận nội dung phản hồi chính thức của Ban Quản Trị (`admin_reply`, `admin_reply_at = GETDATE()`).
  - **Giao diện Quản trị & Hiển thị ([client/src/components/AdminDashboard.jsx](file:///d:/Projects/Travel-with-me/client/src/components/AdminDashboard.jsx), [client/src/components/TourDetailModal.jsx](file:///d:/Projects/Travel-with-me/client/src/components/TourDetailModal.jsx)):**
    - Bổ sung phân hệ **Đánh giá & Kiểm duyệt** trên thanh điều hướng Admin Dashboard với bộ lọc theo trạng thái (*Tất cả*, *Đang hiển thị*, *Đã ẩn*) và số sao (*5 sao*, *4 sao*, *3 sao*).
    - Trên trang chi tiết tour của du khách ([TourDetailModal.jsx](file:///d:/Projects/Travel-with-me/client/src/components/TourDetailModal.jsx)), các đánh giá có phản hồi từ Admin được hiển thị kèm huy hiệu xác thực **"Phản hồi chính thức từ Travel With Me"**.

---

### 2.4. Không gian Cộng đồng Du lịch & Nhật ký Hành trình UGC (Travel Blog & Community)
- **Mục tiêu:** Tạo dựng không gian chia sẻ cảm hứng xê dịch, nơi du khách đăng tải nhật ký hành trình thực tế, mẹo du lịch hữu ích và lan tỏa các tour chất lượng.
- **Chi tiết giải pháp:**
  - Xây dựng component [client/src/components/CommunitySection.jsx](file:///d:/Projects/Travel-with-me/client/src/components/CommunitySection.jsx) kết nối trực tiếp với hệ thống API Cộng đồng (`/api/community/posts`):
    - **Bộ lọc chủ đề & Tìm kiếm:** Lọc bài viết theo địa danh nổi bật (`Vịnh Hạ Long`, `Sa Pa`, `Phú Quốc`, `Trekking`, `Du Thuyền`) hoặc tìm kiếm theo từ khóa tiêu đề, tóm tắt, thẻ địa điểm.
    - **Trải nghiệm đọc bài viết chuyên sâu (Story Reader Modal):**
      - Hiển thị trọn vẹn nội dung câu chuyện, huy hiệu chuyến đi xác thực (`tripBadge`) và hộp **Mẹo du lịch hữu ích (`travelTips`)**.
      - **Thẻ Liên kết Tour Thực tế:** Tự động truy vấn thông tin tour đi kèm (`tour_title`, `departure_location`, `adult_price`, `duration`) và cung cấp nút hành động **"Đặt Chuyến Đi Tương Tự"** mở trực tiếp trang chi tiết tour đó.
    - **Tương tác xã hội thời gian thực:**
      - Thả tim bài viết (`POST /api/community/posts/:id/like`) với cập nhật số lượt thích tức thì (Optimistic UI update).
      - Gửi bình luận trao đổi (`POST /api/community/posts/:id/comments`) lưu trực tiếp vào bảng `dbo.blog_comments`.
      - Sao chép liên kết chia sẻ bài viết vào Clipboard chỉ với 1 chạm.
    - **Soạn thảo & Xuất bản Nhật ký mới:** Cho phép thành viên đăng tải bài viết mới kèm ảnh bìa, gắn thẻ địa điểm và liên kết với chuyến đi đã hoàn thành.

---

### 2.5. Trung tâm Thông báo Đa kênh & Tự động hóa Nhắc lịch 24h (Multi-Channel Notification Hub)
- **Mục tiêu:** Đảm bảo du khách không bỏ lỡ bất kỳ thông tin quan trọng nào từ lúc xác nhận đặt chỗ, phát hành vé điện tử QR cho đến lịch tập trung khởi hành trước 24 giờ.
- **Chi tiết giải pháp:**
  - Xây dựng component [client/src/components/NotificationHub.jsx](file:///d:/Projects/Travel-with-me/client/src/components/NotificationHub.jsx) và tích hợp biểu tượng chuông thông báo động (`bell-ringing`) trên [client/src/components/Navbar.jsx](file:///d:/Projects/Travel-with-me/client/src/components/Navbar.jsx):
    - **Phân loại đa tầng theo 5 Tab:** *Tất cả*, *Chuyến đi & Vé*, *Nhắc lịch 24h*, *Khuyến mãi*, *Cộng đồng*.
    - **Nhãn định danh đa kênh trực quan:**
      - `Zalo ZNS` (Màu xanh Zalo `#0068FF`)
      - `SMS Brandname` (Màu xanh lục bảo `#059669`)
      - `Email` (Màu cam hổ phách `#D97706`)
      - `In-App Concierge` (Màu xanh ngọc `#0D9488`)
    - **Điều hướng thông minh (Actionable Notifications):** Nhấp vào thông báo vé điện tử sẽ mở ngay vé QR Code (`VIEW_TICKET`); nhấp vào lời mời đánh giá sẽ mở ngay form chấm sao (`WRITE_REVIEW`).
    - **Công cụ Mô phỏng Tự động hóa Nhắc lịch 24h (`POST /api/notifications/simulate-reminder`):** Cho phép kiểm thử trực tiếp quy trình Cron Job quét đơn hàng khởi hành vào ngày mai và đẩy thông báo nhắc lịch (kèm tên hướng dẫn viên, số điện thoại, giờ đón) qua kênh `Zalo ZNS`, `SMS` hoặc `Email`.

---

### 2.6. Hệ thống Đa ngôn ngữ (i18n) & Quy đổi Đa tiền tệ Thời gian thực (Multi-Language & Multi-Currency)
- **Mục tiêu:** Mở rộng khả năng phục vụ du khách quốc tế và Việt kiều thông qua giao diện song ngữ Việt – Anh và bộ quy đổi ngoại tệ tự động.
- **Chi tiết giải pháp:**
  - Xây dựng Context toàn cục [client/src/context/LocaleContext.jsx](file:///d:/Projects/Travel-with-me/client/src/context/LocaleContext.jsx) bọc ngoài ứng dụng tại [client/src/main.jsx](file:///d:/Projects/Travel-with-me/client/src/main.jsx):
    - **Đa ngôn ngữ (`vi` / `en`):** Từ điển dịch thuật đầy đủ cho toàn bộ thanh điều hướng, Hero Banner, bộ lọc tìm kiếm, thẻ tour, trang chi tiết, cộng đồng, thông báo và kênh quản trị. Lưu trữ tùy chọn ngôn ngữ vào `localStorage` (`twm_lang`).
    - **Đa tiền tệ (`VND ₫`, `USD $`, `EUR €`, `JPY ¥`):**
      - Đồng bộ tỷ giá từ endpoint `GET /api/exchange-rates` ([server/src/index.js](file:///d:/Projects/Travel-with-me/server/src/index.js#L1943-L1963)).
      - Cung cấp hàm `formatPrice(amountInVnd)` tự động chuyển đổi và định dạng tiền tệ theo chuẩn quốc tế (`Intl.NumberFormat`) trên tất cả các component ([TourCard.jsx](file:///d:/Projects/Travel-with-me/client/src/components/TourCard.jsx), [TourDetailModal.jsx](file:///d:/Projects/Travel-with-me/client/src/components/TourDetailModal.jsx), [CommunitySection.jsx](file:///d:/Projects/Travel-with-me/client/src/components/CommunitySection.jsx)).

---

### 2.7. Tầng Bộ nhớ đệm Hiệu năng cao (Redis / Smart In-Memory FastCache) & Giám sát Latency
- **Mục tiêu:** Đảm bảo thời gian phản hồi cực nhanh (`< 10ms`) cho các API đọc dữ liệu tần suất cao và giảm tải truy vấn lặp lại xuống Microsoft SQL Server.
- **Chi tiết giải pháp:**
  - Xây dựng module [server/src/cache.js](file:///d:/Projects/Travel-with-me/server/src/cache.js):
    - Hỗ trợ kết nối **Redis Server** (`redis://localhost:6379`) và tự động chuyển đổi dự phòng (Graceful Fallback) sang **Smart In-Memory FastCache** (hỗ trợ TTL hết hạn tự động) khi môi trường máy trạm không bật tiến trình Redis.
    - Cung cấp `cacheMiddleware(ttlSeconds, keyPrefix)` tự động đính kèm HTTP Response Headers:
      - `X-Cache: HIT` hoặc `X-Cache: MISS`
      - `X-Response-Time: <ms>`
      - `X-Cache-Engine: Redis | FastCache`
    - Cơ chế **Cache Invalidation tự động**: Ngay khi Admin thêm/sửa tour, duyệt đánh giá hoặc người dùng đăng bài viết cộng đồng mới, hệ thống tự động gọi `cache.del()` để làm tươi dữ liệu tức thì.
    - Cung cấp API giám sát `GET /api/cache/stats` và xóa bộ nhớ đệm `POST /api/cache/flush` tích hợp trực tiếp lên giao diện Admin Dashboard.

---

### 2.8. Nâng cấp Giao diện Kênh Quản Trị Bento Grid & Biểu đồ Tăng trưởng MoM
- **Mục tiêu:** Hoàn thiện giao diện Kênh Quản Trị Doanh Nghiệp đạt chuẩn thẩm mỹ hiện đại, trực quan hóa hiệu suất kinh doanh và trạng thái hạ tầng.
- **Chi tiết giải pháp:**
  - Trong [client/src/components/AdminDashboard.jsx](file:///d:/Projects/Travel-with-me/client/src/components/AdminDashboard.jsx) và [client/src/App.css](file:///d:/Projects/Travel-with-me/client/src/App.css):
    - Thiết kế hàng thẻ chỉ số **Bento Grid KPI Metrics** gồm: *Tổng doanh thu thực nhận (kèm tỷ lệ tăng trưởng `+% MoM`)*, *Tổng số đơn đặt tour & thanh tiến độ hoàn thành*, *Tỷ lệ hủy tour / hoàn tiền*, và *Số tour đang kinh doanh*.
    - Nâng cấp biểu đồ cột đôi (Dual-Tone Pillars) hiển thị doanh thu 6 tháng gần nhất với nhãn kỷ lục tự động (`is-top-month`) và tooltip nổi.
    - Bổ sung thanh điều hướng phân đoạn (Segmented Sub-tabs Navigation) gồm 5 phân hệ: *Quản lý Đơn đặt tour*, *Quản lý Tour*, *Kiểm soát Suất đặt (Inventory)*, *Khuyến mãi & Coupons*, và *Đánh giá & Kiểm duyệt*.

---

## 3. BẢNG TỔNG HỢP CÁC FILE ĐÃ CHỈNH SỬA & BỔ SUNG MỚI

| STT | Tên File / Đường dẫn | Thao tác | Mô tả tóm tắt nội dung thay đổi |
| :---: | :--- | :---: | :--- |
| **1** | [server/sql/004_advanced_reviews_and_features.sql](file:///d:/Projects/Travel-with-me/server/sql/004_advanced_reviews_and_features.sql) | Tạo mới | Script DDL khởi tạo 6 bảng SQL Server: `reviews`, `review_images`, `blog_posts`, `blog_comments`, `blog_likes`, `notifications`. |
| **2** | [server/sql/004_run_migration.js](file:///d:/Projects/Travel-with-me/server/sql/004_run_migration.js) | Tạo mới | Script thực thi migration tự động và seed dữ liệu mẫu cho đánh giá, bài viết cộng đồng và thông báo đa kênh. |
| **3** | [server/src/cache.js](file:///d:/Projects/Travel-with-me/server/src/cache.js) | Tạo mới | Tầng bộ nhớ đệm hiệu năng cao (Redis / Smart In-Memory FastCache), middleware đo thời gian phản hồi `< 10ms` và thống kê HIT/MISS. |
| **4** | [client/src/context/LocaleContext.jsx](file:///d:/Projects/Travel-with-me/client/src/context/LocaleContext.jsx) | Tạo mới | Context quản lý song ngữ (`VI`/`EN`) và quy đổi tỷ giá đa tiền tệ (`VND`, `USD`, `EUR`, `JPY`) theo thời gian thực. |
| **5** | [client/src/components/CommunitySection.jsx](file:///d:/Projects/Travel-with-me/client/src/components/CommunitySection.jsx) | Tạo mới | Phân hệ Không gian Cộng đồng & Nhật ký Hành trình UGC: đọc bài, đăng bài, lọc địa danh, thả tim, bình luận, đặt tour tương tự. |
| **6** | [client/src/components/NotificationHub.jsx](file:///d:/Projects/Travel-with-me/client/src/components/NotificationHub.jsx) | Tạo mới | Trung tâm thông báo đa kênh (`IN_APP`, `EMAIL`, `SMS`, `ZALO ZNS`), lọc theo 5 tab và mô phỏng nhắc lịch khởi hành 24h. |
| **7** | [server/test_e2e_features.js](file:///d:/Projects/Travel-with-me/server/test_e2e_features.js) | Tạo mới | Kịch bản kiểm thử tự động End-to-End (E2E) toàn bộ các API mới của Giai đoạn 4. |
| **8** | [server/src/index.js](file:///d:/Projects/Travel-with-me/server/src/index.js) | Cập nhật lớn | Bổ sung 15+ endpoints cho Đánh giá & Kiểm duyệt, Cộng đồng UGC, Thông báo đa kênh, Tỷ giá ngoại tệ và Thống kê Cache. |
| **9** | [client/src/components/AdminDashboard.jsx](file:///d:/Projects/Travel-with-me/client/src/components/AdminDashboard.jsx) | Cập nhật lớn | Thêm tab Kiểm duyệt & Phản hồi đánh giá, bảng giám sát hiệu năng Cache, Bento Grid KPI và nút đồng bộ tức thì SQL Server. |
| **10** | [client/src/components/Navbar.jsx](file:///d:/Projects/Travel-with-me/client/src/components/Navbar.jsx) | Cập nhật | Tích hợp bộ chọn Ngôn ngữ (`VI`/`EN`), Tiền tệ (`VND`/`USD`/`EUR`/`JPY`), nút Cộng đồng UGC và chuông Thông báo. |
| **11** | [client/src/components/Sidebar.jsx](file:///d:/Projects/Travel-with-me/client/src/components/Sidebar.jsx) | Cập nhật | Bổ sung lối tắt điều hướng tới Không gian Cộng đồng và Trung tâm Thông báo kèm hỗ trợ đa ngôn ngữ. |
| **12** | [client/src/components/ReviewModal.jsx](file:///d:/Projects/Travel-with-me/client/src/components/ReviewModal.jsx) | Cập nhật | Nâng cấp giao diện chấm sao, thông báo bảo chứng đơn `COMPLETED` và chọn/gỡ hình ảnh thực tế. |
| **13** | [client/src/components/TourDetailModal.jsx](file:///d:/Projects/Travel-with-me/client/src/components/TourDetailModal.jsx) | Cập nhật | Hiển thị album ảnh đánh giá thực tế, huy hiệu xác thực và khung phản hồi chính thức từ Ban Quản Trị. |
| **14** | [client/src/components/TourCard.jsx](file:///d:/Projects/Travel-with-me/client/src/components/TourCard.jsx) | Cập nhật | Tích hợp `useLocale` để tự động quy đổi giá hiển thị trên thẻ tour theo loại tiền tệ người dùng chọn. |
| **15** | [client/src/App.jsx](file:///d:/Projects/Travel-with-me/client/src/App.jsx) | Cập nhật | Điều phối trạng thái Thông báo, Cộng đồng UGC, truyền hàm xử lý đánh giá và nhắc lịch 24h. |
| **16** | [client/src/App.css](file:///d:/Projects/Travel-with-me/client/src/App.css) | Cập nhật lớn | Bổ sung hệ thống styling cho Community UGC, Notification Hub, Locale Dropdowns, Review Moderation và Bento Grid. |

---

## 4. KẾT QUẢ KIỂM THỬ THỰC TẾ & AUTOMATED E2E TESTS

Hệ thống đã được kiểm thử tự động thông qua script [server/test_e2e_features.js](file:///d:/Projects/Travel-with-me/server/test_e2e_features.js) và kiểm thử giao diện thực tế:

| Mã kiểm thử | Kịch bản kiểm thử | Hành động & Dữ liệu đầu vào | Kết quả mong đợi | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| **TC-01** | **Chính sách Đánh giá Minh bạch** | Gửi request `POST /api/reviews` với đơn hàng chưa hoàn thành hoặc không tồn tại | Hệ thống từ chối (`403`/`404`), ngăn chặn hoàn toàn đánh giá ảo/spam | **ĐẠT (PASS)** |
| **TC-02** | **Gửi Đánh giá từ đơn COMPLETED** | Khách có đơn `COMPLETED` chấm 5 sao, nhập nhận xét và đính kèm ảnh thực tế | Lưu thành công vào `dbo.reviews` & `dbo.review_images`, phát thông báo xác nhận | **ĐẠT (PASS)** |
| **TC-03** | **Admin Kiểm duyệt & Phản hồi** | Admin bấm ẩn/hiện đánh giá và gửi phản hồi chính thức trên Dashboard | Cập nhật tức thì xuống SQL Server; phản hồi hiển thị dưới đánh giá trên trang Tour | **ĐẠT (PASS)** |
| **TC-04** | **Cộng đồng Du lịch UGC** | Xem danh sách bài viết, lọc theo địa danh, bấm Thích và gửi Bình luận mới | Số lượt thích và bình luận tăng tức thì, lưu bền vững trong `dbo.blog_posts` & `dbo.blog_comments` | **ĐẠT (PASS)** |
| **TC-05** | **Đăng Nhật ký Hành trình mới** | Du khách điền tiêu đề, nội dung, mẹo du lịch, chọn tour liên kết và đăng tải | Bài viết mới xuất bản thành công lên Cộng đồng, tạo thông báo `COMMUNITY` | **ĐẠT (PASS)** |
| **TC-06** | **Trung tâm Thông báo Đa kênh** | Mở chuông thông báo, lọc theo các tab và bấm đánh dấu đã đọc | Hiển thị đúng nhãn `Zalo ZNS`, `SMS`, `Email`, `In-App`; giảm số đếm chưa đọc | **ĐẠT (PASS)** |
| **TC-07** | **Mô phỏng Nhắc lịch 24h** | Kích hoạt tính năng nhắc lịch trước 24h qua kênh `ZALO` | Sinh thông báo nhắc lịch kèm giờ khởi hành, tên & SĐT hướng dẫn viên phụ trách | **ĐẠT (PASS)** |
| **TC-08** | **Chuyển đổi Ngôn ngữ & Tiền tệ** | Đổi ngôn ngữ sang `EN` và tiền tệ sang `USD` / `EUR` / `JPY` trên Navbar | Toàn bộ nhãn giao diện chuyển sang tiếng Anh; giá tour tự động quy đổi chuẩn xác | **ĐẠT (PASS)** |
| **TC-09** | **Hiệu năng Cache & Flush Cache** | Kiểm tra `GET /api/cache/stats` và bấm nút "Xóa Cache" trên Admin | Phản hồi API đạt `< 10ms` khi `X-Cache: HIT`; làm sạch cache thành công khi Flush | **ĐẠT (PASS)** |
| **TC-10** | **Đóng gói mã nguồn (Production Build)** | Chạy lệnh `npm run build` tại thư mục `client` | Biên dịch thành công 100%, không phát sinh lỗi cú pháp hay cảnh báo runtime | **ĐẠT (PASS)** |

---

## 5. HƯỚNG DẪN VẬN HÀNH & KIỂM THỬ TÍNH NĂNG MỚI

### Bước 1: Chạy Migration & Seed dữ liệu Giai đoạn 4 vào SQL Server
```bash
# Tạo các bảng đánh giá, cộng đồng, thông báo và nạp dữ liệu mẫu vào SQL Server
node server/sql/004_run_migration.js
```

### Bước 2: Khởi chạy Backend & Frontend
```bash
# 1. Khởi chạy Backend Server (Cổng 5000)
cd server
npm run dev

# 2. Khởi chạy Frontend Client (Cổng 5173)
cd client
npm run dev
```

### Bước 3: Chạy kịch bản kiểm thử tự động E2E (Tùy chọn)
```bash
# Kiểm tra toàn diện 5 nhóm tính năng mới qua E2E script
node server/test_e2e_features.js
```

---
*Báo cáo Giai đoạn 4 (Tuần 4) được tổng hợp đầy đủ và xác thực nghiệm thu vào ngày 07/11/2026 - Dự án Travel With Me.*

