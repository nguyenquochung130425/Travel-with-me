import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getDbPool } from './db.js';
import authRouter from './auth.js';
import {
  mockCategories,
  mockTours,
  mockCoupons,
  mockUserBookings,
  mockReviews
} from './mockData.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ── Authentication (register, login, forgot/reset password) ──
app.use('/api/auth', authRouter);

// In-memory data store for live state changes
let toursData = JSON.parse(JSON.stringify(mockTours));
let bookingsData = [];
let reviewsData = JSON.parse(JSON.stringify(mockReviews));
let couponsData = JSON.parse(JSON.stringify(mockCoupons));

// Khởi tạo và nạp dữ liệu từ SQL Server dbo.bookings nếu có
getDbPool().then(async (pool) => {
  if (pool) {
    try {
      const res = await pool.request().query('SELECT * FROM dbo.bookings ORDER BY created_at DESC');
      if (res.recordset && res.recordset.length > 0) {
        bookingsData = res.recordset.map((row) => ({
          id: `bk-${row.booking_id}`,
          bookingId: row.booking_id,
          bookingCode: row.booking_code,
          userId: row.user_id,
          tourId: row.tour_id,
          tourTitle: row.tour_title,
          tourImage: row.tour_image,
          scheduleId: row.schedule_id ? `sch-${row.schedule_id}` : null,
          departureDate: row.departure_date,
          returnDate: row.return_date,
          numAdults: row.num_adults,
          numChildren: row.num_children,
          numInfants: row.num_infants,
          totalPassengers: (row.num_adults || 0) + (row.num_children || 0) + (row.num_infants || 0),
          baseAmount: Number(row.subtotal),
          discountAmount: Number(row.discount_amount),
          finalAmount: Number(row.total_amount),
          paymentMethod: row.payment_method,
          paymentStatus: row.payment_status,
          status: row.booking_status,
          contactName: row.contact_name,
          contactEmail: row.contact_email,
          contactPhone: row.contact_phone,
          specialNotes: row.special_requests,
          passengers: row.passengers_json ? JSON.parse(row.passengers_json) : [],
          qrCodeToken: row.qr_ticket_code,
          createdAt: row.created_at
        }));
        console.log(`[SQL Server] Đã nạp ${bookingsData.length} đơn đặt tour từ database TravelWithMe`);
      }
    } catch (e) {
      console.error('[SQL Server] Lỗi nạp bookings ban đầu:', e.message);
    }
  }
}).catch(() => {});

// 1. Lấy danh sách danh mục
app.get('/api/categories', (req, res) => {
  res.json({ success: true, data: mockCategories });
});

// 2. Lấy danh sách Tours (hỗ trợ lọc & sắp xếp)
app.get('/api/tours', (req, res) => {
  const {
    keyword,
    departureCity,
    destinationCity,
    categoryId,
    tourType,
    transportType,
    minPrice,
    maxPrice,
    sortBy
  } = req.query;

  let results = [...toursData];

  // Lọc theo từ khóa
  if (keyword) {
    const kw = keyword.toLowerCase().trim();
    results = results.filter(
      (t) =>
        t.title.toLowerCase().includes(kw) ||
        t.destinationCity.toLowerCase().includes(kw) ||
        t.departureCity.toLowerCase().includes(kw)
    );
  }

  // Lọc theo điểm đi
  if (departureCity && departureCity !== 'all') {
    results = results.filter((t) =>
      t.departureCity.toLowerCase().includes(departureCity.toLowerCase())
    );
  }

  // Lọc theo điểm đến
  if (destinationCity && destinationCity !== 'all') {
    results = results.filter((t) =>
      t.destinationCity.toLowerCase().includes(destinationCity.toLowerCase())
    );
  }

  // Lọc theo danh mục
  if (categoryId && categoryId !== 'all') {
    results = results.filter((t) => t.categoryId === categoryId);
  }

  // Lọc theo loại hình tour
  if (tourType && tourType !== 'all') {
    results = results.filter((t) => t.tourType === tourType);
  }

  // Lọc theo phương tiện
  if (transportType && transportType !== 'all') {
    results = results.filter((t) => t.transportType === transportType);
  }

  // Lọc theo khoảng giá (dựa trên giá người lớn thấp nhất của các schedule)
  if (minPrice || maxPrice) {
    const min = minPrice ? Number(minPrice) : 0;
    const max = maxPrice ? Number(maxPrice) : Infinity;

    results = results.filter((t) => {
      const minTourPrice = Math.min(
        ...t.schedules.map((s) => Number(s.adultPrice))
      );
      return minTourPrice >= min && minTourPrice <= max;
    });
  }

  // Sắp xếp
  if (sortBy === 'price_asc') {
    results.sort((a, b) => {
      const minA = Math.min(...a.schedules.map((s) => Number(s.adultPrice)));
      const minB = Math.min(...b.schedules.map((s) => Number(s.adultPrice)));
      return minA - minB;
    });
  } else if (sortBy === 'price_desc') {
    results.sort((a, b) => {
      const minA = Math.min(...a.schedules.map((s) => Number(s.adultPrice)));
      const minB = Math.min(...b.schedules.map((s) => Number(s.adultPrice)));
      return minB - minA;
    });
  } else if (sortBy === 'rating') {
    results.sort((a, b) => b.ratingAverage - a.ratingAverage);
  } else {
    // Mặc định: Phổ biến (số lượng review)
    results.sort((a, b) => b.reviewCount - a.reviewCount);
  }

  res.json({
    success: true,
    total: results.length,
    data: results
  });
});

// 3. Lấy chi tiết 1 Tour
app.get('/api/tours/:id', (req, res) => {
  const tour = toursData.find(
    (t) => t.id === req.params.id || t.slug === req.params.id
  );
  if (!tour) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy tour du lịch' });
  }

  const tourReviews = reviewsData.filter((r) => r.tourId === tour.id);
  res.json({
    success: true,
    data: {
      ...tour,
      reviews: tourReviews
    }
  });
});

// 4. Kiểm tra mã giảm giá (Coupon validation)
app.post('/api/coupons/validate', (req, res) => {
  const { code, orderAmount } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập mã coupon' });
  }

  const coupon = couponsData.find(
    (c) => c.code.toUpperCase() === code.toUpperCase().trim() && c.isActive
  );

  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại hoặc đã hết hạn' });
  }

  const amount = Number(orderAmount) || 0;
  if (amount < coupon.minOrder) {
    return res.status(400).json({
      success: false,
      message: `Đơn hàng tối thiểu phải từ ${coupon.minOrder.toLocaleString('vi-VN')} đ để áp dụng mã này`
    });
  }

  let discount = 0;
  if (coupon.discountType === 'PERCENTAGE') {
    discount = (amount * coupon.discountValue) / 100;
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = coupon.discountValue;
  }

  res.json({
    success: true,
    data: {
      code: coupon.code,
      description: coupon.description,
      discountAmount: discount,
      finalAmount: Math.max(0, amount - discount)
    }
  });
});

// 5. Đặt tour (Booking Creation & Concurrency Check & Lưu vào SQL Server)
app.post('/api/bookings', async (req, res) => {
  try {
    const {
      userId,
      tourId,
      scheduleId,
      numAdults,
      numChildren,
      numInfants,
      contactName,
      contactEmail,
      contactPhone,
      specialNotes,
      couponCode,
      paymentMethod,
      passengers,
      baseAmount: clientBaseAmount,
      discountAmount: clientDiscountAmount,
      finalAmount: clientFinalAmount
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập tài khoản để tiến hành đặt tour!'
      });
    }

    // Tìm tour & schedule
    const tour = toursData.find((t) => t.id === tourId) || toursData[0];
    if (!tour) {
      return res.status(404).json({ success: false, message: 'Tour không tồn tại' });
    }

    const schedule = (tour.schedules && tour.schedules.find((s) => s.id === scheduleId)) || (tour.schedules && tour.schedules[0]) || {
      id: 'sch-default',
      departureDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
      returnDate: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10),
      adultPrice: tour.adultPrice || 3500000,
      childPrice: tour.childPrice || 2500000,
      infantPrice: 0,
      bookedSlots: 0,
      maxCapacity: 30
    };

    const adultCount = Number(numAdults) || 1;
    const childCount = Number(numChildren) || 0;
    const infantCount = Number(numInfants) || 0;
    const totalSeatsNeeded = adultCount + childCount; // Trẻ sơ sinh thường không chiếm ghế riêng

    // KIỂM SOÁT OVERBOOKING REALTIME
    if (schedule && schedule.maxCapacity) {
      const availableSlots = schedule.maxCapacity - (schedule.bookedSlots || 0);
      if (availableSlots < totalSeatsNeeded) {
        return res.status(400).json({
          success: false,
          message: `Rất tiếc! Tour này chỉ còn ${availableSlots} chỗ trống, không đủ cho ${totalSeatsNeeded} hành khách.`
        });
      }
      schedule.bookedSlots = (schedule.bookedSlots || 0) + totalSeatsNeeded;
      if (schedule.bookedSlots >= schedule.maxCapacity) {
        schedule.status = 'SOLD_OUT';
      }
    }

    // Tính tiền
    const baseAmount = clientBaseAmount || (
      adultCount * (schedule.adultPrice || 0) +
      childCount * (schedule.childPrice || 0) +
      infantCount * (schedule.infantPrice || 0)
    );

    let discountAmount = clientDiscountAmount || 0;
    if (couponCode && !clientDiscountAmount) {
      const coupon = couponsData.find(
        (c) => c.code.toUpperCase() === couponCode.toUpperCase().trim() && c.isActive
      );
      if (coupon && baseAmount >= coupon.minOrder) {
        if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = (baseAmount * coupon.discountValue) / 100;
          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
          }
        } else {
          discountAmount = coupon.discountValue;
        }
      }
    }

    const finalAmount = clientFinalAmount || Math.max(0, baseAmount - discountAmount);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingCode = `TWM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomSuffix}`;
    const qrTicketCode = `QR-${bookingCode}-VERIFIED`;
    const departureDate = schedule.departureDate || new Date().toISOString().slice(0, 10);
    const returnDate = schedule.returnDate || new Date().toISOString().slice(0, 10);
    const paymentStatus = paymentMethod === 'CASH' ? 'PENDING' : 'PAID';
    const status = paymentMethod === 'CASH' ? 'PENDING_PAYMENT' : 'CONFIRMED';
    const passengersJson = JSON.stringify(passengers || []);

    let dbBookingId = null;

    // Lưu trực tiếp vào Microsoft SQL Server (TravelWithMe.dbo.bookings)
    try {
      const pool = await getDbPool();
      if (pool) {
        const cleanScheduleId = scheduleId && !isNaN(Number(String(scheduleId).replace(/\D/g, '')))
          ? Number(String(scheduleId).replace(/\D/g, ''))
          : null;

        const result = await pool.request()
          .input('bookingCode', bookingCode)
          .input('userId', Number(userId))
          .input('scheduleId', cleanScheduleId)
          .input('numAdults', adultCount)
          .input('numChildren', childCount)
          .input('numInfants', infantCount)
          .input('subtotal', baseAmount)
          .input('discountAmount', discountAmount)
          .input('totalAmount', finalAmount)
          .input('bookingStatus', status)
          .input('paymentStatus', paymentStatus)
          .input('qrTicketCode', qrTicketCode)
          .input('specialRequests', specialNotes || '')
          .input('tourId', tour.id || tourId)
          .input('tourTitle', tour.title)
          .input('tourImage', tour.thumbnailUrl || tour.image || '')
          .input('departureDate', departureDate)
          .input('returnDate', returnDate)
          .input('contactName', contactName || '')
          .input('contactEmail', contactEmail || '')
          .input('contactPhone', contactPhone || '')
          .input('paymentMethod', paymentMethod || 'VNPAY')
          .input('passengersJson', passengersJson)
          .query(`
            INSERT INTO dbo.bookings (
              booking_code, user_id, schedule_id, num_adults, num_children, num_infants,
              subtotal, discount_amount, total_amount, booking_status, payment_status,
              qr_ticket_code, special_requests, tour_id, tour_title, tour_image,
              departure_date, return_date, contact_name, contact_email, contact_phone,
              payment_method, passengers_json, created_at, updated_at
            )
            OUTPUT INSERTED.booking_id
            VALUES (
              @bookingCode, @userId, @scheduleId, @numAdults, @numChildren, @numInfants,
              @subtotal, @discountAmount, @totalAmount, @bookingStatus, @paymentStatus,
              @qrTicketCode, @specialRequests, @tourId, @tourTitle, @tourImage,
              @departureDate, @returnDate, @contactName, @contactEmail, @contactPhone,
              @paymentMethod, @passengersJson, GETDATE(), GETDATE()
            )
          `);

        if (result.recordset && result.recordset.length > 0) {
          dbBookingId = result.recordset[0].booking_id;
        }
      }
    } catch (sqlErr) {
      console.error('[SQL Server] Lỗi lưu booking vào dbo.bookings:', sqlErr.message);
    }

    const newBooking = {
      id: dbBookingId ? `bk-${dbBookingId}` : `bk-${Date.now()}`,
      bookingId: dbBookingId,
      bookingCode,
      userId: Number(userId),
      tourId: tour.id,
      tourTitle: tour.title,
      tourImage: tour.thumbnailUrl || tour.image || '',
      scheduleId: schedule.id,
      departureDate,
      returnDate,
      numAdults: adultCount,
      numChildren: childCount,
      numInfants: infantCount,
      totalPassengers: adultCount + childCount + infantCount,
      baseAmount,
      discountAmount,
      finalAmount,
      paymentMethod: paymentMethod || 'VNPAY',
      paymentStatus,
      status,
      contactName,
      contactEmail,
      contactPhone,
      specialNotes: specialNotes || '',
      passengers: passengers || [],
      qrCodeToken: qrTicketCode,
      createdAt: new Date().toISOString()
    };

    bookingsData.unshift(newBooking);

    return res.status(201).json({
      success: true,
      message: 'Đặt tour thành công!',
      data: newBooking
    });
  } catch (err) {
    console.error('[POST /api/bookings] Lỗi:', err);
    return res.status(500).json({ success: false, message: 'Lỗi xử lý đặt tour: ' + err.message });
  }
});

// 6. Lấy danh sách chuyến đi của khách hàng (Được lọc theo userId từ SQL Server)
app.get('/api/bookings/my-trips', async (req, res) => {
  const userId = req.query.userId || req.headers['x-user-id'];

  // Nếu không có tài khoản đăng nhập, trả về danh sách rỗng []
  if (!userId) {
    return res.json({
      success: true,
      data: []
    });
  }

  try {
    const pool = await getDbPool();
    if (pool) {
      const result = await pool.request()
        .input('userId', Number(userId))
        .query(`
          SELECT * FROM dbo.bookings
          WHERE user_id = @userId
          ORDER BY created_at DESC
        `);

      const formattedTrips = result.recordset.map((row) => ({
        id: `bk-${row.booking_id}`,
        bookingId: row.booking_id,
        bookingCode: row.booking_code,
        userId: row.user_id,
        tourId: row.tour_id,
        tourTitle: row.tour_title,
        tourImage: row.tour_image,
        scheduleId: row.schedule_id ? `sch-${row.schedule_id}` : null,
        departureDate: row.departure_date,
        returnDate: row.return_date,
        numAdults: row.num_adults,
        numChildren: row.num_children,
        numInfants: row.num_infants,
        totalPassengers: (row.num_adults || 0) + (row.num_children || 0) + (row.num_infants || 0),
        baseAmount: Number(row.subtotal),
        discountAmount: Number(row.discount_amount),
        finalAmount: Number(row.total_amount),
        paymentMethod: row.payment_method,
        paymentStatus: row.payment_status,
        status: row.booking_status,
        contactName: row.contact_name,
        contactEmail: row.contact_email,
        contactPhone: row.contact_phone,
        specialNotes: row.special_requests,
        passengers: row.passengers_json ? JSON.parse(row.passengers_json) : [],
        qrCodeToken: row.qr_ticket_code,
        createdAt: row.created_at
      }));

      return res.json({
        success: true,
        data: formattedTrips
      });
    }
  } catch (sqlErr) {
    console.error('[SQL Server] Lỗi truy vấn my-trips:', sqlErr.message);
  }

  // Fallback: Lọc từ in-memory theo đúng userId của tài khoản đó
  const userBookings = bookingsData.filter((b) => String(b.userId) === String(userId));
  return res.json({
    success: true,
    data: userBookings
  });
});

// 7. Xem chi tiết vé điện tử / Đơn đặt
app.get('/api/bookings/:id', (req, res) => {
  const booking = bookingsData.find(
    (b) => b.id === req.params.id || b.bookingCode === req.params.id
  );
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy vé đặt tour' });
  }
  res.json({ success: true, data: booking });
});

// 8. Hủy tour & Tính toán hoàn tiền (Cập nhật SQL Server & bộ nhớ)
app.post('/api/bookings/:id/cancel', async (req, res) => {
  const booking = bookingsData.find((b) => b.id === req.params.id || b.bookingCode === req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt tour' });
  }

  if (booking.status === 'CANCELLED' || booking.status === 'REFUNDED') {
    return res.status(400).json({ success: false, message: 'Đơn này đã bị hủy trước đó' });
  }

  // Tính số ngày trước khi khởi hành
  const depDate = new Date(booking.departureDate);
  const now = new Date();
  const diffDays = Math.ceil((depDate - now) / (1000 * 60 * 60 * 24));

  let refundPercent = 0;
  let penaltyPercent = 100;

  if (diffDays >= 15) {
    refundPercent = 100;
    penaltyPercent = 0;
  } else if (diffDays >= 7) {
    refundPercent = 70;
    penaltyPercent = 30;
  } else if (diffDays >= 3) {
    refundPercent = 50;
    penaltyPercent = 50;
  } else {
    refundPercent = 0;
    penaltyPercent = 100;
  }

  const refundAmount = (booking.finalAmount * refundPercent) / 100;

  // Cập nhật trạng thái booking
  booking.status = refundPercent > 0 ? 'REFUNDED' : 'CANCELLED';
  booking.refundAmount = refundAmount;
  booking.penaltyPercent = penaltyPercent;

  // Cập nhật vào SQL Server
  try {
    const pool = await getDbPool();
    if (pool) {
      await pool.request()
        .input('code', booking.bookingCode)
        .input('status', booking.status)
        .query(`
          UPDATE dbo.bookings 
          SET booking_status = @status, updated_at = GETDATE()
          WHERE booking_code = @code
        `);
    }
  } catch (sqlErr) {
    console.error('[SQL Server] Lỗi cập nhật hủy booking:', sqlErr.message);
  }

  // Hoàn trả lại số chỗ trống (Inventory)
  const tour = toursData.find((t) => t.id === booking.tourId);
  if (tour) {
    const schedule = tour.schedules.find((s) => s.id === booking.scheduleId);
    if (schedule) {
      schedule.bookedSlots = Math.max(0, schedule.bookedSlots - (booking.numAdults + booking.numChildren));
      schedule.status = 'AVAILABLE';
    }
  }

  res.json({
    success: true,
    message: 'Yêu cầu hủy đơn đã được xử lý theo chính sách',
    data: {
      bookingCode: booking.bookingCode,
      daysBeforeDeparture: diffDays,
      refundPercent,
      penaltyPercent,
      refundAmount,
      status: booking.status
    }
  });
});

// 9. Gửi đánh giá cho tour đã hoàn thành
app.post('/api/reviews', (req, res) => {
  const { bookingId, tourId, rating, comment, photos, authorName } = req.body;

  // Kiểm tra đơn đã hoàn thành chưa
  const booking = bookingsData.find((b) => b.id === bookingId);
  if (!booking || booking.status !== 'COMPLETED') {
    return res.status(403).json({
      success: false,
      message: 'Chỉ du khách đã hoàn thành chuyến đi mới có thể gửi đánh giá'
    });
  }

  const newReview = {
    id: `rev-${Date.now()}`,
    tourId,
    bookingId,
    authorName: authorName || booking.contactName,
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    rating: Number(rating) || 5,
    date: new Date().toLocaleDateString('vi-VN'),
    comment,
    photos: photos || []
  };

  reviewsData.unshift(newReview);

  // Cập nhật điểm rating của tour
  const tour = toursData.find((t) => t.id === tourId);
  if (tour) {
    const tourRevs = reviewsData.filter((r) => r.tourId === tourId);
    const avg = tourRevs.reduce((acc, cur) => acc + cur.rating, 0) / tourRevs.length;
    tour.ratingAverage = Number(avg.toFixed(1));
    tour.reviewCount = tourRevs.length;
  }

  res.status(201).json({
    success: true,
    message: 'Cảm ơn bạn đã gửi đánh giá chuyến đi!',
    data: newReview
  });
});

// 10. Admin: Thống kê & Báo cáo Dashboard
app.get('/api/admin/dashboard', (req, res) => {
  const totalBookings = bookingsData.length;
  const completedOrPaid = bookingsData.filter(
    (b) => b.status === 'CONFIRMED' || b.status === 'PAID' || b.status === 'COMPLETED'
  );
  const totalRevenue = completedOrPaid.reduce((sum, b) => sum + Number(b.finalAmount), 0);
  const cancelledBookings = bookingsData.filter(
    (b) => b.status === 'CANCELLED' || b.status === 'REFUNDED'
  ).length;

  res.json({
    success: true,
    data: {
      summary: {
        totalRevenue,
        totalBookings,
        completedBookings: completedOrPaid.length,
        cancelledBookings,
        cancellationRate: totalBookings ? ((cancelledBookings / totalBookings) * 100).toFixed(1) : 0,
        activeTours: toursData.filter((t) => t.status === 'ACTIVE').length
      },
      revenueChart: [
        { month: 'Tháng 5', revenue: 42000000 },
        { month: 'Tháng 6', revenue: 68000000 },
        { month: 'Tháng 7', revenue: 95000000 },
        { month: 'Tháng 8', revenue: 78000000 },
        { month: 'Tháng 9', revenue: 84000000 },
        { month: 'Tháng 10', revenue: 112000000 }
      ],
      topTours: toursData.slice(0, 3).map((t) => ({
        id: t.id,
        title: t.title,
        bookingsCount: t.reviewCount,
        rating: t.ratingAverage
      }))
    }
  });
});

// 11. Admin: Cập nhật trạng thái đơn đặt
app.patch('/api/admin/bookings/:id/status', (req, res) => {
  const { status } = req.body;
  const booking = bookingsData.find((b) => b.id === req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
  }

  booking.status = status;
  res.json({
    success: true,
    message: `Cập nhật trạng thái đơn thành ${status} thành công`,
    data: booking
  });
});

// ============================================================================
// PHÂN HỆ PHÂN QUYỀN – RBAC QUERIES (read-only, served by index.js)
// Full register/login/forgot/reset handled by /api/auth router above
// ============================================================================

// Lấy danh sách vai trò hệ thống từ SQL Server
app.get('/api/auth/roles', async (req, res) => {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT role_id, role_name, description FROM dbo.roles ORDER BY role_id ASC;
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Lấy danh sách người dùng kèm vai trò từ SQL Server
app.get('/api/auth/users', async (req, res) => {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT 
        u.user_id,
        u.full_name,
        u.email,
        u.phone_number,
        r.role_id,
        r.role_name,
        r.description AS role_description,
        u.is_active,
        u.created_at
      FROM dbo.users u
      INNER JOIN dbo.roles r ON u.role_id = r.role_id
      ORDER BY r.role_id ASC, u.user_id ASC;
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API Đăng nhập phân quyền
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email đăng nhập' });
  }

  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input('email', email.trim().toLowerCase())
      .query(`
        SELECT 
          u.user_id,
          u.full_name,
          u.email,
          u.phone_number,
          u.password_hash,
          r.role_id,
          r.role_name,
          r.description AS role_description,
          u.is_active
        FROM dbo.users u
        INNER JOIN dbo.roles r ON u.role_id = r.role_id
        WHERE LOWER(u.email) = @email;
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại trong hệ thống' });
    }

    const user = result.recordset[0];
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị tạm khóa' });
    }

    res.json({
      success: true,
      message: `Đăng nhập thành công với vai trò ${user.role_name}`,
      data: {
        userId: user.user_id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone_number,
        role: user.role_name,
        roleDescription: user.role_description,
        isAdmin: user.role_name === 'SUPER_ADMIN' || user.role_name === 'ADMIN',
        isStaff: user.role_name === 'STAFF',
        isUser: user.role_name === 'USER'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 12. Kiểm tra kết nối SQL Server
app.get('/api/db/health', async (req, res) => {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT 
        DB_NAME() AS current_database,
        (SELECT COUNT(*) FROM sys.tables) AS total_tables
    `);
    res.json({
      success: true,
      status: 'CONNECTED',
      database: result.recordset[0].current_database,
      totalTables: result.recordset[0].total_tables,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      status: 'DISCONNECTED',
      error: err.message
    });
  }
});

app.listen(PORT, async () => {
  console.log(`[Travel With Me API] Server running at http://localhost:${PORT}`);
  try {
    const pool = await getDbPool();
    console.log('[Travel With Me API] ✅ Đã kết nối thành công với Microsoft SQL Server (Database: TravelWithMe)!');
  } catch (err) {
    console.warn('[Travel With Me API] ⚠️ Chưa thể kết nối SQL Server:', err.message);
  }
});
