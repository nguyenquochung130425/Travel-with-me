import express from 'express';
import cors from 'cors';
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

// In-memory data store for live state changes
let toursData = JSON.parse(JSON.stringify(mockTours));
let bookingsData = JSON.parse(JSON.stringify(mockUserBookings));
let reviewsData = JSON.parse(JSON.stringify(mockReviews));
let couponsData = JSON.parse(JSON.stringify(mockCoupons));

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

// 5. Đặt tour (Booking Creation & Concurrency Check)
app.post('/api/bookings', (req, res) => {
  const {
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
    passengers
  } = req.body;

  // Tìm tour & schedule
  const tour = toursData.find((t) => t.id === tourId);
  if (!tour) {
    return res.status(404).json({ success: false, message: 'Tour không tồn tại' });
  }

  const schedule = tour.schedules.find((s) => s.id === scheduleId);
  if (!schedule) {
    return res.status(404).json({ success: false, message: 'Lịch khởi hành không tồn tại' });
  }

  const adultCount = Number(numAdults) || 1;
  const childCount = Number(numChildren) || 0;
  const infantCount = Number(numInfants) || 0;
  const totalSeatsNeeded = adultCount + childCount; // Trẻ sơ sinh thường không chiếm ghế riêng

  // KIỂM SOÁT OVERBOOKING REALTIME
  const availableSlots = schedule.maxCapacity - schedule.bookedSlots;
  if (availableSlots < totalSeatsNeeded) {
    return res.status(400).json({
      success: false,
      message: `Rất tiếc! Tour này chỉ còn ${availableSlots} chỗ trống, không đủ cho ${totalSeatsNeeded} hành khách.`
    });
  }

  // Tính tiền
  const baseAmount =
    adultCount * schedule.adultPrice +
    childCount * schedule.childPrice +
    infantCount * schedule.infantPrice;

  let discountAmount = 0;
  if (couponCode) {
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

  const finalAmount = Math.max(0, baseAmount - discountAmount);

  // Cập nhật số chỗ trống (Inventory)
  schedule.bookedSlots += totalSeatsNeeded;
  if (schedule.bookedSlots >= schedule.maxCapacity) {
    schedule.status = 'SOLD_OUT';
  }

  const bookingId = `bk-${Date.now()}`;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const bookingCode = `TWM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomSuffix}`;
  const qrCodeToken = `QR-${bookingCode}-VERIFIED`;

  const newBooking = {
    id: bookingId,
    bookingCode,
    tourId: tour.id,
    tourTitle: tour.title,
    tourImage: tour.thumbnailUrl,
    scheduleId: schedule.id,
    departureDate: schedule.departureDate,
    returnDate: schedule.returnDate,
    numAdults: adultCount,
    numChildren: childCount,
    numInfants: infantCount,
    totalPassengers: adultCount + childCount + infantCount,
    baseAmount,
    discountAmount,
    finalAmount,
    paymentMethod: paymentMethod || 'VNPAY',
    paymentStatus: paymentMethod === 'CASH' ? 'PENDING' : 'PAID',
    status: paymentMethod === 'CASH' ? 'PENDING_PAYMENT' : 'CONFIRMED',
    contactName,
    contactEmail,
    contactPhone,
    specialNotes: specialNotes || '',
    passengers: passengers || [],
    qrCodeToken,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
  };

  bookingsData.unshift(newBooking);

  res.status(201).json({
    success: true,
    message: 'Đặt tour thành công!',
    data: newBooking
  });
});

// 6. Lấy danh sách chuyến đi của khách hàng
app.get('/api/bookings/my-trips', (req, res) => {
  res.json({
    success: true,
    data: bookingsData
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

// 8. Hủy tour & Tính toán hoàn tiền
app.post('/api/bookings/:id/cancel', (req, res) => {
  const booking = bookingsData.find((b) => b.id === req.params.id);
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

app.listen(PORT, () => {
  console.log(`[Travel With Me API] Server running at http://localhost:${PORT}`);
});
