import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getDbPool, sql } from './db.js';
import authRouter, { requireAdmin } from './auth.js';
import { cache, cacheMiddleware } from './cache.js';
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

function createSlug(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function mapSqlTourRows(tourRows, scheduleRows, imageRows, itineraryRows) {
  return tourRows.map((row) => ({
    id: `dbtour-${row.tour_id}`,
    source: 'database',
    title: row.title,
    slug: row.slug,
    categoryId: `dbcat-${row.category_id}`,
    categoryName: row.category_name,
    departureCity: row.departure_location,
    destinationCity: row.destination_name,
    durationDays: row.duration_days,
    durationNights: row.duration_nights,
    transportType: row.transportation,
    tourType: row.tour_type,
    ratingAverage: Number(row.rating_avg),
    reviewCount: row.total_reviews,
    isFeatured: Boolean(row.is_featured),
    isActive: Boolean(row.is_active),
    thumbnailUrl: row.thumbnail_url || '',
    albumImages: imageRows
      .filter((image) => image.tour_id === row.tour_id)
      .map((image) => image.image_url),
    overviewDescription: row.overview_description || '',
    inclusions: row.inclusions || '',
    exclusions: row.exclusions || '',
    cancellationPolicy: row.cancellation_policy || '',
    schedules: scheduleRows
      .filter((schedule) => schedule.tour_id === row.tour_id)
      .map((schedule) => ({
        id: `dbsch-${schedule.schedule_id}`,
        departureDate: schedule.departure_date.toISOString().slice(0, 10),
        returnDate: schedule.return_date.toISOString().slice(0, 10),
        adultPrice: Number(schedule.adult_price),
        childPrice: Number(schedule.child_price),
        infantPrice: Number(schedule.infant_price),
        maxCapacity: schedule.max_capacity,
        minCapacity: schedule.min_capacity,
        bookedSlots: schedule.booked_slots,
        status: schedule.status
      })),
    itineraries: itineraryRows
      .filter((itinerary) => itinerary.tour_id === row.tour_id)
      .map((itinerary) => ({
        dayNumber: itinerary.day_number,
        title: itinerary.day_title,
        description: itinerary.description,
        activities: (() => {
          if (!itinerary.activities) return [];
          try {
            return JSON.parse(itinerary.activities);
          } catch {
            return String(itinerary.activities).split(',').map((s) => s.trim()).filter(Boolean);
          }
        })(),
        meals: itinerary.meals || '',
        hotel: itinerary.hotel || ''
      }))
  }));
}

async function getSqlTours(includeInactive = false) {
  const pool = await getDbPool();
  const tourResult = await pool.request()
    .input('includeInactive', sql.Bit, includeInactive)
    .query(`
      SELECT t.tour_id, t.title, t.slug, t.category_id, c.category_name,
             t.destination_id, d.destination_name, t.duration_days, t.duration_nights,
             t.departure_location, t.transportation, t.inclusions, t.exclusions,
             t.cancellation_policy, t.thumbnail_url, t.rating_avg, t.total_reviews,
             t.is_active, t.overview_description, t.tour_type, t.is_featured
      FROM dbo.tours t
      INNER JOIN dbo.categories c ON c.category_id = t.category_id
      INNER JOIN dbo.destinations d ON d.destination_id = t.destination_id
      WHERE @includeInactive = 1 OR t.is_active = 1
      ORDER BY t.created_at DESC;
    `);

  if (tourResult.recordset.length === 0) return [];

  const ids = tourResult.recordset.map((tour) => tour.tour_id);
  const tourIdList = ids.map((_, index) => `@tourId${index}`).join(', ');
  const bindTourIds = (request) => {
    ids.forEach((id, index) => request.input(`tourId${index}`, sql.BigInt, id));
    return request;
  };
  const [scheduleResult, imageResult, itineraryResult] = await Promise.all([
    bindTourIds(pool.request())
      .query(`
        SELECT s.schedule_id, s.tour_id, s.departure_date, s.return_date,
               s.adult_price, s.child_price, s.infant_price, s.max_capacity,
               s.min_capacity, s.booked_slots, s.status
        FROM dbo.tour_schedules s
        WHERE s.tour_id IN (${tourIdList});
      `),
    bindTourIds(pool.request())
      .query(`
        SELECT image_id, tour_id, image_url
        FROM dbo.tour_images
        WHERE tour_id IN (${tourIdList})
        ORDER BY image_id;
      `),
    bindTourIds(pool.request())
      .query(`
        SELECT itinerary_id, tour_id, day_number, day_title, description, activities, meals, hotel
        FROM dbo.tour_itineraries
        WHERE tour_id IN (${tourIdList})
        ORDER BY day_number;
      `)
  ]);

  return mapSqlTourRows(
    tourResult.recordset,
    scheduleResult.recordset,
    imageResult.recordset,
    itineraryResult.recordset
  );
}

function validateTourPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Dữ liệu tour không hợp lệ';
  }
  const requiredText = [
    'title', 'categoryName', 'destinationCity', 'departureCity',
    'transportType', 'overviewDescription', 'thumbnailUrl'
  ];
  if (requiredText.some((key) => typeof body[key] !== 'string' || !body[key].trim())) {
    return 'Vui lòng nhập đầy đủ tên tour, danh mục, điểm đến, điểm khởi hành, phương tiện, mô tả và ảnh đại diện';
  }
  if (body.title.trim().length > 200 || body.categoryName.trim().length > 100 ||
      body.destinationCity.trim().length > 100 || body.departureCity.trim().length > 150 ||
      body.thumbnailUrl.trim().length > 500) {
    return 'Một số nội dung vượt quá giới hạn độ dài cho phép';
  }
  if (!['BUS', 'PLANE', 'TRAIN', 'MIXED'].includes(body.transportType) ||
      !['RESORT', 'TREKKING', 'CULTURAL', 'FOOD', 'FAMILY'].includes(body.tourType || 'RESORT')) {
    return 'Phương tiện hoặc loại hình tour không hợp lệ';
  }
  if (!Number.isInteger(Number(body.durationDays)) || Number(body.durationDays) < 1 ||
      !Number.isInteger(Number(body.durationNights)) || Number(body.durationNights) < 0) {
    return 'Thời lượng tour không hợp lệ';
  }
  if (!Array.isArray(body.schedules) || body.schedules.length === 0) {
    return 'Tour cần có ít nhất một lịch khởi hành';
  }
  for (const schedule of body.schedules) {
    const departureDate = new Date(schedule.departureDate);
    const returnDate = new Date(schedule.returnDate);
    if (!schedule.departureDate || !schedule.returnDate ||
        Number.isNaN(departureDate.getTime()) || Number.isNaN(returnDate.getTime()) ||
        returnDate < departureDate ||
        !Number.isFinite(Number(schedule.adultPrice)) || Number(schedule.adultPrice) < 0 ||
        !Number.isFinite(Number(schedule.childPrice)) || Number(schedule.childPrice) < 0 ||
        !Number.isFinite(Number(schedule.infantPrice)) || Number(schedule.infantPrice) < 0 ||
        !Number.isInteger(Number(schedule.maxCapacity)) || Number(schedule.maxCapacity) < 1 ||
        !Number.isInteger(Number(schedule.minCapacity)) || Number(schedule.minCapacity) < 0 ||
        Number(schedule.minCapacity) > Number(schedule.maxCapacity)) {
      return 'Thông tin lịch khởi hành, giá hoặc sức chứa không hợp lệ';
    }
  }
  if (body.albumImages !== undefined &&
      (!Array.isArray(body.albumImages) || body.albumImages.some((image) => typeof image !== 'string' || image.length > 500))) {
    return 'Danh sách ảnh tour không hợp lệ';
  }
  if (body.itineraries !== undefined) {
    if (!Array.isArray(body.itineraries)) return 'Lịch trình tour không hợp lệ';
    const days = new Set();
    for (const itinerary of body.itineraries) {
      const dayNumber = Number(itinerary.dayNumber);
      if (!Number.isInteger(dayNumber) || dayNumber < 1 ||
          dayNumber > Number(body.durationDays) ||
          typeof itinerary.title !== 'string' || !itinerary.title.trim() || itinerary.title.length > 200 ||
          typeof itinerary.description !== 'string' || !itinerary.description.trim() ||
          (itinerary.activities !== undefined &&
            (!Array.isArray(itinerary.activities) || itinerary.activities.some((activity) => typeof activity !== 'string'))) ||
          days.has(dayNumber)) {
        return 'Thông tin ngày trong lịch trình không hợp lệ hoặc bị trùng';
      }
      days.add(dayNumber);
    }
  }
  return null;
}

async function ensureCategoryAndDestination(transaction, body) {
  const categoryName = body.categoryName.trim();
  const destinationName = body.destinationCity.trim();
  const category = await new sql.Request(transaction)
    .input('categoryName', sql.NVarChar(100), categoryName)
    .query(`
      SELECT category_id FROM dbo.categories WHERE category_name = @categoryName;
    `);
  let categoryId = category.recordset[0]?.category_id;
  if (!categoryId) {
    const categorySlug = createSlug(categoryName);
    const inserted = await new sql.Request(transaction)
      .input('categoryName', sql.NVarChar(100), categoryName)
      .input('categorySlug', sql.VarChar(120), `${categorySlug}-${Date.now().toString(36)}`)
      .query(`
        INSERT INTO dbo.categories (category_name, slug)
        OUTPUT INSERTED.category_id
        VALUES (@categoryName, @categorySlug);
      `);
    categoryId = inserted.recordset[0].category_id;
  }

  const destination = await new sql.Request(transaction)
    .input('destinationName', sql.NVarChar(100), destinationName)
    .query(`
      SELECT TOP 1 destination_id FROM dbo.destinations
      WHERE destination_name = @destinationName ORDER BY destination_id;
    `);
  let destinationId = destination.recordset[0]?.destination_id;
  if (!destinationId) {
    const inserted = await new sql.Request(transaction)
      .input('destinationName', sql.NVarChar(100), destinationName)
      .query(`
        INSERT INTO dbo.destinations (destination_name, region)
        OUTPUT INSERTED.destination_id
        VALUES (@destinationName, N'Toàn quốc');
      `);
    destinationId = inserted.recordset[0].destination_id;
  }

  return { categoryId, destinationId };
}

async function saveTourSchedules(transaction, tourId, schedules) {
  const existingResult = await new sql.Request(transaction)
    .input('tourId', sql.BigInt, tourId)
    .query('SELECT schedule_id, booked_slots, hold_slots, status FROM dbo.tour_schedules WHERE tour_id = @tourId;');
  const existing = new Map(existingResult.recordset.map((row) => [String(row.schedule_id), row]));
  const retainedIds = new Set();

  for (const schedule of schedules) {
    const rawId = schedule.id ? String(schedule.id).replace(/^(dbsch-|sch-)/, '') : '';
    const cleanId = /^\d+$/.test(rawId) ? rawId : '';
    const current = cleanId ? existing.get(cleanId) : null;
    const maxCapacity = Number(schedule.maxCapacity) || 20;
    if (current && maxCapacity < (current.booked_slots || 0) + (current.hold_slots || 0)) {
      throw Object.assign(new Error('Sức chứa không thể thấp hơn số chỗ đã đặt hoặc đang giữ'), { statusCode: 409 });
    }
    const request = new sql.Request(transaction)
      .input('tourId', sql.BigInt, tourId)
      .input('departureDate', sql.Date, schedule.departureDate)
      .input('returnDate', sql.Date, schedule.returnDate)
      .input('adultPrice', sql.Decimal(18, 2), Number(schedule.adultPrice))
      .input('childPrice', sql.Decimal(18, 2), Number(schedule.childPrice))
      .input('infantPrice', sql.Decimal(18, 2), Number(schedule.infantPrice))
      .input('maxCapacity', sql.Int, maxCapacity)
      .input('minCapacity', sql.Int, Number(schedule.minCapacity));

    if (current) {
      retainedIds.add(cleanId);
      await request
        .input('scheduleId', sql.BigInt, cleanId)
        .query(`
          UPDATE dbo.tour_schedules
          SET departure_date = @departureDate, return_date = @returnDate,
              adult_price = @adultPrice, child_price = @childPrice, infant_price = @infantPrice,
              max_capacity = @maxCapacity, min_capacity = @minCapacity,
              status = CASE
                WHEN status IN ('COMPLETED', 'CANCELLED') THEN status
                WHEN booked_slots + hold_slots >= @maxCapacity THEN 'SOLD_OUT'
                ELSE 'AVAILABLE'
              END
          WHERE schedule_id = @scheduleId AND tour_id = @tourId;
        `);
    } else {
      await request.query(`
        INSERT INTO dbo.tour_schedules (
          tour_id, departure_date, return_date, adult_price, child_price, infant_price,
          max_capacity, min_capacity, booked_slots, hold_slots, status
        )
        VALUES (
          @tourId, @departureDate, @returnDate, @adultPrice, @childPrice, @infantPrice,
          @maxCapacity, @minCapacity, 0, 0, 'AVAILABLE'
        );
      `);
    }
  }

  for (const [id] of existing) {
    if (retainedIds.has(id)) continue;
    const bookingResult = await new sql.Request(transaction)
      .input('scheduleId', sql.BigInt, id)
      .query('SELECT COUNT_BIG(*) AS booking_count FROM dbo.bookings WHERE schedule_id = @scheduleId;');
    if (Number(bookingResult.recordset[0].booking_count) > 0) {
      throw Object.assign(new Error('Không thể xóa lịch khởi hành đã có đơn đặt tour'), { statusCode: 409 });
    }
    await new sql.Request(transaction)
      .input('scheduleId', sql.BigInt, id)
      .query('DELETE FROM dbo.tour_schedules WHERE schedule_id = @scheduleId;');
  }
}

async function saveTourImages(transaction, tourId, images) {
  await new sql.Request(transaction)
    .input('tourId', sql.BigInt, tourId)
    .query('DELETE FROM dbo.tour_images WHERE tour_id = @tourId;');
  for (const imageUrl of images || []) {
    if (!imageUrl.trim()) continue;
    await new sql.Request(transaction)
      .input('tourId', sql.BigInt, tourId)
      .input('imageUrl', sql.NVarChar(500), imageUrl.trim())
      .query(`
        INSERT INTO dbo.tour_images (tour_id, image_url, is_thumbnail)
        VALUES (@tourId, @imageUrl, 0);
      `);
  }
}

async function saveTourItineraries(transaction, tourId, itineraries) {
  await new sql.Request(transaction)
    .input('tourId', sql.BigInt, tourId)
    .query('DELETE FROM dbo.tour_itineraries WHERE tour_id = @tourId;');
  for (const itinerary of itineraries || []) {
    const dayNumber = Number(itinerary.dayNumber) || 1;
    const dayTitle = (itinerary.title || itinerary.dayTitle || `Ngày ${dayNumber}`).trim();
    const description = (itinerary.description || '').trim();
    let activitiesStr = '[]';
    if (Array.isArray(itinerary.activities)) {
      activitiesStr = JSON.stringify(itinerary.activities);
    } else if (typeof itinerary.activitiesText === 'string' && itinerary.activitiesText.trim()) {
      activitiesStr = JSON.stringify(itinerary.activitiesText.split(',').map((s) => s.trim()).filter(Boolean));
    }

    await new sql.Request(transaction)
      .input('tourId', sql.BigInt, tourId)
      .input('dayNumber', sql.Int, dayNumber)
      .input('dayTitle', sql.NVarChar(200), dayTitle)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('activities', sql.NVarChar(sql.MAX), activitiesStr)
      .input('meals', sql.NVarChar(100), itinerary.meals || '')
      .input('hotel', sql.NVarChar(200), itinerary.hotel || '')
      .query(`
        INSERT INTO dbo.tour_itineraries (tour_id, day_number, day_title, description, activities, meals, hotel)
        VALUES (@tourId, @dayNumber, @dayTitle, @description, @activities, @meals, @hotel);
      `);
  }
}

async function executeTourWrite(req, res, operation) {
  const validationMessage = validateTourPayload(req.body);
  if (validationMessage) {
    return res.status(400).json({ success: false, message: validationMessage });
  }

  let transaction;
  let transactionStarted = false;
  try {
    transaction = new sql.Transaction(await getDbPool());
    await transaction.begin();
    transactionStarted = true;
    const { categoryId, destinationId } = await ensureCategoryAndDestination(transaction, req.body);
    const firstSchedule = req.body.schedules[0];
    const tourId = await operation(transaction, categoryId, destinationId, firstSchedule);
    await saveTourSchedules(transaction, tourId, req.body.schedules);
    await saveTourImages(transaction, tourId, req.body.albumImages || []);
    await saveTourItineraries(transaction, tourId, req.body.itineraries || []);
    await transaction.commit();
    cache.del('tours'); // Xóa cache danh sách tour sau khi cập nhật
    return res.json({ success: true, message: 'Lưu tour thành công' });
  } catch (err) {
    if (transactionStarted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('[Admin tours] Lỗi rollback transaction:', rollbackError.message);
      }
    }
    console.error('[Admin tours] Lỗi lưu tour:', err.message);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Không thể lưu tour vào SQL Server' });
  }
}

// Helper chuyển đổi dòng dữ liệu từ SQL Server dbo.bookings sang đối tượng chuẩn
export function mapDbBookingRow(row) {
  let passengers = [];
  if (row.passengers_json) {
    try {
      passengers = typeof row.passengers_json === 'string' ? JSON.parse(row.passengers_json) : row.passengers_json;
    } catch {
      passengers = [];
    }
  }

  let departureDateStr = row.departure_date;
  if (row.departure_date instanceof Date) {
    departureDateStr = row.departure_date.toISOString().slice(0, 10);
  }
  let returnDateStr = row.return_date;
  if (row.return_date instanceof Date) {
    returnDateStr = row.return_date.toISOString().slice(0, 10);
  }

  return {
    id: `bk-${row.booking_id}`,
    bookingId: row.booking_id,
    bookingCode: row.booking_code,
    userId: row.user_id,
    tourId: row.tour_id,
    tourTitle: row.tour_title,
    tourImage: row.tour_image,
    scheduleId: row.schedule_id ? `sch-${row.schedule_id}` : null,
    departureDate: departureDateStr,
    returnDate: returnDateStr,
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
    passengers,
    qrCodeToken: row.qr_ticket_code,
    createdAt: row.created_at
  };
}

// Khởi tạo và nạp dữ liệu từ SQL Server dbo.bookings nếu có
getDbPool().then(async (pool) => {
  if (pool) {
    try {
      const res = await pool.request().query('SELECT * FROM dbo.bookings ORDER BY created_at DESC');
      if (res.recordset && res.recordset.length > 0) {
        bookingsData = res.recordset.map(mapDbBookingRow);
        console.log(`[SQL Server] Đã nạp ${bookingsData.length} đơn đặt tour từ database TravelWithMe`);
      }
    } catch (e) {
      console.error('[SQL Server] Lỗi nạp bookings ban đầu:', e.message);
    }
  }
}).catch(() => {});

// 1. Lấy danh sách danh mục (Áp dụng Cache 5 phút)
app.get('/api/categories', cacheMiddleware(300, 'categories'), async (req, res) => {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT category_id, category_name, slug, description
      FROM dbo.categories
      ORDER BY category_id;
    `);
    const databaseCategories = result.recordset.map((row) => ({
      id: `dbcat-${row.category_id}`,
      name: row.category_name,
      slug: row.slug,
      description: row.description || '',
      region: 'Toàn quốc'
    }));
    const dbCatNames = new Set(databaseCategories.map((c) => c.name.toLowerCase().trim()));
    const nonDupMockCategories = mockCategories.filter((m) => !dbCatNames.has(m.name.toLowerCase().trim()));
    res.json({ success: true, data: [...databaseCategories, ...nonDupMockCategories] });
  } catch (err) {
    console.error('[GET /api/categories] Không tải được danh mục từ SQL Server:', err.message);
    res.json({ success: true, data: mockCategories });
  }
});

// 2. Lấy danh sách Tours (Áp dụng Cache 60s, hỗ trợ lọc & sắp xếp, ưu tiên SQL Server, loại bỏ trùng lặp)
app.get('/api/tours', cacheMiddleware(60, 'tours'), async (req, res) => {
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

  let databaseTours = [];
  try {
    databaseTours = await getSqlTours();
  } catch (err) {
    console.error('[GET /api/tours] Không tải được tour từ SQL Server:', err.message);
  }
  
  let results = [];
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

app.get('/api/admin/tours', requireAdmin, async (req, res) => {
  try {
    const tours = await getSqlTours(true);
    res.json({ success: true, data: tours });
  } catch (err) {
    console.error('[GET /api/admin/tours] Lỗi:', err.message);
    res.status(500).json({ success: false, message: 'Không thể tải danh sách tour từ SQL Server' });
  }
});

app.post('/api/admin/tours', requireAdmin, async (req, res) => {
  return executeTourWrite(req, res, async (transaction, categoryId, destinationId, firstSchedule) => {
    const result = await new sql.Request(transaction)
      .input('title', sql.NVarChar(200), req.body.title.trim())
      .input('slug', sql.VarChar(220), `${createSlug(req.body.title)}-${Date.now().toString(36)}`)
      .input('categoryId', sql.Int, categoryId)
      .input('destinationId', sql.Int, destinationId)
      .input('durationDays', sql.Int, Number(req.body.durationDays))
      .input('durationNights', sql.Int, Number(req.body.durationNights))
      .input('departureLocation', sql.NVarChar(150), req.body.departureCity.trim())
      .input('transportation', sql.NVarChar(100), req.body.transportType)
      .input('adultPrice', sql.Decimal(18, 2), Number(firstSchedule.adultPrice))
      .input('childPrice', sql.Decimal(18, 2), Number(firstSchedule.childPrice))
      .input('infantPrice', sql.Decimal(18, 2), Number(firstSchedule.infantPrice))
      .input('overviewDescription', sql.NVarChar(sql.MAX), req.body.overviewDescription.trim())
      .input('inclusions', sql.NVarChar(sql.MAX), req.body.inclusions || '')
      .input('exclusions', sql.NVarChar(sql.MAX), req.body.exclusions || '')
      .input('cancellationPolicy', sql.NVarChar(sql.MAX), req.body.cancellationPolicy || '')
      .input('thumbnailUrl', sql.NVarChar(500), req.body.thumbnailUrl.trim())
      .input('tourType', sql.VarChar(30), req.body.tourType || 'RESORT')
      .input('isFeatured', sql.Bit, Boolean(req.body.isFeatured))
      .query(`
        INSERT INTO dbo.tours (
          title, slug, category_id, destination_id, duration_days, duration_nights,
          departure_location, transportation, adult_price, child_price, infant_price,
          overview_description, inclusions, exclusions, cancellation_policy,
          thumbnail_url, tour_type, is_featured
        )
        OUTPUT INSERTED.tour_id
        VALUES (
          @title, @slug, @categoryId, @destinationId, @durationDays, @durationNights,
          @departureLocation, @transportation, @adultPrice, @childPrice, @infantPrice,
          @overviewDescription, @inclusions, @exclusions, @cancellationPolicy,
          @thumbnailUrl, @tourType, @isFeatured
        );
      `);
    return result.recordset[0].tour_id;
  });
});

app.put('/api/admin/tours/:id', requireAdmin, async (req, res) => {
  const tourId = String(req.params.id).replace(/^(dbtour-|tour-)/, '');
  if (!/^\d+$/.test(tourId)) {
    return res.status(400).json({ success: false, message: 'Mã tour không hợp lệ' });
  }
  return executeTourWrite(req, res, async (transaction, categoryId, destinationId, firstSchedule) => {
    const result = await new sql.Request(transaction)
      .input('tourId', sql.BigInt, tourId)
      .input('title', sql.NVarChar(200), req.body.title.trim())
      .input('categoryId', sql.Int, categoryId)
      .input('destinationId', sql.Int, destinationId)
      .input('durationDays', sql.Int, Number(req.body.durationDays))
      .input('durationNights', sql.Int, Number(req.body.durationNights))
      .input('departureLocation', sql.NVarChar(150), req.body.departureCity.trim())
      .input('transportation', sql.NVarChar(100), req.body.transportType)
      .input('adultPrice', sql.Decimal(18, 2), Number(firstSchedule.adultPrice))
      .input('childPrice', sql.Decimal(18, 2), Number(firstSchedule.childPrice))
      .input('infantPrice', sql.Decimal(18, 2), Number(firstSchedule.infantPrice))
      .input('overviewDescription', sql.NVarChar(sql.MAX), req.body.overviewDescription.trim())
      .input('inclusions', sql.NVarChar(sql.MAX), req.body.inclusions || '')
      .input('exclusions', sql.NVarChar(sql.MAX), req.body.exclusions || '')
      .input('cancellationPolicy', sql.NVarChar(sql.MAX), req.body.cancellationPolicy || '')
      .input('thumbnailUrl', sql.NVarChar(500), req.body.thumbnailUrl.trim())
      .input('tourType', sql.VarChar(30), req.body.tourType || 'RESORT')
      .input('isFeatured', sql.Bit, Boolean(req.body.isFeatured))
      .query(`
        UPDATE dbo.tours
        SET title = @title, category_id = @categoryId, destination_id = @destinationId,
            duration_days = @durationDays, duration_nights = @durationNights,
            departure_location = @departureLocation, transportation = @transportation,
            adult_price = @adultPrice, child_price = @childPrice, infant_price = @infantPrice,
            overview_description = @overviewDescription, inclusions = @inclusions,
            exclusions = @exclusions, cancellation_policy = @cancellationPolicy,
            thumbnail_url = @thumbnailUrl, tour_type = @tourType, is_featured = @isFeatured,
            updated_at = GETDATE()
        OUTPUT INSERTED.tour_id
        WHERE tour_id = @tourId;
      `);
    if (result.recordset.length === 0) {
      throw Object.assign(new Error('Không tìm thấy tour trong hệ thống SQL Server'), { statusCode: 404 });
    }
    return result.recordset[0].tour_id;
  });
});

app.delete('/api/admin/tours/:id', requireAdmin, async (req, res) => {
  const tourId = String(req.params.id).replace(/^(dbtour-|tour-)/, '');
  if (!/^\d+$/.test(tourId)) {
    return res.status(400).json({ success: false, message: 'Mã tour không hợp lệ' });
  }
  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input('tourId', sql.BigInt, tourId)
      .query(`
        UPDATE dbo.tours
        SET is_active = 0, updated_at = GETDATE()
        WHERE tour_id = @tourId AND is_active = 1;
      `);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tour đang hoạt động' });
    }
    res.json({ success: true, message: 'Đã ngừng kinh doanh tour' });
  } catch (err) {
    console.error('[DELETE /api/admin/tours/:id] Lỗi:', err.message);
    res.status(500).json({ success: false, message: 'Không thể ngừng kinh doanh tour trong SQL Server' });
  }
});

// 3. Lấy chi tiết 1 Tour (Ưu tiên SQL Server)
app.get('/api/tours/:id', async (req, res) => {
  let tour = null;
  try {
    const databaseTours = await getSqlTours(true);
    const target = String(req.params.id);
    const targetNum = target.replace(/^(dbtour-|tour-)/, '');
    tour = databaseTours.find(
      (t) =>
        t.id === target ||
        t.slug === target ||
        t.id === `dbtour-${targetNum}` ||
        String(t.tourId) === targetNum
    );
  } catch (err) {
    console.error('[GET /api/tours/:id] Không tải được tour từ SQL Server:', err.message);
  }

  if (!tour) {
    tour = toursData.find(
      (t) => t.id === req.params.id || t.slug === req.params.id
    );
  }
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
    let tour = toursData.find((t) => t.id === tourId);
    if (!tour && /^dbtour-\d+$/.test(String(tourId))) {
      try {
        tour = (await getSqlTours()).find((item) => item.id === tourId);
      } catch (err) {
        console.error('[POST /api/bookings] Không tải được tour từ SQL Server:', err.message);
        return res.status(500).json({ success: false, message: 'Không thể tải thông tin tour để đặt chỗ' });
      }
    }
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

      const formattedTrips = result.recordset.map(mapDbBookingRow);

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

// ─────────────────────────────────────────────────────────────────────────────
// 9. PHÂN HỆ ĐÁNH GIÁ & KIỂM DUYỆT (ADVANCED REVIEWS & MODERATION)
// ─────────────────────────────────────────────────────────────────────────────

// 9.1. Lấy danh sách đánh giá của Tour (Chỉ trả về các đánh giá đã kiểm duyệt is_visible = 1)
app.get('/api/reviews', async (req, res) => {
  const { tourId } = req.query;
  try {
    const pool = await getDbPool();
    if (pool) {
      let query = `
        SELECT r.review_id, r.tour_id, r.booking_id, r.user_id, r.author_name, r.author_avatar,
               r.rating, r.comment, r.is_visible, r.admin_reply, r.admin_reply_at, r.created_at
        FROM dbo.reviews r
        WHERE r.is_visible = 1
      `;
      if (tourId) {
        query += ` AND (r.tour_id = @tourId OR r.tour_id = @rawTourId)`;
      }
      query += ` ORDER BY r.created_at DESC;`;

      const request = pool.request();
      if (tourId) {
        const rawId = String(tourId).replace(/^(dbtour-|tour-)/, '');
        request.input('tourId', sql.VarChar(100), String(tourId));
        request.input('rawTourId', sql.VarChar(100), rawId);
      }

      const revResult = await request.query(query);
      const imagesResult = await pool.request().query('SELECT review_id, image_url FROM dbo.review_images;');

      const sqlReviews = revResult.recordset.map((r) => {
        const photos = imagesResult.recordset
          .filter((img) => img.review_id === r.review_id)
          .map((img) => img.image_url);

        return {
          id: `rev-${r.review_id}`,
          reviewId: r.review_id,
          tourId: r.tour_id,
          bookingId: r.booking_id,
          userId: r.user_id,
          authorName: r.author_name,
          authorAvatar: r.author_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          rating: Number(r.rating),
          comment: r.comment,
          photos,
          adminReply: r.admin_reply || null,
          adminReplyAt: r.admin_reply_at ? new Date(r.admin_reply_at).toLocaleDateString('vi-VN') : null,
          date: new Date(r.created_at).toLocaleDateString('vi-VN'),
          isVisible: Boolean(r.is_visible),
          isVerifiedCompleted: true
        };
      });

      if (sqlReviews.length > 0) {
        return res.json({ success: true, data: sqlReviews });
      }
    }
  } catch (err) {
    console.error('[GET /api/reviews] Lỗi SQL Server:', err.message);
  }

  // Fallback in-memory
  let list = reviewsData.filter((r) => r.isVisible !== false);
  if (tourId) {
    list = list.filter((r) => r.tourId === tourId);
  }
  res.json({ success: true, data: list });
});

// 9.2. Du khách gửi đánh giá (Chính sách minh bạch: Bắt buộc đơn COMPLETED & chống spam)
app.post('/api/reviews', async (req, res) => {
  const { bookingId, tourId, rating, comment, photos, authorName, authorAvatar, userId } = req.body;

  if (!bookingId || !rating || !comment) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ mã đơn đặt chỗ, số sao và nhận xét.' });
  }

  // 1. Kiểm tra đơn đặt tour
  let booking = bookingsData.find(
    (b) => b.id === bookingId || b.bookingCode === bookingId || String(b.bookingId) === String(bookingId)
  );

  try {
    const pool = await getDbPool();
    if (!booking && pool) {
      const cleanBkId = String(bookingId).replace(/^bk-/, '');
      const bkRes = await pool.request()
        .input('bkId', sql.VarChar(100), cleanBkId)
        .input('bkCode', sql.VarChar(100), String(bookingId))
        .query(`SELECT * FROM dbo.bookings WHERE booking_id = @bkId OR booking_code = @bkCode;`);
      if (bkRes.recordset.length > 0) {
        booking = mapDbBookingRow(bkRes.recordset[0]);
      }
    }
  } catch (e) {
    console.warn('[Check Booking Review] Lỗi tra cứu:', e.message);
  }

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy đơn đặt tour tương ứng để đánh giá.'
    });
  }

  // Bắt buộc trạng thái COMPLETED
  if (booking.status !== 'COMPLETED') {
    return res.status(403).json({
      success: false,
      message: 'Chính sách minh bạch: Chỉ những chuyến đi ở trạng thái ĐÃ HOÀN THÀNH (Completed) mới được phép gửi đánh giá nhằm ngăn chặn đánh giá giả mạo.'
    });
  }

  // 2. Chống spam: 1 booking chỉ được đánh giá 1 lần
  try {
    const pool = await getDbPool();
    if (pool) {
      const targetBkId = String(booking.bookingId || booking.id);
      const targetBkCode = String(booking.bookingCode || '');
      const dupCheck = await pool.request()
        .input('bookingId', sql.VarChar(100), targetBkId)
        .input('bookingCode', sql.VarChar(100), targetBkCode)
        .query(`SELECT review_id FROM dbo.reviews WHERE booking_id = @bookingId OR booking_id = @bookingCode;`);
      
      if (dupCheck.recordset.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Đơn đặt tour này đã gửi đánh giá trước đó. Mỗi chuyến đi chỉ được đánh giá duy nhất 1 lần.'
        });
      }

      const effectiveTourId = String(tourId || booking.tourId || 'tour-1');
      const effectiveUserId = String(userId || booking.userId || '3');
      const effectiveAuthor = authorName || booking.contactName || 'Du khách thân thiết';
      const effectiveAvatar = authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';

      const insRes = await pool.request()
        .input('tourId', sql.VarChar(100), effectiveTourId)
        .input('userId', sql.VarChar(100), effectiveUserId)
        .input('bookingId', sql.VarChar(100), targetBkId)
        .input('rating', sql.Int, Number(rating) || 5)
        .input('comment', sql.NVarChar(sql.MAX), String(comment).trim())
        .input('authorName', sql.NVarChar(150), effectiveAuthor)
        .input('authorAvatar', sql.NVarChar(500), effectiveAvatar)
        .query(`
          INSERT INTO dbo.reviews (tour_id, user_id, booking_id, rating, comment, is_visible, author_name, author_avatar, created_at)
          OUTPUT INSERTED.review_id
          VALUES (@tourId, @userId, @bookingId, @rating, @comment, 1, @authorName, @authorAvatar, GETDATE());
        `);

      const newRevId = insRes.recordset[0].review_id;

      if (Array.isArray(photos)) {
        for (const p of photos) {
          if (p && typeof p === 'string' && p.trim()) {
            await pool.request()
              .input('revId', sql.BigInt, newRevId)
              .input('imgUrl', sql.NVarChar(500), p.trim())
              .query(`INSERT INTO dbo.review_images (review_id, image_url) VALUES (@revId, @imgUrl);`);
          }
        }
      }

      // Tạo thông báo trong Notification Hub
      await pool.request()
        .input('userId', sql.VarChar(100), effectiveUserId)
        .input('type', sql.VarChar(50), 'REVIEW_SUCCESS')
        .input('channel', sql.VarChar(20), 'IN_APP')
        .input('title', sql.NVarChar(200), 'Đánh giá chuyến đi thành công!')
        .input('message', sql.NVarChar(sql.MAX), `Cảm ơn bạn đã gửi đánh giá ${rating}★ cho chuyến đi "${booking.tourTitle}". Đánh giá của bạn đã được xuất bản công khai!`)
        .input('dataPayload', sql.NVarChar(sql.MAX), JSON.stringify({ reviewId: newRevId, tourId: effectiveTourId }))
        .query(`
          INSERT INTO dbo.notifications (user_id, type, channel, title, message, data_payload, is_read, created_at)
          VALUES (@userId, @type, @channel, @title, @message, @dataPayload, 0, GETDATE());
        `);

      cache.del('reviews');
      cache.del('tours');

      return res.status(201).json({
        success: true,
        message: 'Cảm ơn bạn đã gửi đánh giá chuyến đi! Đánh giá đã được lưu vào hệ thống.',
        data: {
          id: `rev-${newRevId}`,
          reviewId: newRevId,
          tourId: effectiveTourId,
          rating: Number(rating),
          comment,
          authorName: effectiveAuthor,
          photos: photos || [],
          date: new Date().toLocaleDateString('vi-VN'),
          isVerifiedCompleted: true
        }
      });
    }
  } catch (err) {
    console.error('[POST /api/reviews] Lỗi lưu review SQL Server:', err.message);
  }

  // Fallback in-memory
  const newReview = {
    id: `rev-${Date.now()}`,
    tourId: tourId || booking.tourId,
    bookingId: booking.id,
    authorName: authorName || booking.contactName,
    authorAvatar: authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    rating: Number(rating) || 5,
    date: new Date().toLocaleDateString('vi-VN'),
    comment,
    photos: photos || [],
    isVisible: true,
    isVerifiedCompleted: true
  };
  reviewsData.unshift(newReview);

  res.status(201).json({
    success: true,
    message: 'Cảm ơn bạn đã gửi đánh giá chuyến đi!',
    data: newReview
  });
});

// 9.3. Admin: Lấy toàn bộ danh sách đánh giá phục vụ kiểm duyệt (Review Moderation)
app.get('/api/admin/reviews', async (req, res) => {
  try {
    const pool = await getDbPool();
    if (pool) {
      const result = await pool.request().query(`
        SELECT r.review_id, r.tour_id, r.booking_id, r.user_id, r.author_name, r.author_avatar,
               r.rating, r.comment, r.is_visible, r.admin_reply, r.admin_reply_at, r.created_at,
               b.tour_title, b.booking_code
        FROM dbo.reviews r
        LEFT JOIN dbo.bookings b ON (r.booking_id = CAST(b.booking_id AS VARCHAR(100)) OR r.booking_id = b.booking_code)
        ORDER BY r.created_at DESC;
      `);
      const imagesResult = await pool.request().query('SELECT review_id, image_url FROM dbo.review_images;');

      const reviews = result.recordset.map((r) => {
        const photos = imagesResult.recordset
          .filter((img) => img.review_id === r.review_id)
          .map((img) => img.image_url);

        return {
          id: `rev-${r.review_id}`,
          reviewId: r.review_id,
          tourId: r.tour_id,
          tourTitle: r.tour_title || 'Tour du lịch Travel With Me',
          bookingId: r.booking_id,
          bookingCode: r.booking_code || r.booking_id,
          userId: r.user_id,
          authorName: r.author_name,
          authorAvatar: r.author_avatar,
          rating: Number(r.rating),
          comment: r.comment,
          isVisible: Boolean(r.is_visible),
          adminReply: r.admin_reply || null,
          adminReplyAt: r.admin_reply_at ? new Date(r.admin_reply_at).toLocaleString('vi-VN') : null,
          photos,
          date: new Date(r.created_at).toLocaleDateString('vi-VN')
        };
      });

      return res.json({ success: true, data: reviews });
    }
  } catch (err) {
    console.error('[GET /api/admin/reviews] Lỗi SQL Server:', err.message);
  }

  // Fallback
  res.json({ success: true, data: reviewsData });
});

// 9.4. Admin: Kiểm duyệt ẩn / hiện đánh giá
app.patch('/api/admin/reviews/:id/visibility', async (req, res) => {
  const { id } = req.params;
  const { isVisible } = req.body;
  const cleanId = String(id).replace(/^rev-/, '');

  try {
    const pool = await getDbPool();
    if (pool) {
      await pool.request()
        .input('revId', sql.BigInt, cleanId)
        .input('visible', sql.Bit, Boolean(isVisible))
        .query(`UPDATE dbo.reviews SET is_visible = @visible WHERE review_id = @revId;`);

      cache.del('reviews');
      cache.del('tours');
      return res.json({
        success: true,
        message: isVisible ? 'Đã hiển thị đánh giá công khai' : 'Đã ẩn đánh giá khỏi giao diện website'
      });
    }
  } catch (err) {
    console.error('[PATCH /api/admin/reviews/:id/visibility] Lỗi:', err.message);
  }

  // Fallback in-memory
  const found = reviewsData.find((r) => r.id === id || String(r.reviewId) === cleanId);
  if (found) found.isVisible = Boolean(isVisible);
  res.json({ success: true, message: isVisible ? 'Đã hiển thị đánh giá' : 'Đã ẩn đánh giá' });
});

// 9.5. Admin: Phản hồi đánh giá của khách hàng (Official Admin Reply)
app.post('/api/admin/reviews/:id/reply', async (req, res) => {
  const { id } = req.params;
  const replyContent = req.body.reply || req.body.adminReply;
  const cleanId = String(id).replace(/^rev-/, '');

  if (!replyContent || !String(replyContent).trim()) {
    return res.status(400).json({ success: false, message: 'Nội dung phản hồi không được để trống' });
  }

  try {
    const pool = await getDbPool();
    if (pool) {
      await pool.request()
        .input('revId', sql.BigInt, cleanId)
        .input('reply', sql.NVarChar(sql.MAX), String(replyContent).trim())
        .query(`
          UPDATE dbo.reviews
          SET admin_reply = @reply, admin_reply_at = GETDATE()
          WHERE review_id = @revId;
        `);

      cache.del('reviews');
      cache.del('tours');
      return res.json({
        success: true,
        message: 'Đã gửi phản hồi chính thức từ Ban Quản Trị thành công!',
        data: { adminReply: String(replyContent).trim(), adminReplyAt: new Date().toLocaleDateString('vi-VN') }
      });
    }
  } catch (err) {
    console.error('[POST /api/admin/reviews/:id/reply] Lỗi:', err.message);
  }

  // Fallback
  const found = reviewsData.find((r) => r.id === id || String(r.reviewId) === cleanId);
  if (found) {
    found.adminReply = String(replyContent).trim();
    found.adminReplyAt = new Date().toLocaleDateString('vi-VN');
  }
  res.json({ success: true, message: 'Đã gửi phản hồi' });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. PHÂN HỆ CỘNG ĐỒNG DU LỊCH & NHẬT KÝ HÀNH TRÌNH (TRAVEL BLOG UGC)
// ─────────────────────────────────────────────────────────────────────────────

// 10.1. Lấy danh sách bài viết nhật ký hành trình cộng đồng
app.get('/api/community/posts', cacheMiddleware(20, 'community'), async (req, res) => {
  const { tag, tourId, keyword } = req.query;
  try {
    const pool = await getDbPool();
    if (pool) {
      let query = `
        SELECT p.post_id, p.author_id, p.author_name, p.author_avatar, p.tour_id,
               p.title, p.slug, p.summary, p.content, p.thumbnail_url, p.trip_badge,
               p.travel_tips, p.location_tags, p.likes_count, p.comments_count,
               p.published_at, p.created_at,
               t.title AS tour_title, t.departure_location, t.adult_price, t.duration_days, t.duration_nights
        FROM dbo.blog_posts p
        LEFT JOIN dbo.tours t ON (p.tour_id = CAST(t.tour_id AS VARCHAR(100)) OR p.tour_id = ('tour-' + CAST(t.tour_id AS VARCHAR(100))))
        WHERE p.is_published = 1
      `;

      if (tourId) {
        query += ` AND p.tour_id = @tourId`;
      }
      if (keyword) {
        query += ` AND (p.title LIKE @kw OR p.summary LIKE @kw OR p.location_tags LIKE @kw)`;
      }
      query += ` ORDER BY p.created_at DESC;`;

      const request = pool.request();
      if (tourId) request.input('tourId', sql.VarChar(100), String(tourId));
      if (keyword) request.input('kw', sql.NVarChar(200), `%${keyword.trim()}%`);

      const result = await request.query(query);
      const posts = result.recordset.map((row) => ({
        id: `post-${row.post_id}`,
        postId: row.post_id,
        authorId: row.author_id,
        authorName: row.author_name,
        authorAvatar: row.author_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        tourId: row.tour_id,
        tourInfo: row.tour_title ? {
          title: row.tour_title,
          departureLocation: row.departure_location,
          price: Number(row.adult_price),
          duration: `${row.duration_days}N${row.duration_nights}Đ`
        } : null,
        title: row.title,
        slug: row.slug,
        summary: row.summary,
        content: row.content,
        thumbnailUrl: row.thumbnail_url,
        tripBadge: row.trip_badge,
        travelTips: row.travel_tips,
        locationTags: row.location_tags ? row.location_tags.split(',').map((s) => s.trim()) : [],
        likesCount: Number(row.likes_count || 0),
        commentsCount: Number(row.comments_count || 0),
        date: new Date(row.published_at || row.created_at).toLocaleDateString('vi-VN')
      }));

      return res.json({ success: true, data: posts });
    }
  } catch (err) {
    console.error('[GET /api/community/posts] Lỗi:', err.message);
  }

  res.json({ success: true, data: [] });
});

// 10.2. Lấy chi tiết bài viết kèm danh sách bình luận
app.get('/api/community/posts/:id', async (req, res) => {
  const { id } = req.params;
  const cleanId = String(id).replace(/^post-/, '');

  try {
    const pool = await getDbPool();
    if (pool) {
      const postRes = await pool.request()
        .input('postId', sql.BigInt, cleanId)
        .query(`
          SELECT p.*, t.title AS tour_title, t.departure_location, t.adult_price
          FROM dbo.blog_posts p
          LEFT JOIN dbo.tours t ON (p.tour_id = CAST(t.tour_id AS VARCHAR(100)) OR p.tour_id = ('tour-' + CAST(t.tour_id AS VARCHAR(100))))
          WHERE p.post_id = @postId;
        `);

      if (postRes.recordset.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
      }

      const p = postRes.recordset[0];
      const commRes = await pool.request()
        .input('postId', sql.BigInt, cleanId)
        .query(`
          SELECT * FROM dbo.blog_comments
          WHERE post_id = @postId
          ORDER BY created_at DESC;
        `);

      const comments = commRes.recordset.map((c) => ({
        id: `comm-${c.comment_id}`,
        authorName: c.author_name,
        authorAvatar: c.author_avatar,
        content: c.content,
        date: new Date(c.created_at).toLocaleDateString('vi-VN')
      }));

      return res.json({
        success: true,
        data: {
          id: `post-${p.post_id}`,
          postId: p.post_id,
          title: p.title,
          summary: p.summary,
          content: p.content,
          thumbnailUrl: p.thumbnail_url,
          authorName: p.author_name,
          authorAvatar: p.author_avatar,
          tripBadge: p.trip_badge,
          travelTips: p.travel_tips,
          locationTags: p.location_tags ? p.location_tags.split(',').map((s) => s.trim()) : [],
          likesCount: Number(p.likes_count),
          commentsCount: Number(p.comments_count),
          tourId: p.tour_id,
          tourTitle: p.tour_title,
          date: new Date(p.created_at).toLocaleDateString('vi-VN'),
          comments
        }
      });
    }
  } catch (err) {
    console.error('[GET /api/community/posts/:id] Lỗi:', err.message);
  }

  res.status(500).json({ success: false, message: 'Lỗi tải bài viết' });
});

// 10.3. Du khách đăng tải bài viết nhật ký hành trình UGC
app.post('/api/community/posts', async (req, res) => {
  const { title, summary, content, thumbnailUrl, tourId, travelTips, locationTags, authorName, authorAvatar, tripBadge, userId } = req.body;

  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Tiêu đề và nội dung nhật ký hành trình không được để trống' });
  }

  const slug = `${createSlug(title)}-${Date.now().toString(36)}`;
  const effectiveAuthor = authorName || 'Du khách đam mê xê dịch';
  const effectiveAvatar = authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
  const effectiveBadge = tripBadge || 'Chuyến đi thực tế đã xác thực';

  try {
    const pool = await getDbPool();
    if (pool) {
      const result = await pool.request()
        .input('authorId', sql.VarChar(100), String(userId || '3'))
        .input('authorName', sql.NVarChar(150), effectiveAuthor)
        .input('authorAvatar', sql.NVarChar(500), effectiveAvatar)
        .input('tourId', sql.VarChar(100), tourId ? String(tourId) : null)
        .input('title', sql.NVarChar(255), title.trim())
        .input('slug', sql.VarChar(270), slug)
        .input('summary', sql.NVarChar(500), summary ? summary.trim() : title.trim())
        .input('content', sql.NVarChar(sql.MAX), content.trim())
        .input('thumbnailUrl', sql.NVarChar(500), thumbnailUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80')
        .input('tripBadge', sql.NVarChar(150), effectiveBadge)
        .input('travelTips', sql.NVarChar(sql.MAX), travelTips ? travelTips.trim() : null)
        .input('locationTags', sql.NVarChar(255), locationTags || 'Du lịch Việt Nam, Trải nghiệm')
        .query(`
          INSERT INTO dbo.blog_posts (
            author_id, author_name, author_avatar, tour_id, title, slug, summary, content,
            thumbnail_url, trip_badge, travel_tips, location_tags, likes_count, comments_count, is_published, published_at, created_at
          )
          OUTPUT INSERTED.post_id
          VALUES (
            @authorId, @authorName, @authorAvatar, @tourId, @title, @slug, @summary, @content,
            @thumbnailUrl, @tripBadge, @travelTips, @locationTags, 0, 0, 1, GETDATE(), GETDATE()
          );
        `);

      const newPostId = result.recordset[0].post_id;

      // Tạo thông báo trong Notification Hub
      await pool.request()
        .input('userId', sql.VarChar(100), String(userId || '3'))
        .input('type', sql.VarChar(50), 'COMMUNITY')
        .input('channel', sql.VarChar(20), 'IN_APP')
        .input('title', sql.NVarChar(200), 'Nhật ký hành trình đã được xuất bản!')
        .input('message', sql.NVarChar(sql.MAX), `Bài viết "${title}" của bạn đã được xuất bản lên không gian cộng đồng Travel With Me. Hãy cùng chia sẻ để lan tỏa cảm hứng du lịch nhé!`)
        .input('dataPayload', sql.NVarChar(sql.MAX), JSON.stringify({ postId: newPostId }))
        .query(`
          INSERT INTO dbo.notifications (user_id, type, channel, title, message, data_payload, is_read, created_at)
          VALUES (@userId, @type, @channel, @title, @message, @dataPayload, 0, GETDATE());
        `);

      cache.del('community');

      return res.status(201).json({
        success: true,
        message: 'Đăng tải nhật ký hành trình lên cộng đồng thành công!',
        data: {
          id: `post-${newPostId}`,
          postId: newPostId,
          title,
          slug
        }
      });
    }
  } catch (err) {
    console.error('[POST /api/community/posts] Lỗi:', err.message);
    res.status(500).json({ success: false, message: 'Không thể đăng tải bài viết lúc này' });
  }
});

// 10.4. Tương tác Thích (Like) bài viết
app.post('/api/community/posts/:id/like', async (req, res) => {
  const { id } = req.params;
  const cleanId = String(id).replace(/^post-/, '');

  try {
    const pool = await getDbPool();
    if (pool) {
      const upd = await pool.request()
        .input('postId', sql.BigInt, cleanId)
        .query(`
          UPDATE dbo.blog_posts
          SET likes_count = likes_count + 1
          OUTPUT INSERTED.likes_count
          WHERE post_id = @postId;
        `);

      cache.del('community');
      const newLikes = upd.recordset[0]?.likes_count || 1;
      return res.json({ success: true, likesCount: newLikes });
    }
  } catch (err) {
    console.error('[POST /api/community/posts/:id/like] Lỗi:', err.message);
  }
  res.json({ success: true, likesCount: 1 });
});

// 10.5. Bình luận bài viết cộng đồng
app.post('/api/community/posts/:id/comments', async (req, res) => {
  const { id } = req.params;
  const { content, authorName, authorAvatar, userId } = req.body;
  const cleanId = String(id).replace(/^post-/, '');

  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, message: 'Nội dung bình luận không được để trống' });
  }

  const effectiveAuthor = authorName || 'Du khách thân thiết';
  const effectiveAvatar = authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

  try {
    const pool = await getDbPool();
    if (pool) {
      const insRes = await pool.request()
        .input('postId', sql.BigInt, cleanId)
        .input('userId', sql.VarChar(100), String(userId || '3'))
        .input('authorName', sql.NVarChar(150), effectiveAuthor)
        .input('authorAvatar', sql.NVarChar(500), effectiveAvatar)
        .input('content', sql.NVarChar(sql.MAX), content.trim())
        .query(`
          INSERT INTO dbo.blog_comments (post_id, user_id, author_name, author_avatar, content, created_at)
          OUTPUT INSERTED.comment_id
          VALUES (@postId, @userId, @authorName, @authorAvatar, @content, GETDATE());

          UPDATE dbo.blog_posts
          SET comments_count = comments_count + 1
          WHERE post_id = @postId;
        `);

      cache.del('community');

      return res.status(201).json({
        success: true,
        message: 'Đã gửi bình luận thành công',
        data: {
          id: `comm-${insRes.recordset[0].comment_id}`,
          authorName: effectiveAuthor,
          authorAvatar: effectiveAvatar,
          content: content.trim(),
          date: new Date().toLocaleDateString('vi-VN')
        }
      });
    }
  } catch (err) {
    console.error('[POST /api/community/posts/:id/comments] Lỗi:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi gửi bình luận' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. PHÂN HỆ TRUNG TÂM THÔNG BÁO ĐA KÊNH (NOTIFICATION HUB)
// ─────────────────────────────────────────────────────────────────────────────

// 11.1. Lấy danh sách thông báo của tài khoản đang đăng nhập
app.get('/api/notifications', async (req, res) => {
  const { userId } = req.query;
  const targetUser = String(userId || '3');

  try {
    const pool = await getDbPool();
    if (pool) {
      const result = await pool.request()
        .input('userId', sql.VarChar(100), targetUser)
        .query(`
          SELECT * FROM dbo.notifications
          WHERE user_id = @userId OR user_id = 'all'
          ORDER BY created_at DESC;
        `);

      const notifications = result.recordset.map((n) => {
        let payload = null;
        if (n.data_payload) {
          try {
            payload = typeof n.data_payload === 'string' ? JSON.parse(n.data_payload) : n.data_payload;
          } catch {
            payload = {};
          }
        }
        return {
          id: `notif-${n.notification_id}`,
          notificationId: n.notification_id,
          type: n.type,
          channel: n.channel, // IN_APP, EMAIL, SMS, ZALO
          title: n.title,
          message: n.message,
          data: payload,
          isRead: Boolean(n.is_read),
          time: new Date(n.created_at).toLocaleString('vi-VN')
        };
      });

      return res.json({ success: true, data: notifications });
    }
  } catch (err) {
    console.error('[GET /api/notifications] Lỗi:', err.message);
  }

  res.json({ success: true, data: [] });
});

// 11.2. Đánh dấu 1 thông báo đã đọc
app.patch('/api/notifications/:id/read', async (req, res) => {
  const { id } = req.params;
  const cleanId = String(id).replace(/^notif-/, '');

  try {
    const pool = await getDbPool();
    if (pool) {
      await pool.request()
        .input('notifId', sql.BigInt, cleanId)
        .query(`UPDATE dbo.notifications SET is_read = 1 WHERE notification_id = @notifId;`);
    }
  } catch (err) {
    console.warn('[PATCH /api/notifications/:id/read] Lỗi:', err.message);
  }
  res.json({ success: true, message: 'Đã đánh dấu đã đọc' });
});

// 11.3. Đánh dấu tất cả thông báo đã đọc
app.post('/api/notifications/read-all', async (req, res) => {
  const { userId } = req.body;
  const targetUser = String(userId || '3');

  try {
    const pool = await getDbPool();
    if (pool) {
      await pool.request()
        .input('userId', sql.VarChar(100), targetUser)
        .query(`UPDATE dbo.notifications SET is_read = 1 WHERE user_id = @userId;`);
    }
  } catch (err) {
    console.warn('[POST /api/notifications/read-all] Lỗi:', err.message);
  }
  res.json({ success: true, message: 'Đã đánh dấu tất cả đã đọc' });
});

// 11.4. Tự động hóa thông báo: Kích hoạt quét và gửi nhắc lịch trước 24 giờ qua Email, SMS, Zalo ZNS
app.post('/api/notifications/simulate-reminder', async (req, res) => {
  const { bookingCode, channel } = req.body;
  const targetChannel = channel || 'ZALO'; // EMAIL, SMS, ZALO

  try {
    const pool = await getDbPool();
    if (pool) {
      const bookingRes = await pool.request()
        .input('code', sql.VarChar(100), bookingCode || 'TWM-20261017-001')
        .query(`SELECT TOP 1 * FROM dbo.bookings WHERE booking_code = @code OR booking_status = 'CONFIRMED';`);

      const bk = bookingRes.recordset[0];
      const targetUser = bk ? String(bk.user_id) : '3';
      const tourTitle = bk ? bk.tour_title : 'Tour Khám Phá Vịnh Hạ Long';

      const reminderTitle = targetChannel === 'ZALO'
        ? 'Nhắc lịch khởi hành trước 24 giờ (Zalo ZNS tự động)'
        : (targetChannel === 'SMS' ? 'Nhắc lịch khởi hành (SMS Brandname)' : 'Thông báo lịch khởi hành & Hướng dẫn viên (Email)');

      const reminderMsg = `Kính gửi Quý khách ${bk?.contact_name || 'Nguyễn Quốc Hùng'}! Chuyến đi "${tourTitle}" sẽ khởi hành vào 07:30 sáng mai. Hướng dẫn viên phụ trách: Lê Minh Quân (SĐT: 0912.888.999). Quý khách vui lòng chuẩn bị CCCD và xem vé điện tử đính kèm.`;

      await pool.request()
        .input('userId', sql.VarChar(100), targetUser)
        .input('type', sql.VarChar(50), 'TRIP_REMINDER_24H')
        .input('channel', sql.VarChar(20), targetChannel)
        .input('title', sql.NVarChar(200), reminderTitle)
        .input('message', sql.NVarChar(sql.MAX), reminderMsg)
        .input('dataPayload', sql.NVarChar(sql.MAX), JSON.stringify({ bookingCode: bk?.booking_code, action: 'VIEW_TICKET' }))
        .query(`
          INSERT INTO dbo.notifications (user_id, type, channel, title, message, data_payload, is_read, created_at)
          VALUES (@userId, @type, @channel, @title, @message, @dataPayload, 0, GETDATE());
        `);

      return res.json({
        success: true,
        message: `Đã gửi thông báo nhắc lịch khởi hành trước 24 giờ qua kênh ${targetChannel} thành công!`,
        data: { channel: targetChannel, title: reminderTitle, message: reminderMsg }
      });
    }
  } catch (err) {
    console.error('[simulate-reminder] Lỗi:', err.message);
  }

  res.json({ success: true, message: 'Đã mô phỏng gửi nhắc lịch khởi hành thành công' });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. PHÂN HỆ ĐA TIỀN TỆ & TỶ GIÁ THỜI GIAN THỰC (MULTI-CURRENCY)
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/exchange-rates', cacheMiddleware(3600, 'rates'), (req, res) => {
  // Tỷ giá chuẩn theo thị trường ngoại hối quốc tế 2026 (Base VND)
  const rates = {
    base: 'VND',
    updatedAt: new Date().toISOString(),
    rates: {
      VND: 1,
      USD: 0.0000393,    // 1 USD ~ 25,450 VND
      EUR: 0.0000368,    // 1 EUR ~ 27,200 VND
      JPY: 0.00595       // 1 JPY ~ 168 VND
    },
    symbols: {
      VND: '₫',
      USD: '$',
      EUR: '€',
      JPY: '¥'
    }
  };

  res.json({ success: true, data: rates });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. GIÁM SÁT HIỆU NĂNG BỘ NHỚ ĐỆM (CACHE & REDIS PERFORMANCE)
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/cache/stats', (req, res) => {
  res.json({ success: true, data: cache.getStats() });
});

app.post('/api/cache/flush', async (req, res) => {
  await cache.flush();
  res.json({ success: true, message: 'Đã dọn dẹp toàn bộ bộ nhớ đệm (Flush Cache) thành công!' });
});

// 10. Admin: Lấy toàn bộ danh sách đơn đặt tour từ SQL Server (kết nối tất cả tài khoản khách)
app.get('/api/admin/bookings', async (req, res) => {
  try {
    const pool = await getDbPool();
    if (pool) {
      const result = await pool.request().query(`
        SELECT * FROM dbo.bookings
        ORDER BY created_at DESC;
      `);
      const bookings = result.recordset.map(mapDbBookingRow);
      bookingsData = bookings; // Đồng bộ in-memory
      return res.json({ success: true, data: bookings });
    }
  } catch (err) {
    console.error('[GET /api/admin/bookings] Lỗi SQL Server:', err.message);
  }
  return res.json({ success: true, data: bookingsData });
});

// 11. Admin: Thống kê & Báo cáo Dashboard (Tổng hợp trực tiếp từ SQL Server)
app.get('/api/admin/dashboard', async (req, res) => {
  try {
    const pool = await getDbPool();
    if (pool) {
      // 1. Thống kê tổng quan từ SQL Server dbo.bookings
      const summaryResult = await pool.request().query(`
        SELECT 
          COUNT(*) AS totalBookings,
          COUNT(CASE WHEN booking_status = 'COMPLETED' THEN 1 END) AS completedBookings,
          COUNT(CASE WHEN booking_status IN ('PAID', 'CONFIRMED', 'COMPLETED', 'IN_TOUR') THEN 1 END) AS paidOrConfirmedBookings,
          ISNULL(SUM(CASE WHEN booking_status IN ('PAID', 'CONFIRMED', 'COMPLETED', 'IN_TOUR') THEN total_amount ELSE 0 END), 0) AS totalRevenue,
          COUNT(CASE WHEN booking_status IN ('CANCELLED', 'REFUNDED') THEN 1 END) AS cancelledBookings
        FROM dbo.bookings;
      `);

      const s = summaryResult.recordset[0] || {};
      const totalBookings = Number(s.totalBookings) || 0;
      const totalRevenue = Number(s.totalRevenue) || 0;
      const completedBookings = Number(s.completedBookings) || 0;
      const cancelledBookings = Number(s.cancelledBookings) || 0;
      const cancellationRate = totalBookings > 0 ? Number(((cancelledBookings / totalBookings) * 100).toFixed(1)) : 0;

      // 2. Doanh thu 6 tháng gần nhất từ dbo.bookings trong SQL Server
      const chartResult = await pool.request().query(`
        SELECT 
          MONTH(created_at) AS month_num,
          YEAR(created_at) AS year_num,
          ISNULL(SUM(CASE WHEN booking_status IN ('PAID', 'CONFIRMED', 'COMPLETED', 'IN_TOUR') THEN total_amount ELSE 0 END), 0) AS revenue,
          COUNT(*) AS order_count
        FROM dbo.bookings
        GROUP BY YEAR(created_at), MONTH(created_at)
        ORDER BY year_num ASC, month_num ASC;
      `);

      let revenueChart = [];
      if (chartResult.recordset && chartResult.recordset.length > 0) {
        revenueChart = chartResult.recordset.map((row) => {
          const rev = Number(row.revenue);
          const millions = (rev / 1000000).toFixed(rev % 1000000 === 0 ? 0 : 1);
          return {
            month: `Tháng ${row.month_num}`,
            monthNum: row.month_num,
            year: row.year_num,
            revenue: rev,
            val: Number(millions),
            label: `${millions} triệu`
          };
        });
      }

      if (revenueChart.length === 0) {
        revenueChart = [
          { month: 'Tháng 5', revenue: 42500000, val: 42.5, label: '42.5 triệu' },
          { month: 'Tháng 6', revenue: 68000000, val: 68, label: '68 triệu' },
          { month: 'Tháng 7', revenue: 95200000, val: 95.2, label: '95.2 triệu' },
          { month: 'Tháng 8', revenue: 78400000, val: 78.4, label: '78.4 triệu' },
          { month: 'Tháng 9', revenue: 84100000, val: 84.1, label: '84.1 triệu' },
          { month: 'Tháng 10', revenue: 112800000, val: 112.8, label: '112.8 triệu' }
        ];
      }

      const tourCountResult = await pool.request().query('SELECT COUNT(*) AS activeTours FROM dbo.tours WHERE is_active = 1;');
      const activeTours = Number(tourCountResult.recordset[0]?.activeTours) || toursData.length || 4;

      return res.json({
        success: true,
        data: {
          summary: {
            totalRevenue,
            totalBookings,
            completedBookings,
            cancelledBookings,
            cancellationRate,
            activeTours
          },
          revenueChart,
          topTours: toursData.slice(0, 3).map((t) => ({
            id: t.id,
            title: t.title,
            bookingsCount: t.reviewCount,
            rating: t.ratingAverage
          }))
        }
      });
    }
  } catch (err) {
    console.error('[GET /api/admin/dashboard] Lỗi truy vấn SQL Server:', err.message);
  }

  // Fallback in-memory
  const totalBookings = bookingsData.length;
  const completedOrPaid = bookingsData.filter(
    (b) => b.status === 'CONFIRMED' || b.status === 'PAID' || b.status === 'COMPLETED' || b.status === 'IN_TOUR'
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
        completedBookings: bookingsData.filter((b) => b.status === 'COMPLETED').length,
        cancelledBookings,
        cancellationRate: totalBookings ? Number(((cancelledBookings / totalBookings) * 100).toFixed(1)) : 0,
        activeTours: toursData.filter((t) => t.status === 'ACTIVE').length
      },
      revenueChart: [
        { month: 'Tháng 5', revenue: 42500000, val: 42.5, label: '42.5 triệu' },
        { month: 'Tháng 6', revenue: 68000000, val: 68, label: '68 triệu' },
        { month: 'Tháng 7', revenue: 95200000, val: 95.2, label: '95.2 triệu' },
        { month: 'Tháng 8', revenue: 78400000, val: 78.4, label: '78.4 triệu' },
        { month: 'Tháng 9', revenue: 84100000, val: 84.1, label: '84.1 triệu' },
        { month: 'Tháng 10', revenue: 112800000, val: 112.8, label: '112.8 triệu' }
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

// 12. Admin: Cập nhật trạng thái đơn đặt (Lưu trực tiếp vào SQL Server)
app.patch('/api/admin/bookings/:id/status', async (req, res) => {
  const { status } = req.body;
  const rawId = req.params.id;
  const numericId = rawId.startsWith('bk-') ? Number(rawId.replace('bk-', '')) : Number(rawId);

  if (!status) {
    return res.status(400).json({ success: false, message: 'Thiếu trạng thái cần cập nhật' });
  }

  let paymentStatus = null;
  if (['PAID', 'CONFIRMED', 'COMPLETED', 'IN_TOUR'].includes(status)) {
    paymentStatus = 'PAID';
  } else if (['CANCELLED', 'REFUNDED'].includes(status)) {
    paymentStatus = 'REFUNDED';
  } else if (status === 'PENDING_PAYMENT') {
    paymentStatus = 'PENDING';
  }

  let updatedRow = null;

  try {
    const pool = await getDbPool();
    if (pool) {
      const request = pool.request().input('status', status);

      let query = '';
      if (!isNaN(numericId) && numericId > 0) {
        request.input('bookingId', numericId);
        query = `
          UPDATE dbo.bookings 
          SET booking_status = @status, 
              ${paymentStatus ? `payment_status = '${paymentStatus}',` : ''}
              updated_at = GETDATE()
          OUTPUT INSERTED.*
          WHERE booking_id = @bookingId;
        `;
      } else {
        request.input('bookingCode', rawId);
        query = `
          UPDATE dbo.bookings 
          SET booking_status = @status, 
              ${paymentStatus ? `payment_status = '${paymentStatus}',` : ''}
              updated_at = GETDATE()
          OUTPUT INSERTED.*
          WHERE booking_code = @bookingCode;
        `;
      }

      const result = await request.query(query);
      if (result.recordset && result.recordset.length > 0) {
        updatedRow = mapDbBookingRow(result.recordset[0]);
      }
    }
  } catch (err) {
    console.error('[PATCH /api/admin/bookings/:id/status] Lỗi SQL Server:', err.message);
  }

  // Cập nhật in-memory
  const bookingInMemory = bookingsData.find((b) => b.id === rawId || b.bookingCode === rawId || b.bookingId === numericId);
  if (bookingInMemory) {
    bookingInMemory.status = status;
    if (paymentStatus) bookingInMemory.paymentStatus = paymentStatus;
  }

  if (updatedRow) {
    const idx = bookingsData.findIndex((b) => b.id === updatedRow.id);
    if (idx !== -1) bookingsData[idx] = updatedRow;
    else bookingsData.unshift(updatedRow);

    return res.json({
      success: true,
      message: `Cập nhật trạng thái đơn sang ${status} thành công trên SQL Server`,
      data: updatedRow
    });
  }

  if (bookingInMemory) {
    return res.json({
      success: true,
      message: `Cập nhật trạng thái đơn sang ${status} thành công`,
      data: bookingInMemory
    });
  }

  return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
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

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`[Travel With Me API] Server running at http://localhost:${PORT} (LAN: http://0.0.0.0:${PORT})`);
  try {
    const pool = await getDbPool();
    console.log('[Travel With Me API] ✅ Đã kết nối thành công với Microsoft SQL Server (Database: TravelWithMe)!');
  } catch (err) {
    console.warn('[Travel With Me API] ⚠️ Chưa thể kết nối SQL Server:', err.message);
  }
});
