import { getDbPool, sql } from '../src/db.js';

async function runMigration() {
  console.log('[Migration] Bắt đầu chạy cập nhật CSDL cho Đánh giá, Blog cộng đồng và Notification Hub...');
  const pool = await getDbPool();

  const ddl = `
    IF OBJECT_ID('dbo.notifications', 'U') IS NOT NULL DROP TABLE dbo.notifications;
    IF OBJECT_ID('dbo.blog_likes', 'U') IS NOT NULL DROP TABLE dbo.blog_likes;
    IF OBJECT_ID('dbo.blog_comments', 'U') IS NOT NULL DROP TABLE dbo.blog_comments;
    IF OBJECT_ID('dbo.blog_posts', 'U') IS NOT NULL DROP TABLE dbo.blog_posts;
    IF OBJECT_ID('dbo.review_images', 'U') IS NOT NULL DROP TABLE dbo.review_images;
    IF OBJECT_ID('dbo.reviews', 'U') IS NOT NULL DROP TABLE dbo.reviews;

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

    CREATE TABLE dbo.review_images (
      image_id BIGINT IDENTITY(1,1) PRIMARY KEY,
      review_id BIGINT NOT NULL,
      image_url NVARCHAR(500) NOT NULL,
      CONSTRAINT fk_review_images FOREIGN KEY (review_id) REFERENCES dbo.reviews(review_id) ON DELETE CASCADE
    );

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

    CREATE TABLE dbo.blog_likes (
      like_id BIGINT IDENTITY(1,1) PRIMARY KEY,
      post_id BIGINT NOT NULL,
      user_id VARCHAR(100) NOT NULL,
      created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
      CONSTRAINT uq_blog_likes UNIQUE (post_id, user_id),
      CONSTRAINT fk_blog_likes_post FOREIGN KEY (post_id) REFERENCES dbo.blog_posts(post_id) ON DELETE CASCADE
    );

    CREATE TABLE dbo.notifications (
      notification_id BIGINT IDENTITY(1,1) PRIMARY KEY,
      user_id VARCHAR(100) NOT NULL,
      type VARCHAR(50) NOT NULL,
      channel VARCHAR(20) NOT NULL DEFAULT 'IN_APP',
      title NVARCHAR(200) NOT NULL,
      message NVARCHAR(MAX) NOT NULL,
      data_payload NVARCHAR(MAX) NULL,
      is_read BIT NOT NULL DEFAULT 0,
      created_at DATETIME2 NOT NULL DEFAULT GETDATE()
    );
  `;

  await pool.request().query(ddl);
  console.log('[Migration] Đã tạo thành công các bảng SQL Server: reviews, review_images, blog_posts, blog_comments, blog_likes, notifications!');

  // 1. Seed Reviews mẫu gắn với các booking COMPLETED
  console.log('[Seed] Đang nạp đánh giá thực tế từ các chuyến đi đã hoàn thành...');
  const completedBookings = await pool.request().query(`
    SELECT b.booking_id, b.booking_code, b.tour_id, b.tour_title, b.user_id, b.contact_name
    FROM dbo.bookings b
    WHERE b.booking_status = 'COMPLETED';
  `);

  const seedReviewsData = [
    {
      tourId: 'tour-1',
      rating: 5,
      comment: 'Chuyến đi Vịnh Hạ Long trên du thuyền 5 sao thực sự đẳng cấp! Phòng ngủ view kính ngắm trọn vẹn cảnh bình minh trên vịnh. Đồ ăn hải sản tươi ngon, hướng dẫn viên nhiệt tình, chu đáo. Cả gia đình mình rất hài lòng!',
      adminReply: 'Cảm ơn quý khách và gia đình đã tin tưởng đồng hành cùng Travel With Me! Đội ngũ luôn nỗ lực hết mình để mang lại trải nghiệm chuẩn 5 sao trọn vẹn nhất.',
      photos: [
        'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80'
      ]
    },
    {
      tourId: 'tour-2',
      rating: 5,
      comment: 'Đà Nẵng – Hội An 4N3Đ trọn vẹn cảm xúc. Lịch trình sắp xếp hợp lý, không bị mệt dù đi cùng người lớn tuổi. Khách sạn gần biển Mỹ Khê rất sạch sẽ. Cầu Vàng Bà Nà Hills đẹp ngỡ ngàng trong sương.',
      adminReply: 'Travel With Me rất vinh hạnh được phục vụ quý khách. Chúc quý khách và gia đình luôn có nhiều hành trình đáng nhớ tiếp theo!',
      photos: [
        'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80'
      ]
    },
    {
      tourId: 'tour-3',
      rating: 4,
      comment: 'Sa Pa mùa lúa chín tuyệt đẹp, đỉnh Fansipan hùng vĩ. Hướng dẫn viên am hiểu phong tục tập quán bản địa. Điểm trừ nhỏ là thời tiết hôm đầu có mưa phùn nhẹ, nhưng khách sạn chuẩn bị ô và áo mưa rất chu đáo.',
      adminReply: 'Cảm ơn góp ý quý báu của quý khách. Travel With Me sẽ tiếp tục trang bị chu đáo các phương án dự phòng thời tiết để chuyến đi luôn hoàn hảo nhất!',
      photos: []
    },
    {
      tourId: 'tour-4',
      rating: 5,
      comment: 'Phú Quốc đúng là thiên đường nghỉ dưỡng! Cáp treo Hòn Thơm ngắm biển ngoạn mục, show diễn Kiss The Stars tại Sunset Town cực kỳ hoành tráng. Vé điện tử QR check-in rất nhanh không phải xếp hàng.',
      adminReply: 'Rất vui vì quý khách đã có kỳ nghỉ trọn vẹn tại Đảo Ngọc Phú Quốc! Hẹn gặp lại quý khách trong các chuyến đi sắp tới.',
      photos: [
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80'
      ]
    }
  ];

  const bookingsList = completedBookings.recordset;
  for (let i = 0; i < Math.min(bookingsList.length, seedReviewsData.length); i++) {
    const b = bookingsList[i];
    const r = seedReviewsData[i];
    const tourIdStr = b.tour_id || r.tourId;
    const bookingIdStr = String(b.booking_id || b.booking_code || `bk-${i + 1}`);
    const userIdStr = String(b.user_id || '3');
    const author = b.contact_name || 'Khách hàng thân thiết';

    const insertRev = await pool.request()
      .input('tourId', sql.VarChar(100), tourIdStr)
      .input('userId', sql.VarChar(100), userIdStr)
      .input('bookingId', sql.VarChar(100), bookingIdStr)
      .input('rating', sql.Int, r.rating)
      .input('comment', sql.NVarChar(sql.MAX), r.comment)
      .input('adminReply', sql.NVarChar(sql.MAX), r.adminReply)
      .input('authorName', sql.NVarChar(150), author)
      .input('authorAvatar', sql.NVarChar(500), 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80')
      .query(`
        INSERT INTO dbo.reviews (tour_id, user_id, booking_id, rating, comment, is_visible, admin_reply, admin_reply_at, author_name, author_avatar, created_at)
        OUTPUT INSERTED.review_id
        VALUES (@tourId, @userId, @bookingId, @rating, @comment, 1, @adminReply, DATEADD(hour, 2, GETDATE()), @authorName, @authorAvatar, DATEADD(day, -${i * 5 + 2}, GETDATE()));
      `);

    const reviewId = insertRev.recordset[0].review_id;

    for (const photo of r.photos) {
      await pool.request()
        .input('reviewId', sql.BigInt, reviewId)
        .input('imageUrl', sql.NVarChar(500), photo)
        .query('INSERT INTO dbo.review_images (review_id, image_url) VALUES (@reviewId, @imageUrl)');
    }
  }

  // 2. Seed Blog Posts (Nhật ký hành trình UGC & Travel Community)
  console.log('[Seed] Đang nạp các bài viết nhật ký hành trình thực tế...');
  const sampleBlogs = [
    {
      title: 'Kinh Nghiệm Săn Mây Fansipan & Trekking Bản Cát Cát 3N2Đ Siêu Đáng Nhớ',
      slug: 'kinh-nghiem-san-may-fansipan-trekking-cat-cat-3n2d',
      summary: 'Hành trình vượt qua độ cao 3.143m chạm tay vào nóc nhà Đông Dương, những góc sống ảo triệu view tại bản Cát Cát và mẹo giữ ấm cực hay cho mùa săn mây.',
      content: `Sa Pa luôn là mảnh đất mang lại cho mình nhiều cảm xúc nhất mỗi khi trở lại. Đợt này mình quyết định đặt tour trọn gói trên Travel With Me để cả nhóm bạn được thảnh thơi trải nghiệm mà không phải bận tâm việc thuê xe hay tìm đường.

Lịch trình ngày đầu tiên đoàn mình di chuyển bằng xe giường nằm cao cấp từ Hà Nội lên thẳng trung tâm thị xã Sa Pa. Khách sạn nằm ngay gần Nhà thờ Đá, phòng ấm áp và nhân viên hỗ trợ nhiệt tình. Buổi chiều nhóm đi bộ xuống bản Cát Cát, thuê trang phục thổ cẩm của người H'Mông chụp ảnh bên suối Tiên Sa cực kỳ lung linh.

Sang ngày thứ hai là điểm nhấn của cả chuyến đi: Chinh phục đỉnh Fansipan. Cáp treo băng qua thung lũng Mường Hoa nhìn xuống những thửa ruộng bậc thang tuyệt đẹp. Lên đến đỉnh, biển mây bồng bềnh cuộn trôi quanh đại tượng Phật A Di Đà tạo nên khung cảnh thanh tịnh và hùng tráng không thể nào quên.`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      authorName: 'Nguyễn Quốc Hùng',
      authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      tripBadge: 'Đã hoàn thành chuyến đi Sa Pa 3N2Đ',
      travelTips: '• Hãy chuẩn bị áo gió chống thấm và giày trekking có độ bám tốt.\n• Nên mang theo bình giữ nhiệt nước gừng ấm khi lên đỉnh Fansipan vì nhiệt độ giảm nhanh.\n• Nhớ sạc đầy pin điện thoại và pin dự phòng vì trời lạnh pin tụt khá nhanh.',
      locationTags: 'Sa Pa, Fansipan, Bản Cát Cát, Trekking',
      likesCount: 128,
      commentsCount: 3,
      tourId: 'tour-3'
    },
    {
      title: 'Trải Nghiệm Du Thuyền 5 Sao Trên Vịnh Hạ Long: Có Đáng Tiền Không?',
      slug: 'trai-nghiem-du-thuyen-5-sao-vinh-ha-long',
      summary: 'Review chi tiết hành trình 2N1Đ trên du thuyền Ambassador Cruise: ẩm thực tôm hùm, chèo kayak qua hang Luồn và tiệc hoàng hôn trên Sundeck.',
      content: `Rất nhiều bạn hỏi mình đi du thuyền Hạ Long 5 sao có thực sự xứng đáng với chi phí bỏ ra không? Sau chuyến đi 2 ngày 1 đêm vừa qua cùng gia đình, câu trả lời chắc chắn là CỰC KỲ XỨNG ĐÁNG!

Ngay khi bước chân lên tàu, đoàn mình được chào đón bằng nước trái cây tươi và nụ cười ấm áp của thủy thủ đoàn. Phòng Suite có ban công riêng nhìn thẳng ra những hòn đảo đá vôi kỳ vĩ. Điểm cộng lớn nhất là bữa tiệc buffet trưa và tối với tôm hùm, cua biển và hào nướng tươi rói không giới hạn.

Hoạt động chèo thuyền kayak khám phá Hang Luồn là trải nghiệm thú vị nhất. Nước biển xanh như ngọc bích, thi thoảng còn bắt gặp những chú khỉ hoang chuyền cành trên vách đá. Buổi tối trên boong tàu có nhạc sống Acoustic và lớp học nấu nem truyền thống rất ấm cúng.`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
      authorName: 'Trần Thị Mai',
      authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      tripBadge: 'Đã hoàn thành tour Du thuyền Hạ Long 2N1Đ',
      travelTips: '• Chọn phòng ở tầng 2 trở lên để có tầm nhìn thoáng đãng hơn.\n• Đừng bỏ lỡ tiệc Sunset Party lúc 17h30 trên tầng thượng du thuyền.\n• Mang theo trang phục sáng màu (trắng, be, xanh pastel) lên hình vịnh biển cực kỳ nổi bật.',
      locationTags: 'Vịnh Hạ Long, Du Th thuyền 5 Sao, Hang Luồn',
      likesCount: 254,
      commentsCount: 5,
      tourId: 'tour-1'
    },
    {
      title: 'Khám Phá Thiên Đường Phú Quốc 4N3Đ: Từ Cáp Treo Hòn Thơm Đến Sunset Sanato',
      slug: 'kham-pha-thien-duong-phu-quoc-4n3d',
      summary: 'Cẩm nang du lịch tự túc kết hợp đặt tour cục bộ: check-in Cầu Hôn, ngắm hoàng hôn ngũ sắc và thưởng thức hải sản làng chài Hàm Ninh.',
      content: `Phú Quốc luôn biết cách mê hoặc du khách bởi màu nước biển xanh ngọc bích cùng những buổi hoàng hôn rực rỡ sắc tím cam. Lần này mình chọn tour trọn gói của Travel With Me để gia đình có xe đưa đón riêng và không phải lo lắng về việc mua vé các khu vui chơi.

Tuyến cáp treo vượt biển 3 dây dài nhất thế giới sang Hòn Thơm mang lại cảm giác phấn khích tột độ. Công viên nước Aquatopia với hàng chục trò chơi trượt nước hiện đại khiến các bé nhà mình mê tít.

Chiều về nhóm ghé Sunset Town ngắm hoàng hôn và check-in Cầu Hôn (Kiss Bridge). Kiến trúc mang phong cách Địa Trung Hải rực rỡ sắc màu bên bờ biển tây nam làm cho từng góc ảnh đều đẹp như tạp chí châu Âu.`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
      authorName: 'Lê Hoàng Long',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      tripBadge: 'Đã hoàn thành chuyến đi Phú Quốc 4N3Đ',
      travelTips: '• Nên đi cáp treo Hòn Thơm vào tầm 14h chiều để kịp chơi công viên nước và về đón hoàng hôn.\n• Thưởng thức món bún quậy Kiến Xây và ghẹ Hàm Ninh tươi luộc chấm muối tiêu chanh.\n• Kem chống nắng vật lý phổ rộng và kính râm là vật bất ly thân.',
      locationTags: 'Phú Quốc, Hòn Thơm, Sunset Sanato, Cầu Hôn',
      likesCount: 189,
      commentsCount: 2,
      tourId: 'tour-4'
    }
  ];

  for (const blog of sampleBlogs) {
    const insBlog = await pool.request()
      .input('authorId', sql.VarChar(100), '3')
      .input('title', sql.NVarChar(255), blog.title)
      .input('slug', sql.VarChar(270), blog.slug)
      .input('summary', sql.NVarChar(500), blog.summary)
      .input('content', sql.NVarChar(sql.MAX), blog.content)
      .input('thumbnailUrl', sql.NVarChar(500), blog.thumbnailUrl)
      .input('authorName', sql.NVarChar(150), blog.authorName)
      .input('authorAvatar', sql.NVarChar(500), blog.authorAvatar)
      .input('tripBadge', sql.NVarChar(150), blog.tripBadge)
      .input('travelTips', sql.NVarChar(sql.MAX), blog.travelTips)
      .input('locationTags', sql.NVarChar(255), blog.locationTags)
      .input('likesCount', sql.Int, blog.likesCount)
      .input('commentsCount', sql.Int, blog.commentsCount)
      .input('tourId', sql.VarChar(100), blog.tourId)
      .query(`
        INSERT INTO dbo.blog_posts (
          author_id, title, slug, summary, content, thumbnail_url,
          is_published, published_at, author_name, author_avatar,
          trip_badge, travel_tips, location_tags, likes_count, comments_count, tour_id, created_at
        )
        OUTPUT INSERTED.post_id
        VALUES (
          @authorId, @title, @slug, @summary, @content, @thumbnailUrl,
          1, GETDATE(), @authorName, @authorAvatar,
          @tripBadge, @travelTips, @locationTags, @likesCount, @commentsCount, @tourId, DATEADD(day, -3, GETDATE())
        );
      `);

    const postId = insBlog.recordset[0].post_id;

    // Seed 2 bình luận cho mỗi bài viết
    await pool.request()
      .input('postId', sql.BigInt, postId)
      .input('authorName', sql.NVarChar(150), 'Nguyễn Thúy Hằng')
      .input('authorAvatar', sql.NVarChar(500), 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80')
      .input('content', sql.NVarChar(sql.MAX), 'Bài viết chia sẻ rất có tâm và chi tiết ạ! Mình cũng đang lên kế hoạch đi cùng hội bạn tháng sau, xem xong bài của bạn có thêm nhiều động lực quá.')
      .query(`
        INSERT INTO dbo.blog_comments (post_id, author_name, author_avatar, content, created_at)
        VALUES (@postId, @authorName, @authorAvatar, @content, DATEADD(hour, -12, GETDATE()));
      `);

    await pool.request()
      .input('postId', sql.BigInt, postId)
      .input('authorName', sql.NVarChar(150), 'Trần Đức Anh')
      .input('authorAvatar', sql.NVarChar(500), 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80')
      .input('content', sql.NVarChar(sql.MAX), 'Cảm ơn bạn nhiều nhé, mẹo mang bình giữ nhiệt lên đỉnh núi cực kỳ hữu ích luôn!')
      .query(`
        INSERT INTO dbo.blog_comments (post_id, author_name, author_avatar, content, created_at)
        VALUES (@postId, @authorName, @authorAvatar, @content, DATEADD(hour, -5, GETDATE()));
      `);
  }

  // 3. Seed Notifications mẫu đa kênh cho tài khoản người dùng
  console.log('[Seed] Đang nạp danh sách thông báo đa kênh (Email, SMS, Zalo, In-app)...');
  const sampleNotifications = [
    {
      userId: '3',
      type: 'TRIP_REMINDER_24H',
      channel: 'ZALO',
      title: 'Nhắc lịch khởi hành tour trước 24 giờ (Zalo ZNS)',
      message: 'Kính chào Quý khách! Chuyến đi "Khám Phá Vịnh Hạ Long - Du Thuyền 5 Sao" của quý khách sẽ khởi hành lúc 07:30 sáng mai tại Cảng Quốc Tế Tuần Châu. Vui lòng mang theo CCCD và chuẩn bị hành lý chu đáo.',
      dataPayload: JSON.stringify({ bookingCode: 'TWM-20261017-001', tourId: 'tour-1', action: 'VIEW_TICKET' })
    },
    {
      userId: '3',
      type: 'BOOKING_CONFIRMED',
      channel: 'EMAIL',
      title: 'Xác nhận đặt tour & Phát hành Vé điện tử QR Code',
      message: 'Đơn đặt chỗ của quý khách đã được xác nhận thành công. Vé điện tử tích hợp mã QR Code đã được cấp phát, sẵn sàng check-in trực tiếp.',
      dataPayload: JSON.stringify({ bookingCode: 'TWM-20261017-001', action: 'VIEW_TICKET' })
    },
    {
      userId: '3',
      type: 'REVIEW_INVITATION',
      channel: 'IN_APP',
      title: 'Mời chia sẻ trải nghiệm & Nhận quà tri ân',
      message: 'Chuyến đi Đà Nẵng của bạn đã hoàn thành. Hãy chia sẻ cảm nhận và hình ảnh thực tế để giúp cộng đồng du khách và nhận ngay voucher giảm 10%!',
      dataPayload: JSON.stringify({ bookingId: '2', tourId: 'tour-2', action: 'WRITE_REVIEW' })
    },
    {
      userId: '3',
      type: 'COMMUNITY',
      channel: 'IN_APP',
      title: 'Có tương tác mới trên bài viết của bạn',
      message: 'Nguyễn Thúy Hằng và 5 người khác vừa thích và bình luận vào nhật ký hành trình "Kinh Nghiệm Săn Mây Fansipan" của bạn.',
      dataPayload: JSON.stringify({ postId: 1, action: 'VIEW_STORY' })
    },
    {
      userId: '3',
      type: 'PROMOTION',
      channel: 'SMS',
      title: 'Ưu đãi đặc quyền mùa thu vàng (SMS Brandname)',
      message: 'Tặng riêng bạn mã giảm giá TRAVEL2026 giảm 10% tối đa 1.000.000đ khi đặt bất kỳ tour du lịch biển đảo hoặc nghỉ dưỡng trước ngày 15/11.',
      dataPayload: JSON.stringify({ code: 'TRAVEL2026', action: 'USE_COUPON' })
    }
  ];

  for (const notif of sampleNotifications) {
    await pool.request()
      .input('userId', sql.VarChar(100), notif.userId)
      .input('type', sql.VarChar(50), notif.type)
      .input('channel', sql.VarChar(20), notif.channel)
      .input('title', sql.NVarChar(200), notif.title)
      .input('message', sql.NVarChar(sql.MAX), notif.message)
      .input('dataPayload', sql.NVarChar(sql.MAX), notif.dataPayload)
      .query(`
        INSERT INTO dbo.notifications (user_id, type, channel, title, message, data_payload, is_read, created_at)
        VALUES (@userId, @type, @channel, @title, @message, @dataPayload, 0, DATEADD(hour, -2, GETDATE()));
      `);
  }

  console.log('[Migration & Seed] HOÀN TẤT THÀNH CÔNG 100%!');
  process.exit(0);
}

runMigration().catch((err) => {
  console.error('[Migration Error] Lỗi nghiêm trọng:', err);
  process.exit(1);
});
