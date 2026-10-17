-- ============================================================================
-- DỰ ÁN: TRAVEL WITH ME - TOUR BOOKING PLATFORM
-- HỆ QUẢN TRỊ CSDL: MICROSOFT SQL SERVER (T-SQL)
-- ============================================================================

USE TravelWithMe;
GO

-- 0. DỌN DẸP CÁC BẢNG NẾU ĐÃ TỒN TẠI (THEO THỨ TỰ TRÁNH LỖI KHÓA NGOẠI)
IF OBJECT_ID('dbo.blog_posts', 'U') IS NOT NULL DROP TABLE dbo.blog_posts;
IF OBJECT_ID('dbo.chat_messages', 'U') IS NOT NULL DROP TABLE dbo.chat_messages;
IF OBJECT_ID('dbo.review_images', 'U') IS NOT NULL DROP TABLE dbo.review_images;
IF OBJECT_ID('dbo.reviews', 'U') IS NOT NULL DROP TABLE dbo.reviews;
IF OBJECT_ID('dbo.wishlists', 'U') IS NOT NULL DROP TABLE dbo.wishlists;
IF OBJECT_ID('dbo.refunds', 'U') IS NOT NULL DROP TABLE dbo.refunds;
IF OBJECT_ID('dbo.payments', 'U') IS NOT NULL DROP TABLE dbo.payments;
IF OBJECT_ID('dbo.passengers', 'U') IS NOT NULL DROP TABLE dbo.passengers;
IF OBJECT_ID('dbo.bookings', 'U') IS NOT NULL DROP TABLE dbo.bookings;
IF OBJECT_ID('dbo.coupons', 'U') IS NOT NULL DROP TABLE dbo.coupons;
IF OBJECT_ID('dbo.tour_schedules', 'U') IS NOT NULL DROP TABLE dbo.tour_schedules;
IF OBJECT_ID('dbo.tour_images', 'U') IS NOT NULL DROP TABLE dbo.tour_images;
IF OBJECT_ID('dbo.tour_itineraries', 'U') IS NOT NULL DROP TABLE dbo.tour_itineraries;
IF OBJECT_ID('dbo.tours', 'U') IS NOT NULL DROP TABLE dbo.tours;
IF OBJECT_ID('dbo.destinations', 'U') IS NOT NULL DROP TABLE dbo.destinations;
IF OBJECT_ID('dbo.categories', 'U') IS NOT NULL DROP TABLE dbo.categories;
IF OBJECT_ID('dbo.refresh_tokens', 'U') IS NOT NULL DROP TABLE dbo.refresh_tokens;
IF OBJECT_ID('dbo.users', 'U') IS NOT NULL DROP TABLE dbo.users;
IF OBJECT_ID('dbo.roles', 'U') IS NOT NULL DROP TABLE dbo.roles;
GO

-- ============================================================================
-- 1. PHÂN HỆ PHÂN QUYỀN & TÀI KHOẢN (AUTHENTICATION & RBAC)
-- ============================================================================

-- Bảng vai trò người dùng (Super Admin, Staff, User)
CREATE TABLE dbo.roles (
    role_id INT IDENTITY(1,1) PRIMARY KEY,
    role_name NVARCHAR(50) NOT NULL UNIQUE,
    description NVARCHAR(255) NULL
);
GO

-- Bảng tài khoản người dùng
CREATE TABLE dbo.users (
    user_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    role_id INT NOT NULL DEFAULT 3, -- Mặc định là 3 (User)
    full_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL, -- Cho phép NULL nếu đăng nhập qua Google OAuth
    phone_number VARCHAR(20) NULL,
    avatar_url NVARCHAR(500) NULL,
    address NVARCHAR(255) NULL,
    date_of_birth DATE NULL,
    auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL', -- LOCAL, GOOGLE
    provider_id VARCHAR(100) NULL,
    is_active BIT NOT NULL DEFAULT 1,
    is_verified BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES dbo.roles(role_id) ON DELETE NO ACTION
);
GO

-- Bảng quản lý Refresh Token
CREATE TABLE dbo.refresh_tokens (
    token_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME2 NOT NULL,
    is_revoked BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT fk_tokens_user FOREIGN KEY (user_id) REFERENCES dbo.users(user_id) ON DELETE CASCADE
);
GO

-- ============================================================================
-- 2. PHÂN HỆ QUẢN LÝ TOUR & LỊCH TRÌNH (TOUR INVENTORY)
-- ============================================================================

-- Bảng danh mục / chủ đề tour (Nghỉ dưỡng, Trekking, Văn hóa, Gia đình...)
CREATE TABLE dbo.categories (
    category_id INT IDENTITY(1,1) PRIMARY KEY,
    category_name NVARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description NVARCHAR(500) NULL
);
GO

-- Bảng điểm đến du lịch (Vùng miền, tỉnh thành, địa danh)
CREATE TABLE dbo.destinations (
    destination_id INT IDENTITY(1,1) PRIMARY KEY,
    destination_name NVARCHAR(100) NOT NULL,
    region NVARCHAR(50) NOT NULL, -- Bắc, Trung, Nam, Quốc tế
    image_url NVARCHAR(500) NULL,
    description NVARCHAR(MAX) NULL
);
GO

-- Bảng thông tin chính của Tour
CREATE TABLE dbo.tours (
    tour_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL UNIQUE,
    category_id INT NOT NULL,
    destination_id INT NOT NULL,
    duration_days INT NOT NULL,
    duration_nights INT NOT NULL,
    departure_location NVARCHAR(150) NOT NULL,
    transportation NVARCHAR(100) NOT NULL, -- Máy bay, Xe du lịch, Tàu hỏa...
    adult_price DECIMAL(18,2) NOT NULL,
    child_price DECIMAL(18,2) NOT NULL,
    infant_price DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    inclusions NVARCHAR(MAX) NULL,     -- Dịch vụ bao gồm
    exclusions NVARCHAR(MAX) NULL,     -- Dịch vụ không bao gồm
    cancellation_policy NVARCHAR(MAX) NULL, -- Chính sách hoàn hủy
    map_coordinates NVARCHAR(100) NULL, -- Tọa độ hiển thị Leaflet/Google Maps
    thumbnail_url NVARCHAR(500) NULL,
    rating_avg DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    total_reviews INT NOT NULL DEFAULT 0,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT fk_tours_category FOREIGN KEY (category_id) REFERENCES dbo.categories(category_id) ON DELETE NO ACTION,
    CONSTRAINT fk_tours_destination FOREIGN KEY (destination_id) REFERENCES dbo.destinations(destination_id) ON DELETE NO ACTION
);
GO

-- Bảng lịch trình chi tiết từng ngày của Tour (Itinerary)
CREATE TABLE dbo.tour_itineraries (
    itinerary_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tour_id BIGINT NOT NULL,
    day_number INT NOT NULL,
    day_title NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX) NOT NULL,
    meals NVARCHAR(100) NULL, -- Bữa sáng, trưa, tối
    CONSTRAINT fk_itinerary_tour FOREIGN KEY (tour_id) REFERENCES dbo.tours(tour_id) ON DELETE CASCADE
);
GO

-- Bảng album ảnh media của Tour
CREATE TABLE dbo.tour_images (
    image_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tour_id BIGINT NOT NULL,
    image_url NVARCHAR(500) NOT NULL,
    caption NVARCHAR(255) NULL,
    is_thumbnail BIT NOT NULL DEFAULT 0,
    CONSTRAINT fk_images_tour FOREIGN KEY (tour_id) REFERENCES dbo.tours(tour_id) ON DELETE CASCADE
);
GO

-- Bảng lịch khởi hành & quản lý suất chỗ (Slot Inventory)
CREATE TABLE dbo.tour_schedules (
    schedule_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tour_id BIGINT NOT NULL,
    departure_date DATE NOT NULL,
    return_date DATE NOT NULL,
    max_capacity INT NOT NULL,          -- Sức chứa tối đa
    min_capacity INT NOT NULL DEFAULT 5, -- Số khách tối thiểu để khởi hành
    booked_slots INT NOT NULL DEFAULT 0, -- Số chỗ đã đặt
    hold_slots INT NOT NULL DEFAULT 0,   -- Số chỗ đang tạm giữ (chờ thanh toán)
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, SOLD_OUT, COMPLETED, CANCELLED
    CONSTRAINT fk_schedules_tour FOREIGN KEY (tour_id) REFERENCES dbo.tours(tour_id) ON DELETE CASCADE,
    CONSTRAINT chk_slots CHECK (booked_slots + hold_slots <= max_capacity)
);
GO

-- ============================================================================
-- 3. KHUYẾN MÃI, ĐẶT CHỖ & THANH TOÁN (BOOKING & CHECKOUT)
-- ============================================================================

-- Bảng mã giảm giá (Coupon/Voucher)
CREATE TABLE dbo.coupons (
    coupon_id INT IDENTITY(1,1) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type VARCHAR(20) NOT NULL, -- PERCENTAGE, FIXED_AMOUNT
    discount_value DECIMAL(18,2) NOT NULL,
    min_order_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    max_discount_amount DECIMAL(18,2) NULL,
    usage_limit INT NOT NULL DEFAULT 100,
    used_count INT NOT NULL DEFAULT 0,
    start_date DATETIME2 NOT NULL,
    end_date DATETIME2 NOT NULL,
    is_active BIT NOT NULL DEFAULT 1
);
GO

-- Bảng đơn đặt chỗ (Bookings)
CREATE TABLE dbo.bookings (
    booking_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    booking_code VARCHAR(30) NOT NULL UNIQUE, -- Mã đơn hiển thị (VD: TWM-20261017-001)
    user_id BIGINT NOT NULL,
    schedule_id BIGINT NOT NULL,
    coupon_id INT NULL,
    num_adults INT NOT NULL DEFAULT 1,
    num_children INT NOT NULL DEFAULT 0,
    num_infants INT NOT NULL DEFAULT 0,
    subtotal DECIMAL(18,2) NOT NULL,
    discount_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(18,2) NOT NULL,
    booking_status VARCHAR(20) NOT NULL DEFAULT 'PENDING', 
    -- PENDING (Chờ), PAID (Đã TT), CONFIRMED (Đã xác nhận), IN_PROGRESS (Đang đi), COMPLETED (Hoàn thành), CANCELLED (Đã hủy)
    payment_status VARCHAR(20) NOT NULL DEFAULT 'UNPAID', 
    -- UNPAID, PARTIALLY_PAID, PAID, REFUNDED
    qr_ticket_code NVARCHAR(500) NULL,
    special_requests NVARCHAR(MAX) NULL,
    expires_at DATETIME2 NULL, -- Thời hạn hết hiệu lực giữ chỗ (sau 24h hoặc 15p)
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES dbo.users(user_id) ON DELETE NO ACTION,
    CONSTRAINT fk_bookings_schedule FOREIGN KEY (schedule_id) REFERENCES dbo.tour_schedules(schedule_id) ON DELETE NO ACTION,
    CONSTRAINT fk_bookings_coupon FOREIGN KEY (coupon_id) REFERENCES dbo.coupons(coupon_id) ON DELETE SET NULL
);
GO

-- Bảng thông tin hành khách đi cùng đoàn
CREATE TABLE dbo.passengers (
    passenger_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    full_name NVARCHAR(100) NOT NULL,
    passenger_type VARCHAR(20) NOT NULL, -- ADULT, CHILD, INFANT
    gender NVARCHAR(10) NULL,
    date_of_birth DATE NULL,
    id_card_number VARCHAR(30) NULL, -- CCCD / Hộ chiếu
    special_notes NVARCHAR(255) NULL, -- Ăn chay, dị ứng...
    CONSTRAINT fk_passengers_booking FOREIGN KEY (booking_id) REFERENCES dbo.bookings(booking_id) ON DELETE CASCADE
);
GO

-- Bảng giao dịch thanh toán (Payments)
CREATE TABLE dbo.payments (
    payment_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    payment_method VARCHAR(30) NOT NULL, -- VNPAY, MOMO, ZALOPAY, STRIPE, VIETQR, CASH
    transaction_code VARCHAR(100) NULL, -- Mã giao dịch từ cổng thanh toán
    amount DECIMAL(18,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, SUCCESS, FAILED
    payment_time DATETIME2 NULL,
    payment_payload NVARCHAR(MAX) NULL, -- Lưu log response callback
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES dbo.bookings(booking_id) ON DELETE CASCADE
);
GO

-- Bảng xử lý yêu cầu hủy & hoàn tiền (Refunds)
CREATE TABLE dbo.refunds (
    refund_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    requested_by BIGINT NOT NULL,
    processed_by BIGINT NULL,
    refund_amount DECIMAL(18,2) NOT NULL,
    reason NVARCHAR(500) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, COMPLETED
    processed_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT fk_refunds_booking FOREIGN KEY (booking_id) REFERENCES dbo.bookings(booking_id) ON DELETE CASCADE,
    CONSTRAINT fk_refunds_requester FOREIGN KEY (requested_by) REFERENCES dbo.users(user_id) ON DELETE NO ACTION,
    CONSTRAINT fk_refunds_processor FOREIGN KEY (processed_by) REFERENCES dbo.users(user_id) ON DELETE NO ACTION
);
GO

-- ============================================================================
-- 4. TƯƠNG TÁC, ĐÁNH GIÁ, CSKH & MARKETING
-- ============================================================================

-- Bảng danh sách yêu thích (Wishlist)
CREATE TABLE dbo.wishlists (
    wishlist_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    tour_id BIGINT NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT uq_user_tour UNIQUE (user_id, tour_id),
    CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES dbo.users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_wishlist_tour FOREIGN KEY (tour_id) REFERENCES dbo.tours(tour_id) ON DELETE CASCADE
);
GO

-- Bảng đánh giá tour (Reviews & Ratings)
CREATE TABLE dbo.reviews (
    review_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tour_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    booking_id BIGINT NOT NULL UNIQUE, -- Đảm bảo 1 booking chỉ đánh giá 1 lần
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment NVARCHAR(MAX) NULL,
    is_visible BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT fk_reviews_tour FOREIGN KEY (tour_id) REFERENCES dbo.tours(tour_id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES dbo.users(user_id) ON DELETE NO ACTION,
    CONSTRAINT fk_reviews_booking FOREIGN KEY (booking_id) REFERENCES dbo.bookings(booking_id) ON DELETE NO ACTION
);
GO

-- Bảng hình ảnh đính kèm của bài đánh giá
CREATE TABLE dbo.review_images (
    image_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    review_id BIGINT NOT NULL,
    image_url NVARCHAR(500) NOT NULL,
    CONSTRAINT fk_review_images FOREIGN KEY (review_id) REFERENCES dbo.reviews(review_id) ON DELETE CASCADE
);
GO

-- Bảng bài viết chia sẻ kinh nghiệm du lịch (Blog / News)
CREATE TABLE dbo.blog_posts (
    post_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    author_id BIGINT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    slug VARCHAR(270) NOT NULL UNIQUE,
    summary NVARCHAR(500) NULL,
    content NVARCHAR(MAX) NOT NULL,
    thumbnail_url NVARCHAR(500) NULL,
    meta_title NVARCHAR(150) NULL,
    meta_description NVARCHAR(255) NULL,
    is_published BIT NOT NULL DEFAULT 0,
    published_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT fk_blog_author FOREIGN KEY (author_id) REFERENCES dbo.users(user_id) ON DELETE NO ACTION
);
GO

-- Bảng tin nhắn hỗ trợ trực tuyến (Live Chat / AI Bot)
CREATE TABLE dbo.chat_messages (
    message_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    sender_id BIGINT NULL,    -- NULL nếu là tin nhắn hệ thống / chatbot
    receiver_id BIGINT NULL,
    session_id VARCHAR(100) NOT NULL,
    message_text NVARCHAR(MAX) NOT NULL,
    is_read BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================================
-- 5. CHỈ MỤC TỐI ƯU HIỆU NĂNG (INDEXES)
-- ============================================================================
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- Tối ưu bộ lọc tìm kiếm tour
CREATE NONCLUSTERED INDEX idx_tours_destination ON dbo.tours (destination_id, is_active);
CREATE NONCLUSTERED INDEX idx_tours_category ON dbo.tours (category_id, is_active);
CREATE NONCLUSTERED INDEX idx_tours_price ON dbo.tours (adult_price, rating_avg);

-- Tối ưu tra cứu lịch khởi hành
CREATE NONCLUSTERED INDEX idx_schedules_departure ON dbo.tour_schedules (departure_date, status);

-- Tối ưu tra cứu đơn hàng theo người dùng và trạng thái
CREATE NONCLUSTERED INDEX idx_bookings_user ON dbo.bookings (user_id);
CREATE NONCLUSTERED INDEX idx_bookings_status_date ON dbo.bookings (booking_status, created_at);

-- Tối ưu quét tác vụ tự động (Cron job hủy đơn quá hạn)
CREATE NONCLUSTERED INDEX idx_bookings_expiry ON dbo.bookings (booking_status, expires_at)
WHERE booking_status = 'PENDING';
GO

-- ============================================================================
-- 6. DỮ LIỆU KHỞI TẠO BAN ĐẦU (SEED DATA)
-- ============================================================================

INSERT INTO dbo.roles (role_name, description) VALUES
('SUPER_ADMIN', N'Quản trị viên cấp cao toàn quyền hệ thống'),
('STAFF', N'Nhân viên điều hành tour và quản lý booking'),
('USER', N'Khách hàng du lịch');
GO