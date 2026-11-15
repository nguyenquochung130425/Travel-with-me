-- ============================================================================
-- TRAVEL WITH ME - PHASE 4 & 5 DATABASE MIGRATION
-- Advanced Reviews & Moderation, Travel Blog Community (UGC), Notification Hub
-- ============================================================================

USE TravelWithMe;
GO

-- 0. Dọn dẹp an toàn các bảng tương tác (chưa có dữ liệu production)
IF OBJECT_ID('dbo.notifications', 'U') IS NOT NULL DROP TABLE dbo.notifications;
GO
IF OBJECT_ID('dbo.blog_likes', 'U') IS NOT NULL DROP TABLE dbo.blog_likes;
GO
IF OBJECT_ID('dbo.blog_comments', 'U') IS NOT NULL DROP TABLE dbo.blog_comments;
GO
IF OBJECT_ID('dbo.blog_posts', 'U') IS NOT NULL DROP TABLE dbo.blog_posts;
GO
IF OBJECT_ID('dbo.review_images', 'U') IS NOT NULL DROP TABLE dbo.review_images;
GO
IF OBJECT_ID('dbo.reviews', 'U') IS NOT NULL DROP TABLE dbo.reviews;
GO

-- 1. Bảng Đánh giá tour (dbo.reviews) với kiểm duyệt & phản hồi
CREATE TABLE dbo.reviews (
    review_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tour_id VARCHAR(100) NOT NULL,
    booking_id VARCHAR(100) NOT NULL UNIQUE,
    user_id VARCHAR(100) NULL,
    author_name NVARCHAR(150) NOT NULL,
    author_avatar NVARCHAR(500) NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment NVARCHAR(MAX) NULL,
    is_visible BIT NOT NULL DEFAULT 1,
    admin_reply NVARCHAR(MAX) NULL,
    admin_reply_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- 2. Bảng Hình ảnh đánh giá (dbo.review_images)
CREATE TABLE dbo.review_images (
    image_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    review_id BIGINT NOT NULL,
    image_url NVARCHAR(500) NOT NULL,
    CONSTRAINT fk_review_images FOREIGN KEY (review_id) REFERENCES dbo.reviews(review_id) ON DELETE CASCADE
);
GO

-- 3. Bảng Bài viết chia sẻ nhật ký hành trình UGC (dbo.blog_posts)
CREATE TABLE dbo.blog_posts (
    post_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    author_id VARCHAR(100) NULL,
    author_name NVARCHAR(150) NOT NULL,
    author_avatar NVARCHAR(500) NULL,
    tour_id VARCHAR(100) NULL,
    title NVARCHAR(255) NOT NULL,
    slug VARCHAR(270) NOT NULL UNIQUE,
    summary NVARCHAR(500) NULL,
    content NVARCHAR(MAX) NOT NULL,
    thumbnail_url NVARCHAR(500) NULL,
    trip_badge NVARCHAR(150) NULL,
    travel_tips NVARCHAR(MAX) NULL,
    location_tags NVARCHAR(255) NULL,
    likes_count INT NOT NULL DEFAULT 0,
    comments_count INT NOT NULL DEFAULT 0,
    is_published BIT NOT NULL DEFAULT 1,
    published_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- 4. Bảng Bình luận bài viết cộng đồng (dbo.blog_comments)
CREATE TABLE dbo.blog_comments (
    comment_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    post_id BIGINT NOT NULL,
    user_id VARCHAR(100) NULL,
    author_name NVARCHAR(150) NOT NULL,
    author_avatar NVARCHAR(500) NULL,
    content NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT fk_blog_comments_post FOREIGN KEY (post_id) REFERENCES dbo.blog_posts(post_id) ON DELETE CASCADE
);
GO

-- 5. Bảng Lượt thích bài viết (dbo.blog_likes)
CREATE TABLE dbo.blog_likes (
    like_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    post_id BIGINT NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT uq_blog_likes UNIQUE (post_id, user_id),
    CONSTRAINT fk_blog_likes_post FOREIGN KEY (post_id) REFERENCES dbo.blog_posts(post_id) ON DELETE CASCADE
);
GO

-- 6. Bảng Trung tâm thông báo đa kênh (dbo.notifications)
CREATE TABLE dbo.notifications (
    notification_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- BOOKING_CONFIRMED, TRIP_REMINDER_24H, TICKET_ISSUED, REVIEW_INVITATION, PROMOTION, COMMUNITY
    channel VARCHAR(20) NOT NULL DEFAULT 'IN_APP', -- IN_APP, EMAIL, SMS, ZALO
    title NVARCHAR(200) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    data_payload NVARCHAR(MAX) NULL,
    is_read BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO
